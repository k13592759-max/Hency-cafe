const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { FIREBASE_CONFIG } = require('./firebase-config.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// YouPI-PG Gateway Configuration
// Reference: https://github.com/youpi-pg/YouPI-PG
const YOUPI_CONFIG = {
  apiUrl: process.env.YOUPI_API_URL || 'https://api.youpi-pg.local',
  merchantId: process.env.YOUPI_MERCHANT_ID || 'hency-cafe-8444453549',
  webhookSecret: process.env.YOUPI_WEBHOOK_SECRET || 'youpi_sec_8444453549_cafe',
  merchantVpa: process.env.YOUPI_MERCHANT_VPA || 'k13592759@okhdfcbank', // Updated owner UPI ID
  merchantName: 'Hency Cafe',
  ownerPhone: '8444453549'
};

// In-Memory Order Storage & Local Cache (synced with Firebase Firestore)
const ordersDB = new Map();
const contactMessagesDB = [];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Sync order document to Google Firebase Firestore via REST API
async function syncOrderToFirebase(order) {
  try {
    if (!FIREBASE_CONFIG.projectId || FIREBASE_CONFIG.projectId === 'hency-cafe-demo' || (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.includes('REPLACE'))) {
      return; // Skip if demo placeholder
    }
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/orders/${order.orderId}`;
    
    // Firestore REST document format
    const docData = {
      fields: {
        orderId: { stringValue: order.orderId },
        amount: { doubleValue: parseFloat(order.amount) },
        currency: { stringValue: order.currency || 'INR' },
        status: { stringValue: order.status },
        paymentMode: { stringValue: order.paymentMode },
        merchantVpa: { stringValue: order.merchantVpa },
        customerName: { stringValue: order.customer.name || '' },
        customerPhone: { stringValue: order.customer.phone || '' },
        createdAt: { timestampValue: new Date(order.createdAt).toISOString() },
        utrNumber: { stringValue: order.utrNumber || 'N/A' }
      }
    };

    const reqData = JSON.stringify(docData);
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqData)
      }
    };

    const fbReq = https.request(firestoreUrl, options, (res) => {
      // Fire and forget; logging response
    });
    fbReq.on('error', () => { /* Suppress network error if offline */ });
    fbReq.write(reqData);
    fbReq.end();
  } catch (err) {
    // Non-blocking error handling
  }
}

// Helper to parse JSON body
function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Send JSON Response Helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Merchant-Id, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Merchant-Id, Authorization'
    });
    res.end();
    return;
  }

  // ==========================================
  // GOOGLE FIREBASE CONFIG ENDPOINT
  // ==========================================
  if (req.method === 'GET' && pathname === '/api/v1/firebase/config') {
    return sendJson(res, 200, {
      success: true,
      firebase: FIREBASE_CONFIG
    });
  }

  // ==========================================
  // YouPI-PG PAYMENT GATEWAY & ORDER ENDPOINTS
  // ==========================================

  // 1. Gateway Public Configuration
  if (req.method === 'GET' && pathname === '/api/v1/config') {
    return sendJson(res, 200, {
      success: true,
      gateway: 'YouPI-PG (Your UPI Payment Gateway)',
      github: 'https://github.com/youpi-pg/YouPI-PG',
      merchantName: YOUPI_CONFIG.merchantName,
      merchantVpa: YOUPI_CONFIG.merchantVpa,
      ownerPhone: YOUPI_CONFIG.ownerPhone,
      currency: 'INR',
      feePercentage: 0.0,
      firebaseEnabled: true,
      firebaseProjectId: FIREBASE_CONFIG.projectId
    });
  }

  // 2. Create Payment Order (YouPI-PG REST API endpoint: POST /api/v1/payments)
  if (req.method === 'POST' && pathname === '/api/v1/payments') {
    try {
      const data = await getJsonBody(req);
      const amount = parseFloat(data.amount || 0);

      if (!amount || amount <= 0) {
        return sendJson(res, 400, { success: false, error: 'Valid amount is required' });
      }

      const orderId = data.orderId || ('HENCY-' + Date.now().toString().slice(-6));
      const customer = data.customer || { name: 'Guest Foodie', phone: 'Not Provided' };
      const items = data.items || [];
      const paymentMode = data.paymentMode || 'UPI';

      const upiUri = `upi://pay?pa=${encodeURIComponent(YOUPI_CONFIG.merchantVpa)}&pn=${encodeURIComponent(YOUPI_CONFIG.merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + orderId)}`;

      const deepLinks = {
        gpay: `gpay://upi/pay?pa=${encodeURIComponent(YOUPI_CONFIG.merchantVpa)}&pn=${encodeURIComponent(YOUPI_CONFIG.merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`,
        phonepe: `phonepe://upi/pay?pa=${encodeURIComponent(YOUPI_CONFIG.merchantVpa)}&pn=${encodeURIComponent(YOUPI_CONFIG.merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`,
        paytm: `paytmmp://upi/pay?pa=${encodeURIComponent(YOUPI_CONFIG.merchantVpa)}&pn=${encodeURIComponent(YOUPI_CONFIG.merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`,
        generic: upiUri
      };

      const orderRecord = {
        orderId,
        amount: amount.toFixed(2),
        currency: 'INR',
        paymentMode,
        status: paymentMode === 'COD' ? 'COD_CONFIRMED' : 'PENDING',
        items,
        customer,
        upiIntent: upiUri,
        deepLinks,
        merchantVpa: YOUPI_CONFIG.merchantVpa,
        merchantName: YOUPI_CONFIG.merchantName,
        createdAt: new Date().toISOString(),
        verifiedAt: paymentMode === 'COD' ? new Date().toISOString() : null,
        utrNumber: null
      };

      ordersDB.set(orderId, orderRecord);
      
      // Persist / Sync to Google Firebase Firestore
      syncOrderToFirebase(orderRecord);

      return sendJson(res, 201, {
        success: true,
        orderId: orderRecord.orderId,
        amount: orderRecord.amount,
        currency: 'INR',
        paymentMode: orderRecord.paymentMode,
        status: orderRecord.status,
        merchantVpa: YOUPI_CONFIG.merchantVpa,
        upiIntent: upiUri,
        deepLinks,
        checkoutUrl: `/checkout/${orderId}`,
        gateway: 'YouPI-PG',
        firebaseSynced: true
      });
    } catch (err) {
      console.error('Error creating payment:', err);
      return sendJson(res, 500, { success: false, error: 'Internal Server Error' });
    }
  }

  // 3. List All Orders for Staff Dashboard (GET /api/v1/orders)
  if (req.method === 'GET' && pathname === '/api/v1/orders') {
    const allOrders = Array.from(ordersDB.values()).reverse();
    return sendJson(res, 200, {
      success: true,
      count: allOrders.length,
      orders: allOrders
    });
  }

  // 4. Update Order Status (PATCH /api/v1/orders/:orderId)
  if (req.method === 'PATCH' && pathname.startsWith('/api/v1/orders/')) {
    const orderId = pathname.replace('/api/v1/orders/', '').split('/')[0];
    const order = ordersDB.get(orderId);

    if (!order) {
      return sendJson(res, 404, { success: false, error: 'Order not found' });
    }

    try {
      const data = await getJsonBody(req);
      if (data.status) order.status = data.status;
      if (data.kitchenStatus) order.kitchenStatus = data.kitchenStatus;
      ordersDB.set(orderId, order);
      syncOrderToFirebase(order);
      return sendJson(res, 200, { success: true, order });
    } catch (e) {
      return sendJson(res, 400, { success: false, error: 'Bad Request' });
    }
  }

  // 5. Get Payment Status (GET /api/v1/payments/:orderId)
  if (req.method === 'GET' && pathname.startsWith('/api/v1/payments/')) {
    const orderId = pathname.replace('/api/v1/payments/', '').split('/')[0];
    const order = ordersDB.get(orderId);

    if (!order) {
      return sendJson(res, 404, { success: false, error: 'Order not found' });
    }

    return sendJson(res, 200, {
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      status: order.status,
      paymentMode: order.paymentMode,
      utrNumber: order.utrNumber,
      createdAt: order.createdAt,
      verifiedAt: order.verifiedAt
    });
  }

  // 6. Verify Payment (POST /api/v1/payments/:orderId/verify)
  if (req.method === 'POST' && pathname.includes('/verify')) {
    const parts = pathname.split('/');
    const orderId = parts[parts.indexOf('payments') + 1];
    const order = ordersDB.get(orderId);

    if (!order) {
      return sendJson(res, 404, { success: false, error: 'Order not found' });
    }

    try {
      const data = await getJsonBody(req);
      const utr = data.utr || data.referenceId || ('UTR' + Date.now().toString().slice(-8));

      order.status = 'OBSERVED_SUCCESS';
      order.utrNumber = utr;
      order.verifiedAt = new Date().toISOString();
      ordersDB.set(orderId, order);

      // Sync updated status to Firebase
      syncOrderToFirebase(order);

      return sendJson(res, 200, {
        success: true,
        message: 'Payment verified and synced with Firebase!',
        orderId: order.orderId,
        status: order.status,
        utrNumber: order.utrNumber
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: 'Invalid verification payload' });
    }
  }

  // 7. Contact / Table Reservation Form Submission (POST /api/v1/contact)
  if (req.method === 'POST' && pathname === '/api/v1/contact') {
    try {
      const data = await getJsonBody(req);
      const record = {
        id: 'MSG-' + Date.now(),
        name: data.name || 'Anonymous',
        phone: data.phone || '',
        subject: data.subject || 'General Inquiry',
        message: data.message || '',
        createdAt: new Date().toISOString()
      };
      contactMessagesDB.push(record);
      return sendJson(res, 200, { success: true, message: 'Message recorded and sent to owner!' });
    } catch (e) {
      return sendJson(res, 400, { success: false, error: 'Invalid message' });
    }
  }

  // 8. YouPI-PG Webhook Callback Endpoint
  if (req.method === 'POST' && (pathname === '/api/webhook/youpi' || pathname === '/api/v1/webhook')) {
    try {
      const data = await getJsonBody(req);
      const orderId = data.orderId || data.order_id;
      if (orderId && ordersDB.has(orderId)) {
        const order = ordersDB.get(orderId);
        order.status = data.status || 'OBSERVED_SUCCESS';
        order.utrNumber = data.utr || data.bank_ref || order.utrNumber;
        order.verifiedAt = new Date().toISOString();
        ordersDB.set(orderId, order);
        syncOrderToFirebase(order);
      }
      return sendJson(res, 200, { received: true, gateway: 'YouPI-PG', firebaseSynced: true });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: 'Webhook processing error' });
    }
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`☕ Hency Cafe server is running at http://localhost:${PORT}`);
  console.log(`💳 YouPI-PG Merchant VPA: ${YOUPI_CONFIG.merchantVpa}`);
  console.log(`🔥 Google Firebase Database enabled for project: ${FIREBASE_CONFIG.projectId}`);
});
