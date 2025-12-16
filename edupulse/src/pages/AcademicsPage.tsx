
import { motion } from 'framer-motion';
import { Clock, Calendar, GraduationCap, MoreHorizontal } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const schedule = [
    { id: 1, subject: 'Mathematics', time: '09:00 AM - 10:00 AM', teacher: 'Dr. Sarah Wilson', room: 'Room 302', status: 'Upcoming' },
    { id: 2, subject: 'Physics', time: '10:15 AM - 11:15 AM', teacher: 'Mr. James Brown', room: 'Lab 2', status: 'Upcoming' },
    { id: 3, subject: 'History', time: '11:30 AM - 12:30 PM', teacher: 'Mrs. Emily Davis', room: 'Room 205', status: 'Upcoming' },
    { id: 4, subject: 'Computer Science', time: '02:00 PM - 03:00 PM', teacher: 'Mr. David Chen', room: 'Comp Lab 1', status: 'Completed' },
];

const subjects = [
    { id: 1, name: 'Mathematics', progress: 75, grade: 'A', teacher: 'Dr. Wilson', nextTest: 'Oct 25' },
    { id: 2, name: 'Physics', progress: 60, grade: 'B+', teacher: 'Mr. Brown', nextTest: 'Oct 28' },
    { id: 3, name: 'English Literature', progress: 85, grade: 'A-', teacher: 'Ms. Taylor', nextTest: 'Nov 02' },
    { id: 4, name: 'Chemistry', progress: 45, grade: 'B', teacher: 'Dr. Martinez', nextTest: 'Nov 05' },
];

const AcademicsPage = () => {
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

    const { addToast } = useToast();

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academics Overview</h1>
                    <p className="text-sm text-slate-500">Track schedules, subjects, and performance.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => addToast('Downloading Academic Report...', 'success')}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                        Download Report
                    </button>
                    <button
                        onClick={() => addToast('Opening full schedule view...', 'info')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all text-sm active:scale-95"
                    >
                        View Full Schedule
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <motion.div variants={item} className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Today's Schedule
                        </h3>
                        <span className="text-sm text-slate-500">October 24, 2025</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {schedule.map((cls) => (
                                <div key={cls.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex flex-col items-center justify-center w-16 px-2 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                                        <span className="text-xs text-slate-500 font-medium">{cls.time.split(' - ')[0].split(' ')[1]}</span>
                                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{cls.time.split(' - ')[0].split(' ')[0]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{cls.subject}</h4>
                                        <p className="text-sm text-slate-500 truncate">{cls.teacher} • {cls.room}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium hidden sm:inline-block ${cls.status === 'Completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {cls.status}
                                        </span>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button
                                onClick={() => addToast('Weekly timetable view is being prepared.', 'info')}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                View Weekly Timetable
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Subject Performance */}
                <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-purple-500" />
                            My Subjects
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
                        {subjects.map((subject) => (
                            <div key={subject.id}>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{subject.name}</h4>
                                        <p className="text-xs text-slate-500">Grade: <span className="text-emerald-500 font-medium">{subject.grade}</span></p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{subject.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${subject.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${subject.progress >= 80 ? 'bg-emerald-500' :
                                            subject.progress >= 60 ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="font-bold text-lg">Exam Schedule</h4>
                                <p className="text-purple-100 text-sm">Upcoming assessments</p>
                            </div>
                            <Calendar className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex flex-col items-center justify-center text-xs font-bold leading-none">
                                    <span>OCT</span>
                                    <span className="text-lg">28</span>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Physics Mid-term</p>
                                    <p className="text-xs text-purple-200">10:00 AM • Room 302</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex flex-col items-center justify-center text-xs font-bold leading-none">
                                    <span>NOV</span>
                                    <span className="text-lg">02</span>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">English Final</p>
                                    <p className="text-xs text-purple-200">09:00 AM • Hall A</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => addToast('Opening Exam Calendar...', 'info')}
                            className="w-full mt-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors"
                        >
                            View Calendar
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AcademicsPage;
