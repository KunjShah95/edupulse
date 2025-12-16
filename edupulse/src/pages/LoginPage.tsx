import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate login
        setTimeout(() => {
            setLoading(false);
            navigate('/');
        }, 1500);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 opacity-60"
                style={{
                    backgroundImage: `url('/assets/login-bg.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-900/90 via-slate-900/50 to-blue-900/30 backdrop-blur-sm" />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "out" }}
                className="relative z-10 w-full max-w-md p-8 m-4 bg-white/10 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-md"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block p-3 mb-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-lg"
                    >
                        <User className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-blue-200">Sign in to EduPulse Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-100 ml-1">Email Address</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="email"
                                placeholder="admin@edupulse.com"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-100 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-blue-200 hover:text-white cursor-pointer transition-colors">
                            <input type="checkbox" className="mr-2 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50" />
                            Remember me
                        </label>
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    Don't have an account? <a href="#" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Contact Admin</a>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
