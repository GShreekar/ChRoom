import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const { currentUser, logout } = useAuth();
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        setUsername(userDoc.data().username);
                    }
                } catch (err) {
                    console.error('Error fetching user data: ', err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            setError('');
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout. Please try again.');
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const roomCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            await setDoc(doc(db, 'rooms', roomCode), {
                createdBy: currentUser?.uid,
                createdAt: serverTimestamp(),
                name: `Room ${roomCode}`,
                members: [{ uid: currentUser?.uid, username }]
            });
            setSuccess(`Room created successfully! Room code: ${roomCode}`);
            setRoomCode(roomCode);
            
            setTimeout(() => {
                navigate(`/room/${roomCode}`);
            }, 1000);
        } catch (err) {
            console.error('Error creating room: ', err);
            setError('Failed to create room. Please try again.');
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!roomCode.trim()) {
            setError('Room code is required');
            return;
        }
        try {
            const roomDoc = await getDoc(doc(db, 'rooms', roomCode));
            if (!roomDoc.exists()) {
                setError('Room not found. Please check the room code.');
                return;
            }
            setSuccess(`Successfully joined room: ${roomCode}`);
            
            setTimeout(() => {
                navigate(`/room/${roomCode}`);
            }, 1000);
        } catch (err) {
            console.log('Error joining room: ', err);
            setError('Failed to join room. Please try again.');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header with username */}
            <header className="bg-white shadow-sm dark:bg-gray-800 rounded-xl mt-8">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chroom</h1>
                        <span className="ml-4 text-gray-600 dark:text-gray-300 pr-3">Welcome, {username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-200" role="alert">
                        <p>{error}</p>
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 dark:bg-green-200" role="alert">
                        <p>{success}</p>
                    </div>
                )}
                
                <div className="grid grid-rows-1 md:grid-rows-2 gap-6">
                    {/* Create Room Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 h-flex">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create a Room</h2>
                        <form onSubmit={handleCreateRoom}>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Create Room
                            </button>
                        </form>
                    </div>

                    {/* Join Room Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Join a Room</h2>
                        <form onSubmit={handleJoinRoom}>
                            <div className="mb-4">
                                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Room Code
                                </label>
                                <input
                                    type="text"
                                    id="roomCode"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter room code"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Join Room
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default HomePage;