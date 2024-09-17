import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../renderer/components/ui/card";
import { Input } from "../../renderer/components/ui/input";
import { Button } from "../../renderer/components/ui/button";
import { ScrollArea } from "../../renderer/components/ui/scroll-area";
import { Badge } from "../../renderer/components/ui/badge";
import { setCurrentRoute, updateBreadcrumb } from '../state/actions';
import SubscribeCard from '../components/subscribe/SubscribeCard';
import { similaritySearch } from '../vector_db';
import { useAuth } from '../auth/FirebaseAuth';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import app from '../../firebase'

const Chat = () => { 
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef(null); 
  const dispatch = useDispatch();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { currentUser } = useAuth();


    useEffect(() => {
        if (!currentUser) {
          dispatch(setCurrentRoute('/profile'))
          return; 
        }

        const db = getFirestore(app);
        const subscriptionsRef = collection(db, 'Users', currentUser.uid, 'subscriptions');
        const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const isActive = snapshot.docs.length > 0;
            console.log('isActive: ', isActive);
            setIsSubscribed(isActive);
            if (!isActive) {
                dispatch(setCurrentRoute('/profile'))
              }
        }, (error) => {
            console.error("Error listening to subscription changes:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    dispatch(updateBreadcrumb([{ text: 'Home', link: '/home' }]));
  }, [dispatch]);




  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      // Add user message
      setMessages(prevMessages => [...prevMessages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');

      const similarData = await similaritySearch(inputMessage);

      console.log('similarData: ', similarData);
      // Add bot response with similar data
      if (similarData.length > 0) {
        const botResponse = (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarData.map((item, index) => (
                <Card key={index} className="w-full">
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription> 
                      <Badge variant="secondary">
                        Similarity: {(item.score * 100).toFixed(2)}%
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        setMessages(prevMessages => [...prevMessages, { content: botResponse, sender: 'bot' }]);
      } else {
        setMessages(prevMessages => [...prevMessages, { text: "I couldn't find any similar data.", sender: 'bot' }]);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen p-4"> 
        {isSubscribed ? (
          <>
          <Card className="flex-grow mb-4">
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
                {messages.map((message, index) => (
                  // Add key prop to the outer div
                  <div key={`message-${index}`} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block rounded-lg py-2 px-3 ${
                      message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {message.text || message.content}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </> 
       ) : (
          null
      )}
    </div>
  );
};

export default Chat;
