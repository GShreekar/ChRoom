import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ChatRoom from './pages/ChatRoom';
import ProtectedPage from './components/ProtectedPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <ProtectedPage>
              <HomePage />
            </ProtectedPage>
          } />
          <Route path="/room/:roomId" element={
            <ProtectedPage>
              <ChatRoom />
            </ProtectedPage>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;