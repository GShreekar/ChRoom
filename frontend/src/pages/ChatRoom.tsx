import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRoom } from '../hooks/useRoom';
import { useMessages } from '../hooks/useMessages';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMembersMobile, setShowMembersMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { room, members, error: roomError, joinRoom, leaveRoom } = 
    useRoom(roomId, currentUser?.uid, username);
    
  const { messages, error: messagesError, sendMessage } = 
    useMessages(roomId);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (roomError) setError(roomError);
    if (messagesError) setError(messagesError);
  }, [roomError, messagesError]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userUsername = userDoc.data().username;
          setUsername(userUsername);
          
          await joinRoom();
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Error loading user data');
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    const handleBeforeUnload = () => {
      if (currentUser?.uid) leaveRoom();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (currentUser?.uid) leaveRoom();
    };
  }, [currentUser, joinRoom, leaveRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (await sendMessage(newMessage, currentUser?.uid || '', username)) {
      setNewMessage('');
    }
  };

  const handleBack = () => {
    if (currentUser) {
      leaveRoom();
    }
    navigate('/');
  };

  const toggleMembersMobile = useCallback(() => {
    setShowMembersMobile(prev => !prev);
  }, []);

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
    <div className="flex flex-col h-screen fixed inset-0">
      {/* Mobile Header - Only visible on small screens */}
      <header className="md:hidden bg-white shadow-sm dark:bg-gray-800 w-full">
        <div className="py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {room?.name || `Room: ${roomId}`}
            </h1>
          </div>
          <button
            onClick={toggleMembersMobile}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Show members"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Members Panel - Only visible when toggled */}
      {showMembersMobile && (
        <div className="fixed inset-0 z-50 md:hidden bg-black bg-opacity-50 animate-fade-in">
          <div className="absolute right-0 top-0 h-full w-3/4 max-w-xs bg-white dark:bg-gray-800 shadow-lg p-4 overflow-y-auto animate-slide-in-right">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Members ({members.length})
              </h2>
              <button 
                onClick={toggleMembersMobile} 
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="space-y-2">
              {members.map((member) => (
                <li 
                  key={member.uid} 
                  className={`flex items-center p-2 rounded-md ${
                    member.uid === currentUser?.uid 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-2">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <span className={`${member.uid === currentUser?.uid ? 'font-semibold' : ''}`}>
                    {member.username} {member.uid === currentUser?.uid ? '(You)' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Desktop Layout - Using columns-3 as before for larger screens */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <div className="columns-3 gap-4 h-full w-full">
          <div className="break-inside-avoid h-full"></div>
          
          {/* Second column - Chat room */}
          <div className="break-inside-avoid flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <header className="bg-white shadow-sm dark:bg-gray-800 w-full">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
                <div className="flex items-center">
                  <button
                    onClick={handleBack}
                    className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {room?.name || `Room: ${roomId}`}
                  </h1>
                </div>
              </div>
            </header>
            <div className="flex-grow overflow-y-auto p-4">
              <div className="w-full">
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
              <form onSubmit={handleSendMessage} className="flex">
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
          
          {/* Third column - Members list */}
          <div className="break-inside-avoid bg-gray-100 dark:bg-gray-800 border-l dark:border-gray-700 overflow-y-auto h-auto rounded-xl shadow-md mt-4">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Members ({members.length})
              </h2>
              <ul className="space-y-2">
                {members.map((member) => (
                  <li 
                    key={member.uid} 
                    className={`flex items-center p-2 rounded-md ${
                      member.uid === currentUser?.uid 
                        ? 'bg-blue-100 dark:bg-blue-900' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-2">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <span className={`${member.uid === currentUser?.uid ? 'font-semibold' : ''}`}>
                      {member.username} {member.uid === currentUser?.uid ? '(You)' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chat Area - Only visible on small screens */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        <div className="flex-grow overflow-y-auto p-4">
          <div className="w-full">
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
                    className={`inline-block rounded-lg px-4 py-2 max-w-[75%] break-words 
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

        {/* Mobile message input */}
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;