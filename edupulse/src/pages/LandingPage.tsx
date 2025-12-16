// Landing Page Component - Clean Professional Design

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, CheckCircle, Users, BookOpen, Award, X, Menu, Star, Quote, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const navigate = useNavigate();

    const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        setMobileMenuOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleGetStarted = useCallback(() => {
        navigate('/login');
    }, [navigate]);

    const features = [
        { title: "Smart Attendance", desc: "Automated tracking with biometric integration support.", icon: Users },
        { title: "Grade Management", desc: "Flexible grading scales and automated report card generation.", icon: BookOpen },
        { title: "Library System", desc: "Digital cataloging with issue/return tracking.", icon: BookOpen },
        { title: "Fee Management", desc: "Secure online payments and automated reminders.", icon: CheckCircle },
        { title: "Transport", desc: "Real-time bus tracking and route optimization.", icon: CheckCircle },
        { title: "Communication", desc: "Instant messaging between parents, teachers, and staff.", icon: CheckCircle }
    ];

    const testimonials = [
        {
            name: "Dr. Sarah Johnson",
            role: "Principal, Greenwood Academy",
            content: "EduPulse transformed how we manage our school. The attendance and grade management features alone have saved us countless hours.",
            rating: 5
        },
        {
            name: "Michael Chen",
            role: "IT Director, Springfield Schools",
            content: "Implementation was seamless. The support team was exceptional, and our staff adapted quickly to the intuitive interface.",
            rating: 5
        },
        {
            name: "Emily Rodriguez",
            role: "Parent",
            content: "I love being able to track my child's progress in real-time. The communication features keep me connected with teachers effortlessly.",
            rating: 5
        }
    ];

    const stats = [
        { value: "500+", label: "Schools Trust Us" },
        { value: "1M+", label: "Students Managed" },
        { value: "99.9%", label: "Uptime" },
        { value: "24/7", label: "Support" }
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden scroll-smooth">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <span className="text-lg sm:text-xl font-bold text-white">E</span>
                        </div>
                        <span className="text-lg sm:text-xl font-semibold text-white">
                            EduPulse
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors">
                            Features
                        </a>
                        <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-white transition-colors">
                            About
                        </a>
                        <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="hover:text-white transition-colors">
                            Testimonials
                        </a>
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2">
                            Sign In
                        </Link>
                        <button
                            onClick={handleGetStarted}
                            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-zinc-900 border-b border-zinc-800"
                        >
                            <div className="px-4 py-4 space-y-3">
                                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="block py-2 text-zinc-300 hover:text-white">
                                    Features
                                </a>
                                <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="block py-2 text-zinc-300 hover:text-white">
                                    About
                                </a>
                                <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="block py-2 text-zinc-300 hover:text-white">
                                    Testimonials
                                </a>
                                <div className="pt-3 border-t border-zinc-700 space-y-3">
                                    <Link to="/login" className="block py-2 text-zinc-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                                        Sign In
                                    </Link>
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                                        className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 lg:pt-44 lg:pb-32 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column: Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 text-xs font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Modern School Management</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
                            Streamline Your <br />
                            <span className="text-emerald-400">School Operations</span>
                        </h1>

                        <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
                            A comprehensive platform to manage students, teachers, attendance, grades, and more. Built for modern educational institutions.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                to="/dashboard"
                                className="px-8 py-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors"
                            >
                                Launch Dashboard
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => setShowDemoModal(true)}
                                className="px-8 py-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-base flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
                            >
                                <Play className="w-5 h-5" />
                                Watch Demo
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Column: Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative"
                    >
                        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                            <img
                                src="/hero-image.jpg"
                                alt="EduPulse Dashboard"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                                    {stat.value}
                                </div>
                                <div className="text-sm sm:text-base text-zinc-500 mt-2">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 sm:py-28 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Everything you need
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            Comprehensive tools for students, teachers, and administrators to manage the complete educational lifecycle.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-5">
                                    <feature.icon className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 sm:py-28 bg-zinc-900/50 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                                <Award className="w-3.5 h-3.5" />
                                <span>About EduPulse</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white">
                                Transforming Education with Modern Technology
                            </h2>
                            <p className="text-zinc-400 leading-relaxed">
                                EduPulse is a comprehensive school management system designed to streamline educational operations.
                                We believe in making education accessible, efficient, and engaging for everyone involved.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "AI-powered learning recommendations",
                                    "Real-time analytics and reporting",
                                    "Secure cloud-based infrastructure",
                                    "Mobile-first responsive design"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { title: "Students", value: "1M+", color: "bg-emerald-600" },
                                    { title: "Schools", value: "500+", color: "bg-zinc-700" },
                                    { title: "Teachers", value: "50K+", color: "bg-zinc-700" },
                                    { title: "Countries", value: "25+", color: "bg-emerald-600" }
                                ].map((stat, i) => (
                                    <div key={i} className={`p-6 rounded-xl ${stat.color}`}>
                                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                                        <div className="text-sm text-white/70 mt-1">{stat.title}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 sm:py-28 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                            What People Say
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            Hear from educators and parents who have transformed their educational experience with EduPulse.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="p-6 rounded-xl bg-zinc-900 border border-zinc-800"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <Quote className="w-8 h-8 text-zinc-700 mb-4" />
                                <p className="text-zinc-300 leading-relaxed mb-6">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium text-sm">
                                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{testimonial.name}</div>
                                        <div className="text-xs text-zinc-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 sm:py-28">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-10 sm:p-14 rounded-2xl bg-emerald-600"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Ready to Transform Your School?
                        </h2>
                        <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of educators who have already made the switch to EduPulse.
                            Start your free trial today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/login"
                                className="px-8 py-4 rounded-lg bg-white text-emerald-700 font-semibold hover:bg-zinc-100 transition-colors"
                            >
                                Start Free Trial
                            </Link>
                            <button
                                onClick={() => scrollToSection({ preventDefault: () => { } } as React.MouseEvent<HTMLAnchorElement>, 'features')}
                                className="px-8 py-4 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
                            >
                                Learn More
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div className="sm:col-span-2 lg:col-span-1">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                    <span className="text-lg font-bold">E</span>
                                </div>
                                <span className="text-lg font-semibold">EduPulse</span>
                            </Link>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Transforming education through modern technology and innovative solutions.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-medium text-white mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-zinc-500">
                                <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors">Features</a></li>
                                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-medium text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-zinc-500">
                                <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="hover:text-white transition-colors">Testimonials</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-medium text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-zinc-500">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-zinc-500 text-sm">© 2025 EduPulse. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Privacy</a>
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Terms</a>
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Demo Modal */}
            <AnimatePresence>
                {showDemoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                        onClick={() => setShowDemoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-3xl bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 flex items-center justify-between border-b border-zinc-800">
                                <h3 className="text-lg font-semibold text-white">EduPulse Demo</h3>
                                <button
                                    onClick={() => setShowDemoModal(false)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                            <div className="aspect-video bg-zinc-950 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <Play className="w-8 h-8 text-zinc-400" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-white mb-2">Demo Video Coming Soon</h4>
                                    <p className="text-zinc-400 mb-6">
                                        In the meantime, explore our dashboard to see EduPulse in action!
                                    </p>
                                    <Link
                                        to="/dashboard"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                                        onClick={() => setShowDemoModal(false)}
                                    >
                                        Explore Dashboard
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
