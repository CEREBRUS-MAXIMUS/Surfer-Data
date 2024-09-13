import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Chrome } from 'lucide-react';

const SignInModal = ({ isOpen, onClose }) => {
  const handleEmailSignIn = (e) => {
    e.preventDefault();
    console.log('Email sign-in clicked');
    // No actual authentication, just close the modal
    onClose();
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign-in clicked');
    // No actual authentication, just close the modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
 