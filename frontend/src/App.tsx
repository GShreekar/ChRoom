import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ProtectedPage from './components/ProtectedPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <ProtectedPage>
              <h1>Welcome to the protected page!</h1>
            </ProtectedPage>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;