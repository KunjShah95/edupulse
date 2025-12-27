import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-600 mb-4">
                        <User className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{t('auth.loginTitle')}</h1>
                    <p className="text-zinc-400">{t('common.welcome')}</p>
                </div>

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

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">{t('common.email')}</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@edupulse.com"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">{t('common.password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors">
                            <input type="checkbox" className="mr-2 rounded border-zinc-600 bg-zinc-700 text-emerald-600 focus:ring-emerald-600/50" />
                            {t('common.rememberMe')}
                        </label>
                        <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">{t('common.forgotPassword')}</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {t('common.login')} <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-zinc-400">
                    {t('common.dontHaveAccount')}{' '}
                    <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                        {t('common.signup')}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
