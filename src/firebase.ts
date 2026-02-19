// configure Firebase app and shared services

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// Goddamn google:
// AILED_PRECONDITION: The Cloud Firestore API is not available for Firestore in Datastore Mode
// you have to specfify the firestore 
// import { setLogLevel } from "firebase/firestore";
// setLogLevel("debug");
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING as string | undefined,

  measurementId: import.meta.env.VITE_FIREBASE_MESUREMENT as string | undefined,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// export const db = getFirestore(app, "ai-dictionary");
// export const functions = getFunctions(app, "europe-west3");
