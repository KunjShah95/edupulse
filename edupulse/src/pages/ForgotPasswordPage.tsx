import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { apiClient, ApiError } from '../lib/api-client';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiClient.forgotPassword(email);
            setSuccess(true);
        } catch (error) {
            setError(error instanceof ApiError ? error.message : 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
                >
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h2>
                    <p className="text-slate-600 dark:text-zinc-400 mb-6">
                        We've sent password reset instructions to <strong>{email}</strong>
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                    >
                        Back to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md"
            >
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Login
                </button>

                <div className="text-center mb-8">
                    <Mail className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
                    <p className="text-slate-600 dark:text-zinc-400">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send Reset Email'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
