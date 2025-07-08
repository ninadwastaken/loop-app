import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDKTX8Bz2VRBrs-oZ0Kt-1HdLrHVky3OQc",
  authDomain: "loop-541bd.firebaseapp.com",
  projectId: "loop-541bd",
  storageBucket: "loop-541bd.firebasestorage.app",
  messagingSenderId: "40725371964",
  appId: "1:40725371964:web:f2736b9ae5741a5d3eb739",
  measurementId: "G-QFY7WWDPX3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app)
