import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export const useMessages = (roomId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        const messageDocs: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messageDocs.push({
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });
        setMessages(messageDocs);
      },
      (err) => {
        console.error('Error getting messages:', err);
        setError('Failed to load messages');
      }
    );
    
    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async (text: string, userId: string, username: string) => {
    if (!text.trim() || !roomId || !userId) return false;
    
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text,
        senderId: userId,
        senderName: username,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return false;
    }
  };

  return { messages, error, sendMessage };
};