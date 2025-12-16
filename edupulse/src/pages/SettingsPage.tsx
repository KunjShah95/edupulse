import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, Moon, Sun, Monitor, LogOut, Save, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');
    const [saved, setSaved] = useState(false);

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        updates: false,
        marketing: false
    });

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-sm text-slate-500">Manage your account preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <motion.div variants={item} className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                                <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Content Area */}
                <motion.div variants={item} className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <div className="p-6 space-y-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Information</h2>
                                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user ? `${user.firstName} ${user.lastName}` : 'Guest User'}</h3>
                                        <p className="text-slate-500">{user?.email || 'guest@example.com'}</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">{user?.role || 'Student'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                        <input type="text" defaultValue={user?.firstName || ''} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                                        <input type="text" defaultValue={user?.lastName || ''} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                        <input type="email" defaultValue={user?.email || ''} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                                    <Save className="w-4 h-4" />
                                    {saved ? 'Saved!' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="p-6 space-y-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h2>
                                <p className="text-slate-500 text-sm">Choose how EduPulse looks to you.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <Sun className={`w-8 h-8 mx-auto mb-2 ${theme === 'light' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <p className={`font-medium ${theme === 'light' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}>Light</p>
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <Moon className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                        <p className={`font-medium ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>Dark</p>
                                    </button>
                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <Monitor className={`w-8 h-8 mx-auto mb-2 ${theme === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                        <p className={`font-medium ${theme === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>System</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="p-6 space-y-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {[
                                        { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                                        { key: 'push', label: 'Push Notifications', desc: 'Get notifications in your browser' },
                                        { key: 'updates', label: 'Product Updates', desc: 'News about product features' },
                                        { key: 'marketing', label: 'Marketing', desc: 'Special offers and promotions' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                                                <p className="text-sm text-slate-500">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            >
                                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="p-6 space-y-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security Settings</h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <p className="font-medium text-slate-900 dark:text-white mb-1">Change Password</p>
                                        <p className="text-sm text-slate-500 mb-3">Update your account password.</p>
                                        <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                            Change Password
                                        </button>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                        <p className="font-medium text-red-700 dark:text-red-400 mb-1">Danger Zone</p>
                                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">Logging out will end your current session.</p>
                                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SettingsPage;
