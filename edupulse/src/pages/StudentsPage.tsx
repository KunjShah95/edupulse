
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, MoreVertical, Mail, Phone, UserPlus, X, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const initialStudentsData = [
    { id: 1, name: 'Emma Thompson', grade: '10th', section: 'A', rollNo: '1001', parent: 'Robert Thompson', contact: '+1 234-567-8900', status: 'Active', attendance: '98%' },
    { id: 2, name: 'James Wilson', grade: '10th', section: 'B', rollNo: '1002', parent: 'Sarah Wilson', contact: '+1 234-567-8901', status: 'Active', attendance: '95%' },
    { id: 3, name: 'Sophia Chen', grade: '9th', section: 'A', rollNo: '9001', parent: 'David Chen', contact: '+1 234-567-8902', status: 'On Leave', attendance: '88%' },
    { id: 4, name: 'Michael Brown', grade: '11th', section: 'C', rollNo: '1103', parent: 'Jennifer Brown', contact: '+1 234-567-8903', status: 'Active', attendance: '92%' },
    { id: 5, name: 'Lucas Martinez', grade: '12th', section: 'A', rollNo: '1205', parent: 'Maria Martinez', contact: '+1 234-567-8904', status: 'Active', attendance: '96%' },
    { id: 6, name: 'Olivia Taylor', grade: '8th', section: 'B', rollNo: '8004', parent: 'John Taylor', contact: '+1 234-567-8905', status: 'Inactive', attendance: '0%' },
];

const StudentsPage = () => {
    const [students, setStudents] = useState(initialStudentsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [admissionSubmitted, setAdmissionSubmitted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        grade: '1',
        section: 'A',
        parentPhone: ''
    });
    const { addToast } = useToast();

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

    const filteredStudents = students.filter(student =>
        (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.rollNo.includes(searchTerm)) &&
        (filterGrade === 'All' || student.grade === filterGrade)
    );

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        setAdmissionSubmitted(true);

        // Simulate API call
        setTimeout(() => {
            const newStudent = {
                id: students.length + 1,
                name: `${formData.firstName} ${formData.lastName}`,
                grade: `${formData.grade}th`,
                section: formData.section,
                rollNo: `${parseInt(formData.grade) * 1000 + students.length + 1}`,
                parent: 'Parent/Guardian', // Simplified for demo
                contact: formData.parentPhone,
                status: 'Active',
                attendance: '100%'
            };

            setStudents([newStudent, ...students]);

            setTimeout(() => {
                setShowAddModal(false);
                setAdmissionSubmitted(false);
                addToast('Student added successfully!', 'success');
                setFormData({
                    firstName: '', lastName: '', email: '', grade: '1', section: 'A', parentPhone: ''
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
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students Directory</h1>
                        <p className="text-sm text-slate-500">Manage student records, admissions, and details.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Student</span>
                    </button>
                </div>

                {/* Filters */}
                <motion.div variants={item} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or roll number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value)}
                                className="pl-10 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                            >
                                <option value="All">All Grades</option>
                                <option value="8th">8th Grade</option>
                                <option value="9th">9th Grade</option>
                                <option value="10th">10th Grade</option>
                                <option value="11th">11th Grade</option>
                                <option value="12th">12th Grade</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Students List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredStudents.map((student) => (
                            <motion.div
                                key={student.id}
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
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{student.name}</h3>
                                            <p className="text-xs text-slate-500">Roll No: {student.rollNo}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToast('More options coming soon', 'info')}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Class</span>
                                        <span className="font-medium dark:text-slate-200">{student.grade} - {student.section}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Attendance</span>
                                        <span className={`font-medium ${parseInt(student.attendance) >= 90 ? 'text-green-500' :
                                            parseInt(student.attendance) >= 75 ? 'text-yellow-500' : 'text-red-500'
                                            }`}>{student.attendance}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-green-100 text-green-600 dark:bg-green-900/10 dark:text-green-400' :
                                            student.status === 'On Leave' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/10 dark:text-orange-400' :
                                                'bg-red-100 text-red-600 dark:bg-red-900/10 dark:text-red-400'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => addToast(`Drafting email to ${student.name}'s parent...`, 'info')}
                                        className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </button>
                                    <button
                                        onClick={() => addToast(`Calling ${student.contact}...`, 'success')}
                                        className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No students found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                )}
            </motion.div>

            {/* Add Student Modal */}
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
                                <h3 className="text-lg font-bold dark:text-white">New Student Admission</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
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
                                <form onSubmit={handleAddStudent} className="p-4 sm:p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                                placeholder="John"
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
                                                placeholder="Doe"
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
                                            placeholder="john.doe@example.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                                            <select
                                                value={formData.grade}
                                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            >
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i} value={i + 1}>Grade {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section</label>
                                            <select
                                                value={formData.section}
                                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dark:text-white"
                                            >
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
                                            value={formData.parentPhone}
                                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
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
                                            Submit Admission
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

export default StudentsPage;
