const fs = require('fs');
const path = require('path');

const MENU_CATEGORIES = [
  { id: 'ALL', label: 'ALL', icon: '✨', count: 44 },
  { id: 'TEA / COFFEE', label: 'TEA / COFFEE', icon: '☕', count: 4 },
  { id: 'MAGGI', label: 'MAGGI', icon: '🍜', count: 6 },
  { id: 'SANDWICH', label: 'SANDWICH', icon: '🥪', count: 5 },
  { id: 'PIZZA', label: 'PIZZA', icon: '🍕', count: 7 },
  { id: 'MOMOS', label: 'MOMOS', icon: '🥟', count: 5 },
  { id: 'FRENCH FRY', label: 'FRENCH FRY', icon: '🍟', count: 5 },
  { id: 'CHINESE', label: 'CHINESE', icon: '🥢', count: 6 },
  { id: 'SHAKES', label: 'SHAKES', icon: '🥤', count: 6 }
];

const ITEMS = [
  // TEA / COFFEE (4)
  { id: 1, category: 'TEA / COFFEE', name: 'Tea', price: 15, tag: 'Classic Kadak', desc: 'Freshly brewed aromatic ginger-cardamom tea simmered with fresh milk', img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 2, category: 'TEA / COFFEE', name: 'Hot Coffee', price: 25, tag: 'Warm Comfort', desc: 'Creamy steamed milk infused with rich roasted Arabica coffee', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 3, category: 'TEA / COFFEE', name: 'Cold Coffee', price: 50, tag: 'Bestseller', desc: 'Thick, creamy chilled whipped coffee blended with sweet vanilla cream', img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 4, category: 'TEA / COFFEE', name: 'Chocolate Cold Coffee', price: 80, tag: 'Signature', desc: 'Chilled coffee blended with rich Belgian chocolate syrup and cocoa', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80', popular: true },

  // MAGGI (6)
  { id: 5, category: 'MAGGI', name: 'Masala Maggi', price: 40, tag: 'Street Style', desc: 'Classic 2-minute nostalgia cooked with golden aromatic spices and butter', img: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 6, category: 'MAGGI', name: 'Veggie Maggi', price: 55, tag: 'Garden Fresh', desc: 'Tossed with crunchy capsicum, sweet corn, carrots, and diced onions', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 7, category: 'MAGGI', name: 'Cheese Corn Maggi', price: 65, tag: 'Cheesy Hit', desc: 'Loaded with melted mozzarella and golden sweet corn kernels', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 8, category: 'MAGGI', name: 'Paneer Maggi', price: 70, tag: 'Protein Rich', desc: 'Soft spiced cottage cheese cubes infused in hot masala maggi broth', img: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 9, category: 'MAGGI', name: 'Tandoori Tadka Maggi', price: 80, tag: 'Chef Special', desc: 'Smoky tandoori seasoning finished with sizzling buttery chili garlic tadka', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 10, category: 'MAGGI', name: 'Cafe Spl. Maggi', price: 100, tag: 'Super Loaded', desc: 'Double cheese, paneer chunks, fresh veggies & secret Hency spices', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80', popular: true },

  // SANDWICH (5)
  { id: 11, category: 'SANDWICH', name: 'Garlic Bread', price: 40, tag: 'Crispy Toast', desc: 'Warm herb-infused garlic butter toasted bread slices with parsley', img: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 12, category: 'SANDWICH', name: 'Mix Veg S/W', price: 50, tag: 'Classic Fresh', desc: 'Layered with crisp cucumber, tomato, potato, mint chutney & chat masala', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 13, category: 'SANDWICH', name: 'Cheese Corn S/W', price: 60, tag: 'Melty Favor', desc: 'Grilled golden sandwich stuffed with melted cheese and sweet corn', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 14, category: 'SANDWICH', name: 'Paneer Special S/W', price: 70, tag: 'House Fav', desc: 'Tikka marinated paneer chunks grilled with herbs and creamy mozzarella', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 15, category: 'SANDWICH', name: 'Cafe Special S/W', price: 100, tag: 'Club Loaded', desc: 'Triple decker toast with paneer, cheese burst, corn & chef special dressing', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80', popular: true },

  // PIZZA (7)
  { id: 16, category: 'PIZZA', name: 'Margherita Pizza', price: 80, tag: 'Classic Cheesy', desc: 'Hand-stretched crust, Italian marinara sauce & 100% mozzarella cheese', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 17, category: 'PIZZA', name: 'Onion & Capsicum Pizza', price: 80, tag: 'Crunchy Bite', desc: 'Freshly diced crunchy onions and green bell peppers on melted cheese', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 18, category: 'PIZZA', name: 'Corn Cheese Pizza', price: 80, tag: 'All Time Fav', desc: 'Sweet golden American corn layered under rich gooey melted mozzarella', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 19, category: 'PIZZA', name: 'All Veggie Pizza', price: 90, tag: 'Garden Feast', desc: 'Onions, capsicum, tomatoes, sweet corn and black olives over herb crust', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 20, category: 'PIZZA', name: 'Spicy Peri Peri Pizza', price: 100, tag: 'Zesty Kick', desc: 'Fiery peri-peri glazed vegetables with hot melted cheese and paprika', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 21, category: 'PIZZA', name: 'Spicy Paneer Pizza', price: 120, tag: 'Desi Delight', desc: 'Tikka marinated paneer cubes with onion, red paprika, and loaded mozzarella', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 22, category: 'PIZZA', name: 'Overload Cheese Pizza', price: 150, tag: 'Cheese Heaven', desc: 'Double cheese burst with mozzarella, cheddar, garlic butter & herbs', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80', popular: true },

  // MOMOS (5)
  { id: 23, category: 'MOMOS', name: 'Veg Momos', price: 60, tag: 'Steamed (6 Pc)', desc: 'Soft thin-skinned steamed dumplings stuffed with spiced shredded vegetables', img: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 24, category: 'MOMOS', name: 'Veg Momos Fry', price: 70, tag: 'Crispy (6 Pc)', desc: 'Golden deep-fried dumplings served with spicy garlic schezwan chutney', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 25, category: 'MOMOS', name: 'Paneer Momos', price: 80, tag: 'Steamed (6 Pc)', desc: 'Juicy steamed momos filled with seasoned spiced cottage cheese and herbs', img: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 26, category: 'MOMOS', name: 'Paneer Momos Fry', price: 90, tag: 'Crisp (6 Pc)', desc: 'Crunchy deep-fried paneer dumplings paired with spicy mayo & red dip', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 27, category: 'MOMOS', name: 'Fry with Peri Peri', price: 110, tag: 'Spicy (6 Pc)', desc: 'Golden momos tossed generously in fiery and tangy African peri-peri dust', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', popular: true },

  // FRENCH FRY (5)
  { id: 28, category: 'FRENCH FRY', name: 'Classic Salted Fry', price: 50, tag: 'Crisp Golden', desc: 'Crispy hot potato fries tossed with fine Himalayan sea salt', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 29, category: 'FRENCH FRY', name: 'Peri Peri Fry', price: 60, tag: 'Zesty Spice', desc: 'Hot golden fries tossed with zesty spicy peri-peri seasoning', img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 30, category: 'FRENCH FRY', name: 'Masala Fry', price: 60, tag: 'Desi Tangy', desc: 'Seasoned with tangy chaat masala, lemon drizzle and Indian herbs', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 31, category: 'FRENCH FRY', name: 'Cheese Fry', price: 70, tag: 'Gooey Melt', desc: 'Crispy fries drizzled generously with warm melted cheddar cheese sauce', img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 32, category: 'FRENCH FRY', name: 'Corn Chat', price: 50, tag: 'Tangy Bowl', desc: 'Steamed sweet corn kernels tossed with butter, lime juice and chaat masala', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80', popular: true },

  // CHINESE (6)
  { id: 33, category: 'CHINESE', name: 'Veg Noodles / Rice', price: 80, tag: 'Wok Tossed', desc: 'Fresh hakka noodles or aromatic rice stir-fried with crisp garden vegetables', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 34, category: 'CHINESE', name: 'Shezwan Noodles / Rice', price: 90, tag: 'Spicy Wok', desc: 'Wok-tossed in fiery homemade Schezwan sauce with scallions and peppers', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 35, category: 'CHINESE', name: 'Manchurian Noodles / Rice', price: 90, tag: 'Fusion Combo', desc: 'Stir-fried noodles or rice combined with crisp vegetable Manchurian dumplings', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 36, category: 'CHINESE', name: 'Manchurian Dry / Gravy', price: 80, tag: 'Dry 80/- • Gravy 100/-', desc: 'Crispy vegetable dumplings glazed in savory oriental ginger garlic sauce', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', popular: true, displayPrice: '80 / 100' },
  { id: 37, category: 'CHINESE', name: 'Crispy Veg', price: 100, tag: 'Crunchy Munch', desc: 'Crispy tempura fried seasonal vegetables tossed in sweet chili garlic glaze', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 38, category: 'CHINESE', name: 'Veg Pulao', price: 100, tag: 'Fragrant Rice', desc: 'Fragrant basmati rice gently cooked with whole spices, green peas and paneer', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80', popular: false },

  // SHAKES (6)
  { id: 39, category: 'SHAKES', name: 'Oreo Shake', price: 90, tag: 'Choco Crunch', desc: 'Rich milkshake blended with crushed Oreo cookies, vanilla ice cream & syrup', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 40, category: 'SHAKES', name: 'Kit Kat Shake', price: 90, tag: 'Wafer Delight', desc: 'Crunchy chocolate Kit Kat fingers whipped into rich thick milk', img: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 41, category: 'SHAKES', name: 'Dairy Milk Shake', price: 90, tag: 'Silky Cocoa', desc: 'Pure Dairy Milk chocolate melted and blended into velvety thick shake', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80', popular: true },
  { id: 42, category: 'SHAKES', name: 'Chocolate Shake', price: 90, tag: 'Pure Cocoa', desc: 'Classic double chocolate shake topped with dark chocolate drizzle', img: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 43, category: 'SHAKES', name: 'Strawberry Shake', price: 90, tag: 'Fruity Bliss', desc: 'Sweet strawberry puree blended with creamy milk and ice cream', img: 'https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=500&q=80', popular: false },
  { id: 44, category: 'SHAKES', name: 'Pineapple Shake', price: 80, tag: 'Tropical Sip', desc: 'Refreshing tropical pineapple shake with sweet notes and rich milk', img: 'https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=500&q=80', popular: false }
];

console.log('Categories count:', MENU_CATEGORIES.length);
console.log('Items count:', ITEMS.length);

module.exports = { MENU_CATEGORIES, ITEMS };
