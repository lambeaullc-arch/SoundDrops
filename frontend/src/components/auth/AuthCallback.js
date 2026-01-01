import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI, subscriptionAPI } from '../../utils/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash;
        const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        const response = await authAPI.createSession(sessionId);
        const user = response.data;
        
        console.log('Auth callback user:', user);
        console.log('User role:', user.role);

        // Check if user selected subscription during registration
        const registrationType = localStorage.getItem('registration_type');
        
        // Route based on user role (for existing users signing in)
        if (!registrationType) {
          // Existing user signing in - route to appropriate dashboard
          if (user.role === 'admin') {
            console.log('Existing admin - redirecting to admin dashboard');
            navigate('/admin-dashboard', { replace: true });
            return;
          } else if (user.role === 'creator') {
            console.log('Existing creator - redirecting to creator dashboard');
            navigate('/creator', { replace: true });
            return;
          } else {
            console.log('Existing user - redirecting to browse');
            navigate('/browse', { state: { user }, replace: true });
            return;
          }
        }

        // New user registration flow
        localStorage.removeItem('registration_type');
        
        if (user.role === 'admin') {
          console.log('New admin - redirecting to admin dashboard');
          navigate('/admin-dashboard', { replace: true });
        } else if (registrationType === 'subscription') {
          // User chose subscription - redirect to subscription checkout
          console.log('New user with subscription - redirecting to checkout');
          try {
            const subResponse = await subscriptionAPI.createCheckout(window.location.origin);
            window.location.href = subResponse.data.url;
          } catch (error) {
            console.error('Subscription checkout failed:', error);
            // Fallback to browse if checkout fails
            navigate('/browse', { state: { user }, replace: true });
          }
        } else if (user.role === 'creator') {
          console.log('New creator - redirecting to creator dashboard');
          navigate('/creator', { replace: true });
        } else {
          // Free registration
          console.log('New free user - redirecting to browse');
          navigate('/browse', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;