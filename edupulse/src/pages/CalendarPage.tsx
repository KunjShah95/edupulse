
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Calendar as CalendarIcon, X, CheckCircle } from 'lucide-react';

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showAddEvent, setShowAddEvent] = useState(false);

    // Mock events
    const [events, setEvents] = useState([
        { id: 1, title: 'Math Mid-term', date: new Date(2025, 9, 28), time: '10:00 AM', type: 'exam', description: 'Chapter 1-5' },
        { id: 2, title: 'Science Fair', date: new Date(2025, 10, 5), time: '09:00 AM', type: 'event', description: 'Main Hall' },
        { id: 3, title: 'Parent Meeting', date: new Date(2025, 9, 25), time: '02:00 PM', type: 'meeting', description: 'Staff Room' },
    ]);

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const getEventsForDay = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return events.filter(e => isSameDay(new Date(e.date), date));
    };

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

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Calendar</h1>
                    <p className="text-sm text-slate-500">Schedule, events and holidays.</p>
                </div>
                <button
                    onClick={() => setShowAddEvent(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-slate-500" />
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="grid grid-cols-7 mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array(firstDayOfMonth(currentDate)).fill(null).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {Array(daysInMonth(currentDate)).fill(null).map((_, i) => {
                                const day = i + 1;
                                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                const isToday = isSameDay(date, new Date());
                                const dayEvents = getEventsForDay(day);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(date)}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                                : isToday
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        <span className={`text-sm font-medium ${isSelected || isToday ? 'font-bold' : ''}`}>{day}</span>
                                        {dayEvents.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {dayEvents.map((ev, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-1.5 h-1.5 rounded-full ${ev.type === 'exam' ? 'bg-red-400' :
                                                                ev.type === 'meeting' ? 'bg-purple-400' :
                                                                    'bg-green-400'
                                                            } ${isSelected ? 'ring-1 ring-white' : ''}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar / Schedule */}
                <motion.div variants={item} className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                            {selectedDate ? (
                                <>
                                    Events for <span className="text-blue-600 dark:text-blue-400">
                                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </>
                            ) : 'Upcoming Events'}
                        </h3>

                        <div className="space-y-4">
                            {selectedDate ? (
                                events.filter(e => isSameDay(new Date(e.date), selectedDate)).length > 0 ? (
                                    events.filter(e => isSameDay(new Date(e.date), selectedDate)).map(event => (
                                        <div key={event.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 relative group">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${event.type === 'exam' ? 'bg-red-500' :
                                                    event.type === 'meeting' ? 'bg-purple-500' :
                                                        'bg-green-500'
                                                }`} />
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{event.title}</h4>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {event.time}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {event.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                        <p>No events scheduled for this day.</p>
                                        <button
                                            onClick={() => setShowAddEvent(true)}
                                            className="text-blue-600 font-medium mt-2 hover:underline"
                                        >
                                            Add one?
                                        </button>
                                    </div>
                                )
                            ) : null}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
                        <h3 className="font-bold text-lg mb-2">Upcoming Holidays</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                <div className="text-center bg-white/20 rounded-lg p-2 min-w-[50px]">
                                    <span className="block text-xs font-medium opacity-80">NOV</span>
                                    <span className="block text-xl font-bold">24</span>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Thanksgiving Break</p>
                                    <p className="text-xs text-indigo-200">No classes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                <div className="text-center bg-white/20 rounded-lg p-2 min-w-[50px]">
                                    <span className="block text-xs font-medium opacity-80">DEC</span>
                                    <span className="block text-xl font-bold">15</span>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Winter Break Starts</p>
                                    <p className="text-xs text-indigo-200">School closed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Add Event Modal (Simplified) */}
            <AnimatePresence>
                {showAddEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowAddEvent(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold dark:text-white">Add New Event</h3>
                                <button onClick={() => setShowAddEvent(false)}>
                                    <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" placeholder="e.g. Science Fair" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                        <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                                        <input type="time" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white">
                                        <option value="event">Event</option>
                                        <option value="exam">Exam</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="holiday">Holiday</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowAddEvent(false)}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 mt-2"
                                >
                                    Save Event
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CalendarPage;
