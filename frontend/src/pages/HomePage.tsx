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
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen p-3 sm:p-6">
            {/* Header with username */}
            <header className="bg-white shadow-sm dark:bg-gray-800 rounded-xl mt-1 sm:mt-8">
                <div className="w-full mx-auto py-3 sm:py-4 px-4 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Chroom</h1>
                        <span className="text-sm sm:text-base sm:ml-4 text-gray-600 dark:text-gray-300 mr-2">Welcome, {username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow w-full mx-auto py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
                {/* Alerts */}
                {error && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 dark:bg-red-200 text-sm sm:text-base rounded-md" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 sm:p-4 dark:bg-green-200 text-sm sm:text-base rounded-md" role="alert">
                        <p>{success}</p>
                    </div>
                )}

                {/* Sections stacked in column */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md dark:bg-gray-800">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Create a Room</h2>
                        <form onSubmit={handleCreateRoom}>
                            <button type="submit" className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create Room</button>
                        </form>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md dark:bg-gray-800">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Join a Room</h2>
                        <form onSubmit={handleJoinRoom}>
                            <input type="text" id="roomCode" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} className="w-full p-2 mt-2 border rounded-md" placeholder="Enter room code" />
                            <button type="submit" className="w-full mt-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Join Room</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default HomePage;
