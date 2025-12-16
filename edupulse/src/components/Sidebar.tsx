import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Library,
    Building2,
    MessageSquare,
    X,
    Settings,
    LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Students', path: '/dashboard/students' },
        { icon: BookOpen, label: 'Academics', path: '/dashboard/academics' },
        { icon: Library, label: 'Library', path: '/dashboard/library' },
        { icon: Building2, label: 'Administration', path: '/dashboard/admin' },
        { icon: MessageSquare, label: 'Communication', path: '/dashboard/messages' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 transform lg:translate-x-0 border-r border-slate-800",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-xl font-bold">E</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    EduPulse
                                </h1>
                                <p className="text-xs text-slate-500">School Management</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-800 rounded-lg">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }: { isActive: boolean }) => cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                )}
                            >
                                {({ isActive }: { isActive: boolean }) => (
                                    <>
                                        <item.icon className={cn(
                                            "w-5 h-5 transition-colors",
                                            isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"
                                        )} />
                                        <span className="font-medium">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="absolute inset-0 border border-blue-500/20 rounded-xl"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-slate-800 space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
