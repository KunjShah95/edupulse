
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Users, Shield, CreditCard, Bell,
    Database, Activity, ToggleLeft, ToggleRight,
    Search, MoreHorizontal, UserPlus, CheckCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('users');

    // Toggle state simulation
    const [toggles, setToggles] = useState({
        notifications: true,
        maintenance: false,
        registration: true,
        darkMode: true
    });
    const { addToast } = useToast();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const users = [
        { id: 1, name: 'Sarah Wilson', role: 'Principal', email: 'sarah.w@edupulse.com', status: 'Active' },
        { id: 2, name: 'James Brown', role: 'Admin', email: 'james.b@edupulse.com', status: 'Active' },
        { id: 3, name: 'Emily Davis', role: 'Teacher', email: 'emily.d@edupulse.com', status: 'Inactive' },
        { id: 4, name: 'Tech Support', role: 'Support', email: 'support@edupulse.com', status: 'Active' },
    ];

    const tabs = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'settings', label: 'System Settings', icon: Settings },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
        { id: 'logs', label: 'Audit Logs', icon: Database },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Administration</h1>
                    <p className="text-sm text-slate-500">Manage system users, settings, and configurations.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'users' && (
                    <motion.div variants={item} className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
                                />
                            </div>
                            <button
                                onClick={() => addToast('Add User modal opening...', 'success')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-sm active:scale-95"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add User
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Email</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right text-slate-700 dark:text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{user.role}</td>
                                            <td className="px-6 py-4 text-slate-500">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => addToast(`Actions for ${user.name}`, 'info')}
                                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                Security Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Two-Factor Auth</p>
                                        <p className="text-xs text-slate-500">Require 2FA for all admin accounts</p>
                                    </div>
                                    <button className="text-green-500"><ToggleRight className="w-8 h-8" /></button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Public Registration</p>
                                        <p className="text-xs text-slate-500">Allow new students to register</p>
                                    </div>
                                    <button
                                        onClick={() => setToggles({ ...toggles, registration: !toggles.registration })}
                                        className={toggles.registration ? 'text-green-500' : 'text-slate-400'}
                                    >
                                        {toggles.registration ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                <Bell className="w-5 h-5 text-orange-500" />
                                Notifications
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Email Alerts</p>
                                        <p className="text-xs text-slate-500">Receive daily summary emails</p>
                                    </div>
                                    <button className="text-green-500"><ToggleRight className="w-8 h-8" /></button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">System Maintenance</p>
                                        <p className="text-xs text-slate-500">Show maintenance banner</p>
                                    </div>
                                    <button className="text-slate-400"><ToggleLeft className="w-8 h-8" /></button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'billing' && (
                    <motion.div variants={item} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="font-bold text-lg dark:text-white mb-4">Payment Methods</h3>
                                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                                        <div>
                                            <p className="font-medium text-sm dark:text-white">Visa ending in 4242</p>
                                            <p className="text-xs text-slate-500">Expires 12/28</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded">Default</span>
                                </div>
                                <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">+ Add new card</button>
                            </div>
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
                                <h3 className="font-bold text-lg mb-1">Standard Plan</h3>
                                <p className="text-slate-400 text-sm mb-6">$299/month per school</p>
                                <ul className="space-y-2 mb-6 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Unlimited Students</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Advanced Analytics</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> 24/7 Support</li>
                                </ul>
                                <button className="w-full py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors">Manage Plan</button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="font-bold text-lg dark:text-white">Billing History</h3>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-slate-500">Date</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Description</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Amount</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                                        <th className="px-6 py-3 font-medium text-right text-slate-500">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {[
                                        { date: 'Oct 01, 2025', desc: 'Standard Plan - Monthly', amount: '$299.00', status: 'Paid' },
                                        { date: 'Sep 01, 2025', desc: 'Standard Plan - Monthly', amount: '$299.00', status: 'Paid' },
                                        { date: 'Aug 01, 2025', desc: 'Standard Plan - Monthly', amount: '$299.00', status: 'Paid' },
                                    ].map((inv, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 dark:text-white">{inv.date}</td>
                                            <td className="px-6 py-4 dark:text-white">{inv.desc}</td>
                                            <td className="px-6 py-4 dark:text-white">{inv.amount}</td>
                                            <td className="px-6 py-4"><span className="text-green-500 font-medium text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">{inv.status}</span></td>
                                            <td className="px-6 py-4 text-right"><button className="text-blue-600 hover:underline">Download</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'logs' && (
                    <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white">System Audit Logs</h3>
                            <button className="text-sm text-blue-600 hover:underline">Export Logs</button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-500">Timestamp</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">User</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Action</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {[
                                    { time: 'Today, 10:42 AM', user: 'Sarah Wilson', action: 'Updated student record ID #1024', ip: '192.168.1.42' },
                                    { time: 'Today, 09:15 AM', user: 'James Brown', action: 'Created new exam "Math Mid-term"', ip: '192.168.1.15' },
                                    { time: 'Yesterday, 04:30 PM', user: 'System', action: 'Automated backup completed', ip: 'localhost' },
                                    { time: 'Yesterday, 02:22 PM', user: 'Admin', action: 'Changed system security settings', ip: '10.0.0.5' },
                                    { time: 'Oct 23, 11:05 AM', user: 'Sarah Wilson', action: 'Login successful', ip: '192.168.1.42' },
                                ].map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-slate-500">{log.time}</td>
                                        <td className="px-6 py-4 font-medium dark:text-white">{log.user}</td>
                                        <td className="px-6 py-4 dark:text-slate-300">{log.action}</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default AdminPage;
