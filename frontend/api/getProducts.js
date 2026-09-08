// api/get-products.js
import dotenv from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Vercel supplies env vars in production; dotenv fills them for local Vercel Dev.
dotenv.config({ path: '.env.local' });

const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);
let db;
let initializationError;

if (!missingEnv.length) {
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    db = getFirestore();
  } catch (error) {
    initializationError = error.message;
  }
}

export default async function handler(req, res) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (missingEnv.length) {
    return res.status(500).json({
      success: false,
      message: `Missing Firebase environment variables: ${missingEnv.join(', ')}`,
    });
  }

  if (initializationError || !db) {
    return res.status(500).json({
      success: false,
      message: initializationError || 'Firebase Admin could not be initialized',
    });
  }

  try {
    // Lấy toàn bộ dữ liệu từ collection "products" trên Firestore
    const querySnapshot = await db.collection('products').get();
    
    const products = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Chuyển đổi Firestore Timestamp thành định dạng chuỗi/số nếu cần để JSON không bị lỗi
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
      };
    });

    // Trả về dữ liệu dạng JSON thuần túy cho Frontend
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error("Lỗi API get-products:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}