// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPpaywIixkHL7pI0PvzZkgiMZ4sXw85EI",
  authDomain: "cotejo-28d51.firebaseapp.com",
  databaseURL: "https://cotejo-28d51-default-rtdb.firebaseio.com",
  projectId: "cotejo-28d51",
  storageBucket: "cotejo-28d51.firebasestorage.app",
  messagingSenderId: "929402491866",
  appId: "1:929402491866:android:69ecce9a2fd99236fa26e3",
  measurementId: "G-QB18GGPVZH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (Optional, works only on web and supported platforms)
//let analytics;
//if (typeof window !== "undefined") {
//  analytics = getAnalytics(app);
//}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Realtime Database
const database = getDatabase(app);

// Initialize Authentication with persistence in React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Export all initialized services
export { app, db, auth, database }; //,analytics
