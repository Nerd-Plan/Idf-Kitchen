// src/firebase/seedFirestore.js
// Run once: import { seedAll } from './firebase/seedFirestore'; seedAll();

import { db } from './firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

// --- DEFAULT STAFF array ---
const STAFF = [
  { id: 's1', name: 'רב-סמל כהן', role: 'admin', pinHash: '...', avatar: '👨‍✈️', color: '#fbbf24', active: true },
  { id: 's2', name: 'טבח ראשי לוי', role: 'cook', pinHash: '...', avatar: '👨‍🍳', color: '#22c55e', active: true },
  { id: 's3', name: 'עוזר טבח מזרחי', role: 'cook', pinHash: '...', avatar: '🧑‍🍳', color: '#06b6d4', active: true },
];

async function seedStaff() {
    const batch = writeBatch(db);
    STAFF.forEach(s => {
        const { id, ...data } = s;
        batch.set(doc(db, 'staff', id), data);
    });
    await batch.commit();
    console.log('Staff seeded');
}

async function seedKitchenConfig() {
    await setDoc(doc(db, 'kitchen', 'main'), {
        diners: 100,
        ratios: { protein: 250, side: 100, salad: 150, vegetable: 120 },
        locations: {
            fridges: ['מקרר 1', 'מקרר 2'],
            cabinets: ['ארון חימום 1', 'ארון חימום 2', 'ארון חימום 3'],
            coolingName: 'מיכל קירור - בשר טרי'
        },
        inventoryCategories: [
            { key: 'vegetables', label: 'ירקות טריים', accent: '#22c55e', type: 'vegetable' },
            { key: 'dairy', label: 'מוצרי חלב', accent: '#818cf8', type: 'other' },
            { key: 'eggs', label: 'ביצים', accent: '#fbbf24', type: 'other' },
            { key: 'poultry', label: 'עוף ועופות', accent: '#f97316', type: 'protein' },
            { key: 'frozenMeat', label: 'בשר קפוא', accent: '#06b6d4', type: 'protein' },
        ],
        morningCooks: ['s2'],
        dailyMenu: {
            breakfast: [{ name: 'ביצים מקושקשות', desc: 'עם ירקות טריים' }],
            lunch: [{ name: 'פנה ארביאטה', desc: 'פסטה ברוטב עגבניות' }],
            dinner: [{ name: 'מרק ירקות', desc: 'ציר ביתי' }],
        }
    });
    console.log('Kitchen config seeded');
}

async function seedInventory() {
    const batch = writeBatch(db);
    const categories = {
        vegetables: [
            { id: '1', name: 'עגבניות', qty: 12.5, unit: 'ק"ג', min: 5 },
            { id: '2', name: 'מלפפונים', qty: 8, unit: 'ק"ג', min: 4 },
        ],
        dairy: [
            { id: '7', name: 'חלב', qty: 20, unit: 'ליטר', min: 8 },
            { id: '8', name: 'גבינה לבנה', qty: 6.5, unit: 'ק"ג', min: 3 },
        ],
        eggs: [
            { id: '11', name: 'ביצים L', qty: 120, unit: 'יח', min: 40 },
        ],
        // ... add poultry, frozenMeat, cooling the same way
    };

    Object.entries(categories).forEach(([cat, items]) => {
        batch.set(doc(db, 'inventory', cat), { items });
    });

    await batch.commit();
    console.log('Inventory seeded');
}

async function seedMorningTasks() {
    const batch = writeBatch(db);
    const tasks = [
        { text: 'הדלקת תנורים ובדיקת טמפרטורות', done: false },
        { text: 'ניקוי משטחי עבודה וסניטציה', done: false },
        { text: 'הוצאת חומרי גלם מהקירור', done: false },
        { text: 'הכנת ציוד ושקילה ראשונית', done: false },
        { text: 'בדיקת מלאי ועדכון חסרים', done: false },
    ];

    tasks.forEach((t, i) => {
        batch.set(doc(db, 'morningTasks', 'mt' + (i + 1)), t);
    });

    await batch.commit();
    console.log('Morning tasks seeded');
}

export async function seedAll() {
    await seedStaff();
    await seedKitchenConfig();
    await seedInventory();
    await seedMorningTasks();
    console.log('ALL DATA SEEDED - remove seedAll() call now!');
}
