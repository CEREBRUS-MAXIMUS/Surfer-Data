import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import SubscribeCard from '../components/subscribe/SubscribeCard';
import Checkout from '../components/subscribe/Checkout';  // Import the Checkout component
import { useAuth } from '../auth/FirebaseAuth'
import app from '../../firebase'; 
import { getAuth } from 'firebase/auth';
import { getPremiumStatus, getPortalUrl } from '@/src/main/utils/stripe';
import { getFirestore, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

const UserProfile = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
    const { currentUser } = useAuth();
    const auth = getAuth(app);

    useEffect(() => {
        if (!currentUser) return; 

        const db = getFirestore(app);
        const subscriptionsRef = collection(db, 'Users', currentUser.uid, 'subscriptions');
        const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const isActive = snapshot.docs.length > 0;
            setIsSubscribed(isActive);
            setShowCheckout(!isActive); 

            if (isActive) {
                const cancelledQuery = query(subscriptionsRef, where('cancel_at_period_end', '==', true));
                const cancelledDocs = await getDocs(cancelledQuery);
                const isCancelled = cancelledDocs.docs.length > 0;
                setIsCancelled(isCancelled);

                if (isCancelled) {
                    const subscriptionData = cancelledDocs.docs[0].data();
                    const endDate = subscriptionData.current_period_end?.toDate();
                    setSubscriptionEndDate(endDate);
                } else {
                    setSubscriptionEndDate(null);
                }
            } else {
                setIsCancelled(false);
                setSubscriptionEndDate(null);
            }
        }, (error) => {
            console.error("Error listening to subscription changes:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);


    const handleCancelSubscription = async () => {
        const portalUrl = await getPortalUrl(app);
        window.electron.ipcRenderer.send('open-external', portalUrl);
    };

    const handleSignOut = async () => {
        setIsSubscribed(false);
        await auth.signOut();
    };

    const formatDate = (date) => {
        return date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
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
                            <p><strong>Subscription Status:</strong> {isCancelled 
                                ? `Cancelled (Active until ${formatDate(subscriptionEndDate)})` 
                                : 'Active'}
                            </p>
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
                                >
                                    Manage Subscription
                                </Button>
                            
                        </div>
                    </CardContent>
                </Card>
            ) : currentUser ? (
                showCheckout ? <Checkout handleSignOut={handleSignOut}/> : <SubscribeCard />
            ) : (
                <SubscribeCard />
            )}
        </div>
    );
};

export default UserProfile;
