import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedPageProps {
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedPage = ({ 
  children, 
  redirectTo = '/auth' 
}: ProtectedPageProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) {
      console.log('Access attempt to protected route while not authenticated');
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedPage;