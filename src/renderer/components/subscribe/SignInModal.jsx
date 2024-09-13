import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Chrome } from 'lucide-react';  
import { useAuth } from '../../auth/FirebaseAuth';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// Add these constants at the top of your file
const CLIENT_ID = '803778313104-8jf9djf9dkbj1feccrehc4n8qgjq2s5k.apps.googleusercontent.com';
const REDIRECT_URI = 'https://cerebrus-maximus.firebaseapp.com/__/auth/handler';
const SCOPE = 'email profile'; // Add any additional scopes you need

const SignInModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showWebview, setShowWebview] = useState(false);
  const webviewRef = useRef(null);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      await app.auth().signInWithEmailAndPassword(email, password);
      onClose();
    } catch (error) {
      console.error('Email sign-in error:', error);
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Starting Google Sign In process');
    setShowWebview(true);
  };

  const buildGoogleSignInUrl = () => {
    const url = `https://second-auth-frontend.vercel.app/`;
    console.log('Built Google Sign In URL:', url);
    return url;
  };

  useEffect(() => {
    if (showWebview && webviewRef.current) {
      const webview = webviewRef.current;
      console.log('Webview initialized');

      const handleNavigation = (event) => {
        const currentURL = event.url;
        console.log('Navigation event:', currentURL);
        
        if (currentURL.includes('access_token=')) {
          console.log('Access token found in URL');
          const urlParams = new URLSearchParams(currentURL.split('#')[1] || currentURL.split('?')[1]);
          const accessToken = urlParams.get('access_token');
          if (accessToken) {
            console.log('Access token extracted:', accessToken);
            handleTokenSignIn(accessToken);
          } else {
            console.error('Access token not found in URL params');
          }
        }
      };

      const handleMessage = (event) => {
        console.log('IPC message received:', event);
        if (event.channel === 'ACCESS_TOKEN') {
          console.log('ACCESS_TOKEN message received');
          handleTokenSignIn(event.args[0].token);
        }
      };

      webview.addEventListener('will-navigate', handleNavigation);
      webview.addEventListener('did-navigate', handleNavigation);
      webview.addEventListener('did-navigate-in-page', handleNavigation);
      webview.addEventListener('ipc-message', handleMessage);

      return () => {
        webview.removeEventListener('will-navigate', handleNavigation);
        webview.removeEventListener('did-navigate', handleNavigation);
        webview.removeEventListener('did-navigate-in-page', handleNavigation);
        webview.removeEventListener('ipc-message', handleMessage);
      };
    }
  }, [showWebview]);

  const handleTokenSignIn = async (accessToken) => {
    try {
      console.log('Attempting to sign in with token:', accessToken);
      const auth = getAuth();
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const result = await signInWithCredential(auth, credential);
      console.log('Sign in successful:', result.user);
      setShowWebview(false);
      onClose();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }; 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
        {showWebview ? (
          <webview
            src={buildGoogleSignInUrl()}
            style={{ width: '100%', height: '400px' }}
            ref={webviewRef}
            allowpopups="true"
            nodeintegration="true"
            webpreferences="contextIsolation=false"
          />
        ) : (
          <div className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full">
              <Chrome className="mr-2" /> Sign in with Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
