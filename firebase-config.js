// ==========================================
// Google Firebase Configuration — Hency Cafe
// Project: hency-cafe
// App ID:  1:563260378433:web:a4f944cccfc5a09321e5c0
// ==========================================
// Services enabled:
//   • Firebase Authentication  (Email / Password)
//   • Cloud Firestore           (orders, contacts, users)
// ==========================================

const FIREBASE_CONFIG = {
  apiKey:            process.env.FIREBASE_API_KEY            || "AIzaSyDGOWY1e8JD9C4Qcr4_mzm6SUfMILXzH4Y",
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || "hency-cafe.firebaseapp.com",
  projectId:         process.env.FIREBASE_PROJECT_ID         || "hency-cafe",
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || "hency-cafe.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "563260378433",
  appId:             process.env.FIREBASE_APP_ID             || "1:563260378433:web:a4f944cccfc5a09321e5c0"
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIREBASE_CONFIG };
}
