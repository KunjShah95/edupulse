// Landing Page Component

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';


const LandingPage = () => {
    const targetRef = useRef<HTMLDivElement>(null);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-blue-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-xl font-bold">E</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            EduPulse
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#about" className="hover:text-white transition-colors">About</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/signup" className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/50">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section ref={targetRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Left Column: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            <span>The Future of Education</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                            <span className="text-white">Learn Without</span> <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                Boundaries
                            </span>
                        </h1>

                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                            Experience a truly global classroom. Connect, learn, and grow with EduPulse's immersive learning platform designed for the modern era.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/dashboard" className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10">
                                Launch Dashboard
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700">
                                <Play className="w-5 h-5 fill-current" />
                                Watch Demo
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Column: Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Outer Glow Effect */}
                        <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-cyan-500/30 blur-2xl rounded-3xl opacity-60" />

                        {/* Animated Gradient Border Container */}
                        <div className="relative p-[3px] rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 shadow-2xl shadow-blue-500/25">
                            {/* Inner Background */}
                            <div className="absolute inset-[3px] bg-slate-950 rounded-[14px]" />

                            {/* Image Container */}
                            <div className="relative z-10 rounded-[14px] overflow-hidden">
                                <img
                                    src="/hero-image.jpg"
                                    alt="EduPulse - Contemporary School Management System - Digital Learning"
                                    className="w-full h-auto object-cover"
                                />
                                {/* Subtle Inner Glow Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-blue-500/10 pointer-events-none" />
                            </div>
                        </div>

                        {/* Corner Accents */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-blue-400 rounded-tl-lg" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-purple-400 rounded-tr-lg" />
                        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-cyan-400 rounded-bl-lg" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-blue-400 rounded-br-lg" />
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
                            Everything you need
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Comprehensive tools for students, teachers, and administrators to manage the complete educational lifecycle.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Smart Attendance", desc: "Automated tracking with biometric integration support." },
                            { title: "Grade Management", desc: "Flexible grading scales and automated report card generation." },
                            { title: "Library System", desc: "Digital cataloging with issue/return tracking." },
                            { title: "Fee Management", desc: "Secure online payments and automated reminders." },
                            { title: "Transport", desc: "Real-time bus tracking and route optimization." },
                            { title: "Communication", desc: "Instant messaging between parents, teachers, and staff." }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <CheckCircle className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-sm">© 2025 EduPulse. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors">Terms</a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
