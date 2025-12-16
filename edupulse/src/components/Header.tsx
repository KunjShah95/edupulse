import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Moon, Sun, User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Mock Notifications
    const notifications = [
        { id: 1, title: 'Exam Schedule Released', message: 'The final exam schedule is now available.', time: '2h ago', read: false },
        { id: 2, title: 'New Assignment', message: 'Math assignment pending review.', time: '5h ago', read: false },
        { id: 3, title: 'System Update', message: 'EduPulse will undergo maintenance tonight.', time: '1d ago', read: true },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search for students, classes, or docs..."
                        className="w-96 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all placeholder:text-slate-500 dark:text-white"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                            >
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                    <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{notif.title}</h4>
                                                <span className="text-[10px] text-slate-400">{notif.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                                    <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-full py-1">
                                        Mark all as read
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Profile with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg pr-2 py-1 transition-colors"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user ? `${user.firstName} ${user.lastName}` : 'Sarah Wilson'}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Principal'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-transparent hover:ring-blue-500/20 transition-all">
                            {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'SW'}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                    <p className="font-semibold text-slate-900 dark:text-white">{user ? `${user.firstName} ${user.lastName}` : 'Sarah Wilson'}</p>
                                    <p className="text-xs text-slate-500">{user?.email || 'sarah@edupulse.com'}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => { navigate('/dashboard/settings'); setShowProfileMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="text-sm font-medium">My Profile</span>
                                    </button>
                                    <button
                                        onClick={() => { navigate('/dashboard/settings'); setShowProfileMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span className="text-sm font-medium">Settings</span>
                                    </button>
                                    <button
                                        onClick={() => setShowProfileMenu(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">Help & Support</span>
                                    </button>
                                </div>
                                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-medium">Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;

