import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel m-4">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            SoundDrops
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link to="/browse" className="text-gray-300 hover:text-white transition" data-testid="nav-browse">Browse</Link>
          {user && (
            <>
              <Link to="/favorites" className="text-gray-300 hover:text-white transition" data-testid="nav-favorites">Favorites</Link>
              <Link to="/collections" className="text-gray-300 hover:text-white transition" data-testid="nav-collections">Collections</Link>
              {(user.role === 'creator' || user.role === 'admin') && (
                <Link to="/creator" className="text-gray-300 hover:text-white transition" data-testid="nav-creator">Creator</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="text-gray-300 hover:text-white transition" data-testid="nav-admin">Admin</Link>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 glass-panel px-4 py-2"
                data-testid="user-menu-button"
              >
                <img
                  src={user.picture || 'https://via.placeholder.com/40'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:block">{user.name}</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-panel">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition"
                    data-testid="logout-button"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLogin} className="btn-primary" data-testid="login-button">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;