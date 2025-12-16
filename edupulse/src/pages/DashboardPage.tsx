import { motion } from 'framer-motion';
import { Users, GraduationCap, Calendar, DollarSign, TrendingUp, MoreVertical, Clock, AlertCircle } from 'lucide-react';

const StatsCard = ({ title, value, label, icon: Icon, color }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />

        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
                <h3 className="text-3xl font-bold dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>

        <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-500 flex items-center font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                {label}
            </span>
            <span className="text-slate-400 ml-2">vs last month</span>
        </div>
    </motion.div>
);

const recentActivities = [
    { id: 1, user: 'John Smith', action: 'submitted Grade 10 Math results', time: '2 hours ago', avatar: 'JS' },
    { id: 2, user: 'Sarah Wilson', action: 'added a new event "Science Fair"', time: '4 hours ago', avatar: 'SW' },
    { id: 3, user: 'Mike Brown', action: 'updated the bus route #42', time: '5 hours ago', avatar: 'MB' },
    { id: 4, user: 'Emily Davis', action: 'approved 5 leave requests', time: '1 day ago', avatar: 'ED' },
];

const upcomingEvents = [
    { id: 1, title: 'Annual Sports Meet', date: 'Oct 25, 2025', time: '09:00 AM', type: 'Sports' },
    { id: 2, title: 'Parent-Teacher Meeting', date: 'Nov 02, 2025', time: '10:00 AM', type: 'Academic' },
    { id: 3, title: 'Science Exhibition', date: 'Nov 15, 2025', time: '11:00 AM', type: 'Academic' },
];

const DashboardPage = () => {
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

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-slate-500">Welcome back, Sarah! Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Download Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all">
                        Add New Admission
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total Students" value="3,240" label="+12%" icon={Users} color="blue" />
                <StatsCard title="Total Teachers" value="245" label="+4%" icon={GraduationCap} color="purple" />
                <StatsCard title="Events This Month" value="18" label="+2" icon={Calendar} color="orange" />
                <StatsCard title="Revenue (YTD)" value="$2.4M" label="+8.5%" icon={DollarSign} color="emerald" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section - Placeholder for now using an Image or CSS construct */}
                <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold dark:text-white">Attendance Overview</h3>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <MoreVertical className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="h-64 flex items-end gap-4 px-2">
                        {/* Simple CSS Bar Chart */}
                        {[65, 78, 45, 89, 92, 54, 76, 88, 67, 90, 85].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group">
                                <div
                                    className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative overflow-hidden hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                                    style={{ height: `${height}%` }}
                                >
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: '100%' }}
                                        transition={{ duration: 1, delay: i * 0.05 }}
                                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-slate-400">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span>
                    </div>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div variants={item} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold dark:text-white">Upcoming Events</h3>
                        <button className="text-sm text-blue-500 font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center font-bold text-xs leading-none">
                                    {event.date.split(' ')[0]}
                                    <span className="text-base">{event.date.split(' ')[1].replace(',', '')}</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{event.title}</h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" /> {event.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-bold mb-1">Premium Features</h4>
                                <p className="text-xs text-purple-100 mb-3">Unlock advanced analytics and AI insights.</p>
                                <button className="bg-white text-purple-600 text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-black/10 hover:bg-purple-50 transition-colors">Upgrade Now</button>
                            </div>
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full blur-lg -ml-8 -mb-8" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold dark:text-white">Recent Activity</h3>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {activity.avatar}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-800 dark:text-slate-200">
                                        <span className="font-semibold">{activity.user}</span> {activity.action}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-blue-500">
                                <AlertCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DashboardPage;
