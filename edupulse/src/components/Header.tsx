import { Bell, Search } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    return (
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Search Bar - Hidden on mobile for now or collapsed */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search for students, classes, or docs..."
                        className="w-96 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all placeholder:text-slate-500 dark:text-white"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sarah Wilson</p>
                        <p className="text-xs text-slate-500">Principal</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md cursor-pointer ring-2 ring-transparent hover:ring-blue-500/20 transition-all">
                        SW
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
