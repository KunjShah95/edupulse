import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAnnouncement, useFocusTrap } from '../hooks/useAccessibility';
import { apiClient } from '../lib/api-client';
import type { Notification } from '../lib/api-client';



interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const { announce } = useAnnouncement();
    const containerRef = useFocusTrap(isOpen);

    const loadNotifications = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await apiClient.getNotifications();
            setNotifications(response);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Load notifications
    useEffect(() => {
        if (isOpen) {
            void loadNotifications();
        }
    }, [isOpen, loadNotifications]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const markAsRead = async (notificationId: string) => {
        try {
            await apiClient.markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );
            announce('Notification marked as read', 'polite');
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.markAllNotificationsAsRead();
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );
            announce('All notifications marked as read', 'polite');
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        announce('Notification deleted', 'polite');
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '📢';
        }
    };

    const getCategoryColor = (category: Notification['category']) => {
        switch (category) {
            case 'system': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'quiz': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
            case 'message': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'assignment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
            case 'announcement': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.read;
        if (filter === 'high') return notification.priority === 'high';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4">
            <motion.div
                ref={containerRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md h-96 border border-slate-200 dark:border-zinc-700 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Notifications
                        </h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                        aria-label="Close notification center"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-zinc-700">
                    <div className="flex gap-1">
                        {(['all', 'unread', 'high'] as const).map((filterType) => (
                            <button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                    filter === filterType
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            </button>
                        ))}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="ml-auto px-3 py-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-slate-500 dark:text-zinc-400">
                            <div className="text-center">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No notifications</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            <AnimatePresence>
                                {filteredNotifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`p-3 rounded-lg border transition-colors ${
                                            notification.read
                                                ? 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                                                : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-lg">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`text-sm font-medium truncate ${
                                                        notification.read
                                                            ? 'text-slate-600 dark:text-zinc-400'
                                                            : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(notification.category)}`}>
                                                        {notification.category}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-zinc-400 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                                                aria-label="Mark as read"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteNotification(notification.id)}
                                                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            aria-label="Delete notification"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
                    <div className="flex items-center justify-between">
                        <button
                            className="text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            aria-label="Open notification settings"
                        >
                            Notification Settings
                        </button>
                        <button
                            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                            aria-label="View all notifications"
                        >
                            View All
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default NotificationCenter;
