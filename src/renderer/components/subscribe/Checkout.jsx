import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { getCheckoutUrl, getPremiumStatus } from '@/src/main/utils/stripe';
import Tumbler from '../../animations/tumbler.gif';
import { useAuth } from '../../auth/FirebaseAuth';

const Checkout = ({handleSignOut}) => {
    const [stripeURL, setStripeURL] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchStripeURL = async () => {
            try {
                const url = await getCheckoutUrl('price_1PzljpC9lVfKYNdgLVriN1tM');
                setStripeURL(url);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStripeURL();
    }, [currentUser]);

 
    return (
      <Card className="relative">
        <Button 
          onClick={handleSignOut} 
          variant="outline" 
          size="sm" 
          className="absolute top-2 right-2"
        >
          Sign Out
        </Button>
        <CardContent>
          <CardHeader>
            <CardTitle>Upgrade to Premium</CardTitle>
            <CardDescription>
              {isLoading ? 'Preparing checkout...' : 'Scan the QR code or click the link below to upgrade to premium.'}
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col items-center">
            {isLoading ? (
              <img src={Tumbler} alt="Loading..." className="w-64 h-64" />
            ) : (
              <>
                <QRCodeSVG value={stripeURL} size={256} />
                <p className="mt-4">
                  <a href={stripeURL} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    Open in external browser
                  </a>
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
}

export default Checkout;