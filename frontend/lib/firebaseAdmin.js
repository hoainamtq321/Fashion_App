import dotenv from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

dotenv.config({ path: '.env.local' });

let db;

function getFirebaseAdminApp() {
  const requiredVariables = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length) {
    throw new Error(`Missing Firebase Admin environment variables: ${missingVariables.join(', ')}`);
  }

  const existingApp = getApps().find((app) => app.name === '[DEFAULT]');
  return existingApp || initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    },
  );
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getDb() {
  if (db) return db;

  db = getFirestore(getFirebaseAdminApp());
  return db;
}