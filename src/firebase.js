// see: https://firebase.google.com/docs/web/setup

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getFirestore } from 'firebase/firestore';



const firebaseConfig = {
  apiKey: 'AIzaSyBIT80p5JZYHSJuzbdYN8lSt-dEUg0iLwk',
  authDomain: 'cerebrus-maximus.firebaseapp.com',
  projectId: 'cerebrus-maximus',
  storageBucket: 'cerebrus-maximus.appspot.com',
  messagingSenderId: '803778313104',
  appId: '1:803778313104:web:60ec29352469ab271b1115',
  measurementId: 'G-DVW52JJP6W',
};

const app = firebase.initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
export default app;