import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { apiClient, ApiError } from '../lib/api-client';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email) {
            navigate('/login');
        }
    }, [token, email, navigate]);

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiClient.resetPassword(token!, password);
            setSuccess(true);
        } catch (error) {
            setError(error instanceof ApiError ? error.message : 'Failed to reset password');
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Password Reset Successful</h2>
                    <p className="text-slate-600 dark:text-zinc-400 mb-6">
                        Your password has been successfully reset. You can now login with your new password.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                    >
                        Continue to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    if (!token || !email) {
        return null;
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
                    <Lock className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Your Password</h1>
                    <p className="text-slate-600 dark:text-zinc-400">
                        Create a new password for <strong>{email}</strong>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
                                placeholder="Enter new password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
                                placeholder="Confirm new password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1">
                        <p>Password must contain:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>At least 8 characters</li>
                            <li>One lowercase letter</li>
                            <li>One uppercase letter</li>
                            <li>One number</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
