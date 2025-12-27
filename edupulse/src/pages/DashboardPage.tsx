import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, Calendar, DollarSign, TrendingUp, MoreVertical, Clock, AlertCircle, X, Download, UserPlus, FileText, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

interface StatsCardProps {
    title: string;
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    onClick?: () => void;
}

const StatsCard = ({ title, value, label, icon: Icon, color, onClick }: StatsCardProps) => {
    const colorClasses: Record<string, { bg: string; text: string; accent: string }> = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', accent: 'bg-blue-500/10' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', accent: 'bg-purple-500/10' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', accent: 'bg-orange-500/10' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', accent: 'bg-emerald-500/10' },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 ${colors.accent} rounded-bl-full -mr-6 sm:-mr-8 -mt-6 sm:-mt-8 transition-transform group-hover:scale-110`} />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mb-1">{title}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold dark:text-white">{value}</h3>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colors.bg} ${colors.text}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
                <span className="text-emerald-500 flex items-center font-medium">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {label}
                </span>
                <span className="text-slate-400 ml-2 hidden sm:inline">vs last month</span>
            </div>
        </motion.div>
    );
};



import { useDashboardData } from '../hooks/use-dashboard-data';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAdmissionModal, setShowAdmissionModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const [admissionSubmitted, setAdmissionSubmitted] = useState(false);
    const { addToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useDashboardData();

    const handleAction = (action: string) => {
        addToast(`${action} feature coming soon!`, 'info');
        setShowDropdown(null);
    };

    const handleDownloadReport = (reportType: string) => {
        // Simulate download
        const link = document.createElement('a');
        link.href = '#';
        link.download = `${reportType.toLowerCase().replace(' ', '-')}-report.pdf`;
        // In production, this would trigger actual file download
        addToast(`Downloading ${reportType} Report...`, 'success');
        setShowReportModal(false);
    };

    const handleAdmissionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAdmissionSubmitted(true);
        setTimeout(() => {
            setShowAdmissionModal(false);
            setAdmissionSubmitted(false);
            addToast('Student admission record created successfully!', 'success');
        }, 2000);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error fetching data</div>;
    }

    return (
        <>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4 sm:space-y-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                        <p className="text-sm text-slate-500">Welcome back, {user?.firstName || 'User'}! Here's what's happening today.</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span> Report
                        </button>
                        <button
                            onClick={() => setShowAdmissionModal(true)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg sm:rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add</span> Admission
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    <StatsCard
                        title="Total Students"
                        value="3,240"
                        label="+12%"
                        icon={Users}
                        color="blue"
                        onClick={() => navigate('/dashboard/students')}
                    />
                    <StatsCard
                        title="Total Teachers"
                        value="245"
                        label="+4%"
                        icon={GraduationCap}
                        color="purple"
                        onClick={() => addToast('Teachers directory coming soon', 'info')}
                    />
                    <StatsCard
                        title="Events This Month"
                        value="18"
                        label="+2"
                        icon={Calendar}
                        color="orange"
                        onClick={() => navigate('/dashboard/academics')}
                    />
                    <StatsCard
                        title="Revenue (YTD)"
                        value="$2.4M"
                        label="+8.5%"
                        icon={DollarSign}
                        color="emerald"
                        onClick={() => addToast('Financial reports are restricted', 'error')}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Chart Section */}
                    <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-bold dark:text-white">Attendance Overview</h3>
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(showDropdown === 1 ? null : 1)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                </button>
                                <AnimatePresence>
                                    {showDropdown === 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20"
                                        >
                                            <button onClick={() => handleAction('Export Data')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Export Data</button>
                                            <button onClick={() => handleAction('View Details')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">View Details</button>
                                            <button onClick={() => handleAction('Settings')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Settings</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className="h-48 sm:h-64 flex items-end gap-1 sm:gap-4 px-1 sm:px-2">
                            {/* Simple CSS Bar Chart */}
                            {[65, 78, 45, 89, 92, 54, 76, 88, 67, 90, 85].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group">
                                    <div
                                        className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-md sm:rounded-t-lg relative overflow-hidden hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all cursor-pointer"
                                        style={{ height: `${height}%` }}
                                        title={`${height}% attendance`}
                                    >
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: '100%' }}
                                            transition={{ duration: 1, delay: i * 0.05 }}
                                            className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-md sm:rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-3 sm:mt-4 text-xs text-slate-400">
                            <span>Jan</span><span className="hidden sm:inline">Feb</span><span>Mar</span><span className="hidden sm:inline">Apr</span><span>May</span><span className="hidden sm:inline">Jun</span><span>Jul</span><span className="hidden sm:inline">Aug</span><span>Sep</span><span className="hidden sm:inline">Oct</span><span>Nov</span>
                        </div>
                    </motion.div>

                    {/* Upcoming Events */}
                    <motion.div variants={item} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-bold dark:text-white">Upcoming Events</h3>
                            <Link to="/dashboard/academics" className="text-xs sm:text-sm text-blue-500 font-medium hover:underline">View All</Link>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                            {data.upcomingEvents.map((event) => (
                                <motion.div
                                    key={event.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center font-bold text-xs leading-none">
                                        {event.date.split(' ')[0]}
                                        <span className="text-sm sm:text-base">{event.date.split(' ')[1].replace(',', '')}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{event.title}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{event.time}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-600 text-white">
                                <h4 className="font-bold mb-1 text-sm sm:text-base">Premium Features</h4>
                                <p className="text-xs text-emerald-100 mb-2 sm:mb-3">Unlock advanced analytics and AI insights.</p>
                                <button
                                    onClick={() => addToast('Premium upgrade flow initiated!', 'success')}
                                    className="bg-white text-emerald-600 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 transition-colors active:scale-95"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold dark:text-white">Recent Activity</h3>
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(showDropdown === 2 ? null : 2)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            </button>
                            <AnimatePresence>
                                {showDropdown === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20"
                                    >
                                        <button onClick={() => handleAction('View All Activities')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">View All</button>
                                        <button onClick={() => handleAction('Mark as Read')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Mark as Read</button>
                                        <button onClick={() => handleAction('Activity Settings')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Settings</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.recentActivities.map((activity) => (
                            <motion.div
                                key={activity.id}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                                        {activity.avatar}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                                            <span className="font-semibold">{activity.user}</span> <span className="hidden sm:inline">{activity.action}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-blue-500 transition-colors p-1 flex-shrink-0">
                                    <AlertCircle className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>

            {/* Download Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowReportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold dark:text-white">Download Report</h3>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3">
                                {['Attendance Report', 'Student Performance', 'Financial Summary', 'Event Calendar'].map((report) => (
                                    <button
                                        key={report}
                                        onClick={() => handleDownloadReport(report)}
                                        className="w-full p-4 flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left active:scale-[0.98]"
                                    >
                                        <div className="p-3 rounded-xl bg-blue-500/10">
                                            <FileText className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium dark:text-white">{report}</p>
                                            <p className="text-xs text-slate-500">PDF, ~2MB</p>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 ml-auto" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Admission Modal */}
            <AnimatePresence>
                {showAdmissionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowAdmissionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden my-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold dark:text-white">New Student Admission</h3>
                                <button
                                    onClick={() => setShowAdmissionModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {admissionSubmitted ? (
                                <div className="p-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </motion.div>
                                    <h4 className="text-xl font-bold dark:text-white mb-2">Admission Submitted!</h4>
                                    <p className="text-slate-500">The new student admission has been recorded successfully.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleAdmissionSubmit} className="p-4 sm:p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            placeholder="john.doe@example.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                                            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white">
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i} value={i + 1}>Grade {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section</label>
                                            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white">
                                                {['A', 'B', 'C', 'D'].map((section) => (
                                                    <option key={section} value={section}>Section {section}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent/Guardian Phone</label>
                                        <input
                                            type="tel"
                                            required
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdmissionModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                        >
                                            Submit Admission
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close dropdowns */}
            {showDropdown !== null && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(null)}
                />
            )}
        </>
    );
};

export default DashboardPage;
