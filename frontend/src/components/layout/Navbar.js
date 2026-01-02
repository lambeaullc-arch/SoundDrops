import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      setShowMenu(false);
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

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: '🏠 Home', public: true },
    { path: '/browse', label: '🎧 Browse', public: true },
    { path: '/sync', label: '🎬 Sync Ready', public: true },
    { path: '/favorites', label: '❤️ Favorites', requireAuth: true },
    { path: '/collections', label: '📁 Collections', requireAuth: true },
    { path: '/creator', label: '🎨 Creator', requireRole: ['creator', 'admin'] },
    { path: '/admin-dashboard', label: '🛠️ Admin', requireRole: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.public) return true;
    if (item.requireAuth && user) return true;
    if (item.requireRole && user && item.requireRole.includes(user.role)) return true;
    return false;
  });

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

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-4">
          {filteredItems.slice(1).map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`px-3 py-2 rounded-lg transition ${
                isActive(item.path) 
                  ? 'bg-violet-500/20 text-violet-400' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
              data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn-secondary flex items-center gap-2"
              data-testid="mobile-menu-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
          </div>

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
                <svg className="w-4 h-4 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Dropdown */}
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-2xl z-50 overflow-hidden border border-white/20"
                    style={{ backgroundColor: 'rgba(10, 10, 20, 0.98)' }}
                    data-testid="nav-dropdown"
                  >
                    {/* Mobile nav items */}
                    <div className="lg:hidden">
                      {filteredItems.map(item => (
                        <Link 
                          key={item.path}
                          to={item.path} 
                          className={`block px-4 py-3 hover:bg-violet-500/20 transition ${
                            isActive(item.path) ? 'bg-violet-500/30 text-violet-400' : 'text-white'
                          }`}
                          onClick={() => setShowMenu(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-white/10 my-1"></div>
                    </div>
                    
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <p className="text-xs text-violet-400 mt-1 capitalize">{user.role}</p>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-red-500/20 text-red-400 transition"
                      data-testid="logout-button"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
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