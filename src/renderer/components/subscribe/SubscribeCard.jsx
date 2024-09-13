import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Check } from 'lucide-react';
import { Button } from "../ui/button";
import SignInModal from './SignInModal'; 
import { useAuth } from '../../auth/FirebaseAuth';

const SubscribeCard = () => {
	const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

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
							onClick={() => setIsSignInModalOpen(true)}
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
