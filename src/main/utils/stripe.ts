'use client';
import { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../firebase';


export const getCheckoutUrl = async (
  priceId: string,
): Promise<string> => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  console.log('user id: ', userId);
  if (!userId) throw new Error('User is not authenticated');

  const db = getFirestore(app);
  const checkoutSessionRef = collection(
    db,
    'Users',
    userId,
    'checkout_sessions',
  );

  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: 'https://surfsup.ai/congrats',
    cancel_url: 'https://surfsup.ai/cancel',
    allow_promotion_codes: true,
  });

  console.log(docRef);

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        error?: { message: string };
        url?: string;
      };
      if (error) {
        unsubscribe();
        reject(new Error(`An error occurred: ${error.message}`));
      }
      if (url) {
        console.log('Stripe Checkout URL:', url);
        unsubscribe();
        resolve(url);
      }
    });
  });
};

export const getPortalUrl = async (app: FirebaseApp): Promise<string> => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  let dataWithUrl: any;
  try {
    const functions = getFunctions(app, 'us-central1');
    const functionRef = httpsCallable(
      functions,
      'ext-firestore-stripe-payments-createPortalLink',
    );
    const { data } = await functionRef({
      customerId: user?.uid,
      returnUrl: 'https://surfsup.ai/return-to-app',
    });

    // Add a type to the data
    dataWithUrl = data as { url: string };
    console.log('Reroute to Stripe portal: ', dataWithUrl.url);
  } catch (error) {
    console.error(error);
  }

  return new Promise<string>((resolve, reject) => {
    if (dataWithUrl.url) {
      resolve(dataWithUrl.url);
    } else {
      reject(new Error('No url returned'));
    }
  });
};

export const getPremiumStatus = async (app: FirebaseApp) => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not logged in');

  const db = getFirestore(app);
  const subscriptionsRef = collection(db, 'Users', userId, 'subscriptions');
  console.log(subscriptionsRef)
  const q = query(
    subscriptionsRef,
    where('status', 'in', ['trialing', 'active']),
  );

  const premiumStatus = await new Promise<boolean>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.docs.length === 0) {
          resolve(false);
        } else {
          resolve(true);
        }
        unsubscribe();
      },
      reject,
    );
  });

  console.log('premium status: ', premiumStatus)

  return premiumStatus;
};

