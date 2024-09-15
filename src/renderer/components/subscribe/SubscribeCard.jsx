import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Check } from 'lucide-react';
import { Button } from "../ui/button";
import SignInModal from './SignInModal'; 
import { useAuth } from '../../auth/FirebaseAuth';
import { signInWithCredential, getAuth, GoogleAuthProvider } from 'firebase/auth';

const SubscribeCard = () => {
	const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
	//const { currentUser } = useAuth();

	useEffect(() => {

		const handleToken = async (token) => {
			console.log('Received token, sign in with credential now:', token);
			const auth = getAuth();
			const credential = GoogleAuthProvider.credential(token);
			const result = await signInWithCredential(auth, credential);
			console.log('Sign-in result:', result);
		};

		window.electron.ipcRenderer.on('token', handleToken);

		return () => {
			window.electron.ipcRenderer.removeAllListeners('token', handleToken);
		};
	}, []);


	return (
		<>
			<div className="flex justify-center space-x-4">
				{/* Free Plan Card */}
				<Card className="w-[300px]">
					<CardHeader>
						<CardTitle>Free Plan</CardTitle>
					</CardHeader>
					<CardContent> 
						<ul className="space-y-2">
							<li className="flex items-center">
								<Check className="mr-2 h-4 w-4" /> Free forever
							</li>
							<li className="flex items-center">
								<Check className="mr-2 h-4 w-4" /> Data export
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button className="w-full" disabled>You are on this plan</Button>
					</CardFooter>
				</Card>

				{/* Paid Plan Card */}
				<Card className="w-[300px]">
					<CardHeader>
						<CardTitle>Paid Plan</CardTitle>
						<CardDescription>$20/month</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							<li className="flex items-center">
								<Check className="mr-2 h-4 w-4" /> Chat with data
							</li>
							<li className="flex items-center">
								<Check className="mr-2 h-4 w-4" /> Knowledge graphs
							</li>
							<li className="flex items-center">
								<Check className="mr-2 h-4 w-4" /> Dynamic dashboards
							</li>
							<li className="flex items-center"> 
								<Check className="mr-2 h-4 w-4" /> All Free Plan features
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button 
							className="w-full"
							onClick={() => window.electron.ipcRenderer.send('open-external', 'https://surfsup.ai/signin')}
						>
							Subscribe
						</Button>
					</CardFooter>
				</Card>
			</div>

			<SignInModal 
				isOpen={isSignInModalOpen} 
				onClose={() => setIsSignInModalOpen(false)} 
			/>
		</>
	);
};

export default SubscribeCard;
