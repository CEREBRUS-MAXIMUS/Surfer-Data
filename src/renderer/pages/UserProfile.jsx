import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import SubscribeCard from '../components/subscribe/SubscribeCard';
import Checkout from '../components/subscribe/Checkout';  // Import the Checkout component
import { useAuth } from '../auth/FirebaseAuth'
import app from '../../firebase';
import { getAuth } from 'firebase/auth';
import { getPremiumStatus } from '@/src/main/utils/stripe';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';

const UserProfile = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const { currentUser } = useAuth();
    const auth = getAuth(app);

    useEffect(() => {
        if (!currentUser) return; 

        const db = getFirestore(app);
        const subscriptionsRef = collection(db, 'Users', currentUser.uid, 'subscriptions');
        const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setIsSubscribed(snapshot.docs.length > 0);
            setShowCheckout(snapshot.docs.length === 0);
        }, (error) => {
            console.error("Error listening to subscription changes:", error);
        });

        // Clean up the listener when the component unmounts or currentUser changes
        return () => unsubscribe();
    }, [currentUser]);


    const handleCancelSubscription = async () => {
        console.log('Cancel subscription');
    };

    const handleSignOut = async () => {
        setIsSubscribed(false);
        await auth.signOut();
    };

    return (
        <div className="container mx-auto py-10">
            {isSubscribed ? (
                <Card>
                    <CardHeader>
                        <CardTitle>User Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p><strong>Email:</strong> {currentUser.email}</p>
                            <p><strong>Subscription Status:</strong> Active</p>
                        </div>
                        <div className="flex space-x-4">
                            <Button
                                onClick={handleSignOut}
                                variant="outline"
                            >
                                Sign Out
                            </Button>
                            <Button
                                onClick={handleCancelSubscription}
                                variant="destructive"
                            >
                                Cancel Subscription
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : currentUser ? (
                showCheckout ? <Checkout /> : <SubscribeCard />
            ) : (
                <SubscribeCard />
            )}
        </div>
    );
};

export default UserProfile;
