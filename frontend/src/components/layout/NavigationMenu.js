import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavigationMenu = ({ user, onLogout }) => {
  const [showNav, setShowNav] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: '🏠 Home', public: true },
    { path: '/browse', label: '🎧 Browse', public: true },
    { path: '/sync', label: '🎬 Sync Ready', public: true },
    { path: '/favorites', label: '❤️ Favorites', requireAuth: true },
    { path: '/collections', label: '📁 Collections', requireAuth: true },
    { path: '/creator', label: '🎨 Creator Dashboard', requireRole: ['creator', 'admin'] },
    { path: '/admin-dashboard', label: '🛠️ Admin Dashboard', requireRole: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.public) return true;
    if (item.requireAuth && user) return true;
    if (item.requireRole && user && item.requireRole.includes(user.role)) return true;
    return false;
  });

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNav(!showNav)}
        className="btn-secondary flex items-center gap-2"
        data-testid="nav-menu-btn"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>
      
      {showNav && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowNav(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="absolute right-0 mt-2 w-56 glass-panel rounded-lg shadow-2xl z-50 overflow-hidden border border-white/20"
            style={{ backgroundColor: 'rgba(10, 10, 20, 0.98)' }}
            data-testid="nav-dropdown"
          >
            {filteredItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`block px-4 py-3 hover:bg-violet-500/20 transition ${
                  isActive(item.path) ? 'bg-violet-500/30 text-violet-400' : 'text-white'
                }`}
                onClick={() => setShowNav(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {user && (
              <>
                <div className="border-t border-white/10 my-1"></div>
                <div className="px-4 py-2 text-sm text-gray-400">
                  {user.email}
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowNav(false);
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-red-500/20 text-red-400 transition"
                  >
                    🚪 Logout
                  </button>
                )}
              </>
            )}
            
            {!user && (
              <>
                <div className="border-t border-white/10 my-1"></div>
                <Link 
                  to="/login" 
                  className="block px-4 py-3 hover:bg-violet-500/20 text-violet-400 transition"
                  onClick={() => setShowNav(false)}
                >
                  🔑 Sign In
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NavigationMenu;
