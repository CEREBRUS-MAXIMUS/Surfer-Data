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
import app from '../../firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import OpenAI from 'openai';

const Chat = () => { 
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef(null); 
  const dispatch = useDispatch();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { currentUser } = useAuth();
  const [platforms, setPlatforms] = useState([]);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

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
    const loadIndexedFolders = async () => {
      const indexedFolders = await window.electron.ipcRenderer.invoke('get-indexed-folders');
      setPlatforms(indexedFolders);
    };
    loadIndexedFolders();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    dispatch(updateBreadcrumb([{ text: 'Home', link: '/home' }]));
  }, [dispatch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    if (value.includes('@') && !selectedPlatform) {
      console.log('opening popover');
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setOpen(false);
    setInputMessage((prev) => {
      const parts = prev.split('@');
      parts[parts.length - 1] = `${platform} `;
      return parts.join('@');
    });
    inputRef.current.focus();
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      // Add user message
      setMessages(prevMessages => [...prevMessages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');
      setIsTyping(true);

      const platformName = selectedPlatform ? selectedPlatform : null;
      const similarData = await similaritySearch(inputMessage, platformName);
      setSelectedPlatform(null);

      let contextData = '';
      if (similarData.length > 0) {
        contextData = similarData.map(item => `${item.name}:\n${item.content}`).join('\n\n');
      }

      const systemMessage = `You are an AI assistant with access to a knowledge base. 
      Use the following context to answer the user's question. If the context doesn't 
      provide enough information, use your general knowledge but make it clear when you're 
      doing so. Context:\n\n${contextData}`;

      try {
        const key = await window.electron.ipcRenderer.invoke('get-openai-api-key');
        const openai = new OpenAI({
          apiKey: key,
          dangerouslyAllowBrowser: true,
        });
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: inputMessage }
          ],
          stream: true,
        });

        let fullResponse = '';
        setMessages(prevMessages => [...prevMessages, { text: '', sender: 'bot' }]);

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullResponse += content;
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1].text = fullResponse;
            return updatedMessages;
          });
        }
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        setMessages(prevMessages => [...prevMessages, { text: "Sorry, I encountered an error while processing your request.", sender: 'bot' }]);
      } finally {
        setIsTyping(false);
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
                  <div key={`message-${index}`} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block rounded-lg py-2 px-3 ${
                      message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {message.text || message.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="mb-4 text-left">
                    <div className="inline-block rounded-lg py-2 px-3 bg-secondary text-secondary-foreground">
                      Typing...
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {open && (
              <div className="mb-2">
                    <TableBody>
                    {platforms.map((platform, index) => (
                      <TableRow 
                        key={index} 
                        onClick={() => handlePlatformSelect(platform)}
                        className="cursor-pointer hover:bg-secondary"
                      >
                        <TableCell>{platform}</TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
              </div>
            )}
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </div>
        </> 
       ) : (
          null
      )}
    </div>
  );
};

export default Chat;
