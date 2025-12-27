import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Clock, BookOpen, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';

interface SearchResult {
    id: string;
    type: 'quiz' | 'lesson' | 'user' | 'message' | 'file';
    title: string;
    description?: string;
    metadata?: {
        subject?: string;
        grade?: string;
        role?: string;
        date?: string;
        size?: string;
    };
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    route: string;
}

// Minimal API shapes used by this component
interface QuizApi {
    id: string;
    title: string;
    description?: string;
    subject?: string;
    grade?: string;
    createdAt?: string;
}

interface UserApi {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
    createdAt?: string;
}

interface MessageApi {
    id: string;
    subject?: string;
    content: string;
    createdAt?: string;
    conversationId?: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Focus input when search opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('edupulse_recent_searches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    // Selection handler (used by keyboard navigation)
    const handleSelect = useCallback((item: SearchResult | { title: string; route?: string }) => {
        const newRecentSearches = [
            query,
            ...recentSearches.filter(s => s !== query)
        ].slice(0, 5);

        setRecentSearches(newRecentSearches);
        localStorage.setItem('edupulse_recent_searches', JSON.stringify(newRecentSearches));

        if ('route' in item && item.route) {
            navigate(item.route);
            onClose();
        }
    }, [query, recentSearches, navigate, onClose]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const maxIndex = (query ? results.length : recentSearches.length) - 1;
            setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                const item = query ? results[selectedIndex] : { title: recentSearches[selectedIndex] };
                handleSelect(item as SearchResult | { title: string; route?: string });
            }
        }
    }, [isOpen, query, results, recentSearches, selectedIndex, onClose, handleSelect]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        setLoading(true);
        try {
            // Search across different content types
            const [quizzes, users, messages] = await Promise.all([
                apiClient.getQuizzes({ subject: searchQuery }).catch(() => []),
                apiClient.getUsers({ role: searchQuery }).catch(() => []),
                apiClient.getMessages().catch(() => [])
            ]);

            // Transform API results to SearchResult format
            const quizzesList = (quizzes as QuizApi[]).map(q => ({
                id: q.id,
                type: 'quiz' as const,
                title: q.title,
                description: q.description,
                metadata: {
                    subject: q.subject,
                    grade: q.grade,
                    date: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : undefined
                },
                icon: BookOpen,
                route: `/quiz/${q.id}`
            }));

            const usersList = (users as UserApi[]).map(u => ({
                id: u.id,
                type: 'user' as const,
                title: `${u.firstName} ${u.lastName}`,
                metadata: {
                    role: u.role,
                    date: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : undefined
                },
                icon: Users,
                route: `/profile/${u.id}`
            }));

            const messagesList = (messages as MessageApi[]).map(m => ({
                id: m.id,
                type: 'message' as const,
                title: m.subject || (m.content ? `${m.content.substring(0, 50)}...` : 'Message'),
                description: m.content,
                metadata: {
                    date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : undefined
                },
                icon: MessageSquare,
                route: `/messages/${m.conversationId || ''}`
            }));

            setResults([...quizzesList, ...usersList, ...messagesList]);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    

    const handleRecentSearchSelect = (search: string) => {
        setQuery(search);
        performSearch(search);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('edupulse_recent_searches');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-zinc-700">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search quizzes, users, messages..."
                        className="flex-1 text-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    <button
                        onClick={onClose}
                        aria-label="Close search"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X className="w-5 h-5" aria-hidden />
                    </button>
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                            <span className="ml-2 text-slate-600 dark:text-zinc-400">Searching...</span>
                        </div>
                    )}

                    {!loading && query && results.length === 0 && (
                        <div className="p-8 text-center text-slate-500 dark:text-zinc-400">
                            No results found for "{query}"
                        </div>
                    )}

                    {!query && recentSearches.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Recent Searches</h3>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={search}
                                        onClick={() => handleRecentSearchSelect(search)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                            index === selectedIndex
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                                : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && query && results.length > 0 && (
                        <div className="p-2">
                            {results.map((result, index) => {
                                const Icon = result.icon;
                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSelect(result)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-colors ${
                                            index === selectedIndex
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'hover:bg-slate-50 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800">
                                            <Icon className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-900 dark:text-white font-medium truncate">
                                                {result.title}
                                            </p>
                                            {result.description && (
                                                <p className="text-sm text-slate-500 dark:text-zinc-400 truncate">
                                                    {result.description}
                                                </p>
                                            )}
                                            {result.metadata && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {result.metadata.subject && (
                                                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded">
                                                            {result.metadata.subject}
                                                        </span>
                                                    )}
                                                    {result.metadata.role && (
                                                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                                            {result.metadata.role}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Search Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                        <div className="flex items-center gap-4">
                            <span>↑↓ Navigate</span>
                            <span>↵ Select</span>
                            <span>esc Close</span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-zinc-500">
                            Search across all content
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GlobalSearch;
