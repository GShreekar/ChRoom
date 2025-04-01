import { useAuth } from '../context/AuthContext';

const HomePage = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
            <p className="text-lg mb-4">This is a protected route.</p>
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
                Logout
            </button>
        </div>
    );
}

export default HomePage;