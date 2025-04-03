import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [room, setRoom] = useState<DocumentData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchRoomAndUser = async () => {
      if (!roomId || !currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        }
        
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!roomDoc.exists()) {
          setError('Room not found');
          return;
        }
        
        setRoom(roomDoc.data());
        setLoading(false);
        
        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
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
        }, (err) => {
          console.error("Error getting messages: ", err);
          setError('Failed to load messages');
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching room data: ', err);
        setError('Error loading chat room');
        setLoading(false);
      }
    };
    
    fetchRoomAndUser();
  }, [roomId, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !roomId || !currentUser) return;
    
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: username,
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message: ', err);
      setError('Failed to send message');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
        <button 
          onClick={handleBack}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 mx-auto max-w-4xl shadow-xl">
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-gray-800">
        <div className="py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Room: {roomId}</h1>
          </div>
        </div>
      </header>

      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No messages yet. Send the first one!
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id}
                className={`mb-4 ${message.senderId === currentUser?.uid ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block rounded-lg px-4 py-2 max-w-xs sm:max-w-md break-words 
                    ${message.senderId === currentUser?.uid 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'}`}
                >
                  {message.senderId !== currentUser?.uid && (
                    <div className="font-semibold text-sm">{message.senderName}</div>
                  )}
                  <div>{message.text}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;