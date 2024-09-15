import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent } from "../../renderer/components/ui/card";
import { Input } from "../../renderer/components/ui/input";
import { Button } from "../../renderer/components/ui/button";
import { ScrollArea } from "../../renderer/components/ui/scroll-area";
import { updateBreadcrumb } from '../state/actions';
import SubscribeCard from '../components/subscribe/SubscribeCard';
import { VectorStorage } from 'vector-storage';
import { OpenAI } from 'openai';

const Chat = () => { 
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef(null);
  const dispatch = useDispatch();
  const { isSubscribed } = useSelector((state) => state.app);



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

      const apiKey = await window.electron.ipcRenderer.invoke('get-openai-api-key');
      const vectorStore = new VectorStorage({ openAIApiKey: apiKey, openaiModel: 'text-embedding-3-small' });
      const search = await vectorStore.similaritySearch({
        query: inputMessage,
        k: 5,
      });

      const similarData = search.similarItems;

      console.log('vectorStore: ', vectorStore);
      console.log('similarData: ', similarData);
      // Add bot response with similar data
      if (similarData.length > 0) {
        const botResponse = (
          <div>
            <p>Here's some similar data I found:</p>
            <ul className="list-disc pl-4">
              {similarData.map((item, index) => (
                <li key={index}>
                  {item.metadata.name} - {item.text} (Similarity: {(item.score * 100).toFixed(2)}%)
                </li>
              ))}
            </ul>
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
      {/* {isSubscribed ? ( */}
        <>
          <Card className="flex-grow mb-4">
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
                {messages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
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
      {/* // ) : (
      //   <div className="flex flex-col h-screen p-4">

      //         <SubscribeCard />

      //   </div>
      // )} */}
    </div>
  );
};

export default Chat;
