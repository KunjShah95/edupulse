
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Phone, ArrowRight, ArrowLeft, GraduationCap, Users, UserCheck, BookOpen, CheckCircle, AlertCircle, Building, Key } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type SignupData } from '../context/AuthContext';

type Role = 'student' | 'teacher' | 'admin' | 'parent';

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    grade?: string;
    section?: string;
    subject?: string;
    department?: string;
    adminCode?: string;
    childName?: string;
}

const SignupPage = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [formData, setFormData] = useState<SignupData & { confirmPassword: string }>({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'student',
        grade: '',
        section: '',
        phone: '',
        subject: '',
        department: '',
        adminCode: '',
        childName: ''
    });

    const roles: { value: Role; label: string; icon: React.ElementType; description: string }[] = [
        { value: 'student', label: 'Student', icon: GraduationCap, description: 'Access courses, quizzes & learning materials' },
        { value: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Manage classes, create content & track progress' },
        { value: 'parent', label: 'Parent', icon: Users, description: 'Monitor child progress & communicate with teachers' },
        { value: 'admin', label: 'Administrator', icon: UserCheck, description: 'Full access to all school management features' }
    ];

    const validateStep1 = (): boolean => {
        const errors: FormErrors = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: FormErrors = {};
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        if (formData.phone && !/^[+]?[\d\s()-]{10,}$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateRoleSpecifics = (): boolean => {
        const errors: FormErrors = {};

        if (formData.role === 'student') {
            if (!formData.grade) errors.grade = 'Grade is required';
            if (!formData.section) errors.section = 'Section is required';
        }

        if (formData.role === 'teacher') {
            if (!formData.subject) errors.subject = 'Subject is required';
            if (!formData.department) errors.department = 'Department is required';
        }

        if (formData.role === 'parent') {
            if (!formData.childName) errors.childName = "Child's name is required";
        }

        if (formData.role === 'admin') {
            if (!formData.adminCode) errors.adminCode = 'Admin access code is required';
            // Simple validation for demo
            if (formData.adminCode && formData.adminCode !== 'ADMIN123') {
                errors.adminCode = 'Invalid access code (Try "ADMIN123")';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setFormErrors({});
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateRoleSpecifics()) return;

        setLoading(true);
        setError('');

        const result = await signup({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            grade: formData.grade,
            section: formData.section,
            phone: formData.phone,
            subject: formData.subject,
            department: formData.department,
            adminCode: formData.adminCode,
            childName: formData.childName
        });

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Signup failed. Please try again.');
        }
        setLoading(false);
    };

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg"
            >
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                                    }`}
                            >
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-zinc-800'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-6 sm:p-8 text-center border-b border-zinc-800">
                        <h1 className="text-2xl font-bold text-white mb-1">Create Your Account</h1>
                        <p className="text-zinc-400 text-sm">Join EduPulse and start your learning journey</p>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-300">{error}</p>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* Step 1: Basic Info */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">First Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => updateFormData('firstName', e.target.value)}
                                                    placeholder="John"
                                                    className={`w-full bg-zinc-800 border ${formErrors.firstName ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all`}
                                                />
                                            </div>
                                            {formErrors.firstName && <p className="text-xs text-red-400">{formErrors.firstName}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Last Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => updateFormData('lastName', e.target.value)}
                                                    placeholder="Doe"
                                                    className={`w-full bg-zinc-800 border ${formErrors.lastName ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all`}
                                                />
                                            </div>
                                            {formErrors.lastName && <p className="text-xs text-red-400">{formErrors.lastName}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => updateFormData('email', e.target.value)}
                                                placeholder="john.doe@example.com"
                                                className={`w-full bg-zinc-800 border ${formErrors.email ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all`}
                                            />
                                        </div>
                                        {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Password & Contact */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => updateFormData('password', e.target.value)}
                                                placeholder="••••••••"
                                                className={`w-full bg-zinc-800 border ${formErrors.password ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all`}
                                            />
                                        </div>
                                        {formErrors.password && <p className="text-xs text-red-400">{formErrors.password}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                                placeholder="••••••••"
                                                className={`w-full bg-zinc-800 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all`}
                                            />
                                        </div>
                                        {formErrors.confirmPassword && <p className="text-xs text-red-400">{formErrors.confirmPassword}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Phone Number (Optional)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => updateFormData('phone', e.target.value)}
                                                placeholder="+1 (555) 000-0000"
                                                className={`w-full bg-zinc-800 border ${formErrors.phone ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all`}
                                            />
                                        </div>
                                        {formErrors.phone && <p className="text-xs text-red-400">{formErrors.phone}</p>}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Role Selection and Details */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <p className="text-sm text-zinc-400 mb-4">Select your role to personalize your experience</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {roles.map((role) => (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, role: role.value }));
                                                    setFormErrors({});
                                                }}
                                                className={`p-4 rounded-xl border text-left transition-all ${formData.role === role.value
                                                    ? 'border-emerald-600 bg-emerald-600/10'
                                                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${formData.role === role.value
                                                        ? 'bg-emerald-600/20 text-emerald-400'
                                                        : 'bg-zinc-700 text-zinc-400'
                                                        }`}>
                                                        {React.createElement(role.icon, { className: "w-5 h-5" })}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className={`font-medium ${formData.role === role.value ? 'text-white' : 'text-zinc-300'}`}>
                                                            {role.label}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                                            {role.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dynamic Fields Based on Role */}
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="pt-4 border-t border-zinc-800 mt-4"
                                    >
                                        {formData.role === 'student' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-300">Grade <span className="text-red-500">*</span></label>
                                                    <select
                                                        value={formData.grade}
                                                        onChange={(e) => updateFormData('grade', e.target.value)}
                                                        className={`w-full bg-zinc-800 border ${formErrors.grade ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600`}
                                                    >
                                                        <option value="">Select Grade</option>
                                                        {[...Array(12)].map((_, i) => (
                                                            <option key={i} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                                                        ))}
                                                    </select>
                                                    {formErrors.grade && <p className="text-xs text-red-400">{formErrors.grade}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-300">Section <span className="text-red-500">*</span></label>
                                                    <select
                                                        value={formData.section}
                                                        onChange={(e) => updateFormData('section', e.target.value)}
                                                        className={`w-full bg-zinc-800 border ${formErrors.section ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600`}
                                                    >
                                                        <option value="">Select Section</option>
                                                        {['A', 'B', 'C', 'D', 'E'].map((section) => (
                                                            <option key={section} value={section}>Section {section}</option>
                                                        ))}
                                                    </select>
                                                    {formErrors.section && <p className="text-xs text-red-400">{formErrors.section}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {formData.role === 'teacher' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-300">Subject <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                                        <input
                                                            type="text"
                                                            value={formData.subject}
                                                            onChange={(e) => updateFormData('subject', e.target.value)}
                                                            placeholder="Math, Physics"
                                                            className={`w-full bg-zinc-800 border ${formErrors.subject ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600`}
                                                        />
                                                    </div>
                                                    {formErrors.subject && <p className="text-xs text-red-400">{formErrors.subject}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-300">Department <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                                        <select
                                                            value={formData.department}
                                                            onChange={(e) => updateFormData('department', e.target.value)}
                                                            className={`w-full bg-zinc-800 border ${formErrors.department ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 appearance-none`}
                                                        >
                                                            <option value="">Select Dept</option>
                                                            <option value="Science">Science</option>
                                                            <option value="Mathematics">Mathematics</option>
                                                            <option value="Humanities">Humanities</option>
                                                            <option value="Languages">Languages</option>
                                                            <option value="Arts">Arts</option>
                                                        </select>
                                                    </div>
                                                    {formErrors.department && <p className="text-xs text-red-400">{formErrors.department}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {formData.role === 'parent' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300">Child's Name <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                                    <input
                                                        type="text"
                                                        value={formData.childName}
                                                        onChange={(e) => updateFormData('childName', e.target.value)}
                                                        placeholder="Enter your child's full name"
                                                        className={`w-full bg-zinc-800 border ${formErrors.childName ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600`}
                                                    />
                                                </div>
                                                {formErrors.childName && <p className="text-xs text-red-400">{formErrors.childName}</p>}
                                            </div>
                                        )}

                                        {formData.role === 'admin' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300">Admin Secret Code <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                                    <input
                                                        type="password"
                                                        value={formData.adminCode}
                                                        onChange={(e) => updateFormData('adminCode', e.target.value)}
                                                        placeholder="Enter admin access code"
                                                        className={`w-full bg-zinc-800 border ${formErrors.adminCode ? 'border-red-500' : 'border-zinc-700'} rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600`}
                                                    />
                                                </div>
                                                {formErrors.adminCode && <p className="text-xs text-red-400">{formErrors.adminCode}</p>}
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 mt-8">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-3.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium hover:bg-zinc-700 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Create Account <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 text-center text-sm text-zinc-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;
