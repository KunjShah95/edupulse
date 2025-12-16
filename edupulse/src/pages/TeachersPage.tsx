
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, MoreVertical, Mail, Phone, UserPlus, X, CheckCircle, GraduationCap, Briefcase } from 'lucide-react';

const initialTeachersData = [
    { id: 1, name: 'Dr. Sarah Wilson', subject: 'Mathematics', dept: 'Science', email: 'sarah.w@edupulse.com', phone: '+1 234-567-8900', status: 'Active', classes: 5 },
    { id: 2, name: 'Mr. James Brown', subject: 'Physics', dept: 'Science', email: 'james.b@edupulse.com', phone: '+1 234-567-8901', status: 'Active', classes: 4 },
    { id: 3, name: 'Mrs. Emily Davis', subject: 'English', dept: 'Languages', email: 'emily.d@edupulse.com', phone: '+1 234-567-8902', status: 'On Leave', classes: 6 },
    { id: 4, name: 'Mr. David Chen', subject: 'Computer Science', dept: 'Technology', email: 'david.c@edupulse.com', phone: '+1 234-567-8903', status: 'Active', classes: 4 },
    { id: 5, name: 'Ms. Maria Garcia', subject: 'Art', dept: 'Arts', email: 'maria.g@edupulse.com', phone: '+1 234-567-8904', status: 'Active', classes: 3 },
];

const TeachersPage = () => {
    const [teachers, setTeachers] = useState(initialTeachersData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        dept: 'Science',
        phone: ''
    });

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

    const filteredTeachers = teachers.filter(teacher =>
        (teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterDept === 'All' || teacher.dept === filterDept)
    );

    const handleAddTeacher = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus(true);

        setTimeout(() => {
            const newTeacher = {
                id: teachers.length + 1,
                name: `${formData.firstName} ${formData.lastName}`,
                subject: formData.subject,
                dept: formData.dept,
                email: formData.email,
                phone: formData.phone,
                status: 'Active',
                classes: 0
            };

            setTeachers([newTeacher, ...teachers]);

            setTimeout(() => {
                setShowAddModal(false);
                setSubmitStatus(false);
                setFormData({
                    firstName: '', lastName: '', email: '', subject: '', dept: 'Science', phone: ''
                });
            }, 1000);
        }, 1500);
    };

    return (
        <>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teachers Directory</h1>
                        <p className="text-sm text-slate-500">Manage faculty members and staff.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Teacher</span>
                    </button>
                </div>

                {/* Filters */}
                <motion.div variants={item} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="pl-10 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                            >
                                <option value="All">All Departments</option>
                                <option value="Science">Science</option>
                                <option value="Languages">Languages</option>
                                <option value="Technology">Technology</option>
                                <option value="Arts">Arts</option>
                                <option value="Humanities">Humanities</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Teachers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredTeachers.map((teacher) => (
                            <motion.div
                                key={teacher.id}
                                layout
                                variants={item}
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                                            {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{teacher.name}</h3>
                                            <p className="text-xs text-slate-500">{teacher.subject}</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Department</span>
                                        <span className="font-medium dark:text-slate-200 flex items-center gap-2">
                                            <Briefcase className="w-3 h-3 text-slate-400" />
                                            {teacher.dept}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${teacher.status === 'Active' ? 'bg-green-100 text-green-600 dark:bg-green-900/10 dark:text-green-400' :
                                            'bg-orange-100 text-orange-600 dark:bg-orange-900/10 dark:text-orange-400'
                                            }`}>
                                            {teacher.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Active Classes</span>
                                        <span className="font-medium dark:text-slate-200 flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3 text-slate-400" />
                                            {teacher.classes}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </button>
                                    <button className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Call
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredTeachers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No teachers found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                )}
            </motion.div>

            {/* Add Teacher Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden my-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold dark:text-white">New Teacher Registration</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {submitStatus ? (
                                <div className="p-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </motion.div>
                                    <h4 className="text-xl font-bold dark:text-white mb-2">Teacher Added!</h4>
                                    <p className="text-slate-500">The new teacher profile has been created successfully.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleAddTeacher} className="p-4 sm:p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                                placeholder="Sarah"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                                placeholder="Wilson"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            placeholder="sarah.white@edupulse.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                            <select
                                                value={formData.dept}
                                                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            >
                                                <option value="Science">Science</option>
                                                <option value="Languages">Languages</option>
                                                <option value="Technology">Technology</option>
                                                <option value="Arts">Arts</option>
                                                <option value="Humanities">Humanities</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Subject</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                                placeholder="Physics"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                        >
                                            Register Teacher
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default TeachersPage;
