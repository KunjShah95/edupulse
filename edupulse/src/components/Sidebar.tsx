import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Library,
    Building2,
    MessageSquare,
    X,
    Settings,
    LogOut,
    Trophy,
    Calendar,
    Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Trophy, label: 'Quiz Zone', path: '/dashboard/quiz' },
        { icon: Users, label: 'Students', path: '/dashboard/students' },
        { icon: Briefcase, label: 'Teachers', path: '/dashboard/teachers' },
        { icon: BookOpen, label: 'Academics', path: '/dashboard/academics' },
        { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
        { icon: Library, label: 'Library', path: '/dashboard/library' },
        { icon: Building2, label: 'Administration', path: '/dashboard/admin' },
        { icon: MessageSquare, label: 'Communication', path: '/dashboard/messages' },
    ];

    const handleLogout = () => {
        // Clear any auth state here if needed
        navigate('/');
        onClose();
    };

    const handleSettingsClick = () => {
        navigate('/dashboard/settings');
        onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all duration-300 transform lg:translate-x-0 border-r border-slate-200 dark:border-slate-800 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <span className="text-lg sm:text-xl font-bold">E</span>
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                    EduPulse
                                </h1>
                                <p className="text-xs text-slate-500 hidden sm:block">School Management</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 sm:py-6 px-2 sm:px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }: { isActive: boolean }) => cn(
                                    "flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {({ isActive }: { isActive: boolean }) => (
                                    <>
                                        <item.icon className={cn(
                                            "w-5 h-5 transition-colors flex-shrink-0",
                                            isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-white"
                                        )} />
                                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
                        <button
                            onClick={handleSettingsClick}
                            className="w-full flex items-center gap-3 px-3 py-2.5 sm:py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg sm:rounded-xl transition-all active:scale-95"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium text-sm sm:text-base">Settings</span>
                        </button>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 sm:py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all active:scale-95"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium text-sm sm:text-base">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <LogOut className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Logout</h3>
                                <p className="text-slate-500 text-sm">Are you sure you want to log out of your account?</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all active:scale-95"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
