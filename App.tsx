
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './lib/auth';

const App: React.FC = () => {
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check custom local session on mount
    const checkSession = () => {
      try {
        const session = auth.getSession();
        if (session?.email) {
          setAuthenticatedUser(session.email);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    // Logout only from local custom auth
    auth.logout();
    setAuthenticatedUser(null);
    setIsLoading(false);
  };

  const handleLoginSuccess = (email: string) => {
    setAuthenticatedUser(email);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
          </div>
      )
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans bg-slate-900">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none bg-brand-gradient opacity-40" />
      <div className="fixed inset-0 pointer-events-none backdrop-blur-[100px]" />
      
      {/* Main Content */}
      <div className="relative z-10">
        {authenticatedUser ? (
          <Dashboard userEmail={authenticatedUser} onLogout={handleLogout} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </div>
  );
};

export default App;
