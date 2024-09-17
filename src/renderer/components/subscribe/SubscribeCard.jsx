import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Check } from 'lucide-react';
import { Button } from "../ui/button";
import SignInModal from './SignInModal'; 
import { useAuth } from '../../auth/FirebaseAuth';
import { signInWithCredential, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { Input } from "../ui/input"; // Add this import

const SubscribeCard = () => {
	const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
	const [isProduction, setIsProduction] = useState(true);
	const [showTokenInput, setShowTokenInput] = useState(false);
	const [userToken, setUserToken] = useState('');
	const { currentUser } = useAuth();
		const handleToken = async (token) => {
			console.log('Received token, sign in with credential now:', token);
			const auth = getAuth();
			const credential = GoogleAuthProvider.credential(token);
			const result = await signInWithCredential(auth, credential);
			console.log('Sign-in result:', result);
		};

	useEffect(() => {

		window.electron.ipcRenderer.on('token', handleToken);

		// Check if it's production mode

		return () => {
			window.electron.ipcRenderer.removeAllListeners('token', handleToken);
		};
	}, []);

	const handleSubscribeClick = async () => {
		const isProduction = await window.electron.ipcRenderer.invoke('is-production')
		console.log('Is production:', isProduction)
		window.electron.ipcRenderer.send('open-external', 'https://surfsup.ai/signin');
		if (!isProduction) {
			console.log('Not in production, setting production to false')
			setIsProduction(false)
			setShowTokenInput(true)
		}
	}

	const handleTokenSubmit = (e) => {
		e.preventDefault();
		console.log('User token:', userToken);
		handleToken(userToken);
		setShowTokenInput(false);
		setUserToken('');
	}

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
					<CardFooter className="flex flex-col space-y-2">
						<Button 
							className="w-full"
							onClick={handleSubscribeClick}
						>
							Subscribe
						</Button>
						{!isProduction && showTokenInput && (
							<form onSubmit={handleTokenSubmit} className="w-full space-y-2">
								<p>Enter your user token (sign in on website + look at console for token)</p>
								<Input
									type="text"
									placeholder="Enter your token"
									value={userToken}
									onChange={(e) => setUserToken(e.target.value)}
								/>
								<Button type="submit" className="w-full">
									Submit Token
								</Button>
							</form>
						)}
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
