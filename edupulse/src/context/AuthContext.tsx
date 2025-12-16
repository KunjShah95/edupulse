import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// User interface
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    avatar?: string;
    grade?: string;
    section?: string;
    phone?: string;
    subject?: string;
    department?: string;
    adminCode?: string;
    childName?: string;
    createdAt: string;
    // Gamification data
    points: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    badges: Badge[];
    quizHistory: QuizResult[];
    streak: number;
    lastActiveDate: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface QuizResult {
    id: string;
    quizId: string;
    quizTitle: string;
    subject: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    completedAt: string;
    timeTaken: number; // in seconds
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    addPoints: (points: number, reason: string) => void;
    addBadge: (badge: Omit<Badge, 'earnedAt'>) => void;
    addQuizResult: (result: Omit<QuizResult, 'id'>) => void;
}

export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    grade?: string;
    section?: string;
    phone?: string;
    subject?: string;
    department?: string;
    adminCode?: string;
    childName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to calculate level from XP
const calculateLevel = (xp: number): { level: number; xpToNextLevel: number } => {
    const baseXP = 100;
    const multiplier = 1.5;
    let level = 1;
    let totalXPForLevel = baseXP;
    let accumulatedXP = 0;

    while (accumulatedXP + totalXPForLevel <= xp) {
        accumulatedXP += totalXPForLevel;
        level++;
        totalXPForLevel = Math.floor(baseXP * Math.pow(multiplier, level - 1));
    }

    return {
        level,
        xpToNextLevel: totalXPForLevel - (xp - accumulatedXP)
    };
};

// Generate unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('edupulse_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Check streak
                const today = new Date().toDateString();
                if (parsedUser.lastActiveDate !== today) {
                    const lastActive = new Date(parsedUser.lastActiveDate);
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (lastActive.toDateString() === yesterday.toDateString()) {
                        parsedUser.streak += 1;
                    } else if (lastActive.toDateString() !== today) {
                        parsedUser.streak = 1; // Reset streak if more than 1 day gap
                    }
                    parsedUser.lastActiveDate = today;
                }
                setUser(parsedUser);
                localStorage.setItem('edupulse_user', JSON.stringify(parsedUser));
            } catch (e) {
                localStorage.removeItem('edupulse_user');
            }
        }
        setIsLoading(false);
    }, []);

    // Save user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('edupulse_user', JSON.stringify(user));
        }
    }, [user]);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user exists in localStorage (users database)
        const usersDb = JSON.parse(localStorage.getItem('edupulse_users_db') || '[]');
        const storedUser = usersDb.find((u: { email: string; password: string }) => u.email === email);

        if (!storedUser) {
            setIsLoading(false);
            return { success: false, error: 'No account found with this email address' };
        }

        if (storedUser.password !== password) {
            setIsLoading(false);
            return { success: false, error: 'Incorrect password' };
        }

        // Remove password before setting user state
        const { password: _, ...userWithoutPassword } = storedUser;
        userWithoutPassword.lastActiveDate = new Date().toDateString();

        setUser(userWithoutPassword);
        setIsLoading(false);
        return { success: true };
    };

    const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user already exists
        const usersDb = JSON.parse(localStorage.getItem('edupulse_users_db') || '[]');
        const existingUser = usersDb.find((u: { email: string }) => u.email === userData.email);

        if (existingUser) {
            setIsLoading(false);
            return { success: false, error: 'An account with this email already exists' };
        }

        // Create new user
        const newUser: User & { password: string } = {
            id: generateId(),
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            grade: userData.grade,
            section: userData.section,
            phone: userData.phone,
            subject: userData.subject,
            department: userData.department,
            adminCode: userData.adminCode,
            childName: userData.childName,
            createdAt: new Date().toISOString(),
            // Initialize gamification data
            points: 100, // Welcome bonus
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            badges: [{
                id: generateId(),
                name: 'Welcome Explorer',
                description: 'Successfully joined EduPulse!',
                icon: '🎉',
                earnedAt: new Date().toISOString(),
                rarity: 'common'
            }],
            quizHistory: [],
            streak: 1,
            lastActiveDate: new Date().toDateString()
        };

        // Save to users database
        usersDb.push(newUser);
        localStorage.setItem('edupulse_users_db', JSON.stringify(usersDb));

        // Set current user (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        setIsLoading(false);

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('edupulse_user');
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        // Also update in users database
        const usersDb = JSON.parse(localStorage.getItem('edupulse_users_db') || '[]');
        const userIndex = usersDb.findIndex((u: { id: string }) => u.id === user.id);
        if (userIndex !== -1) {
            usersDb[userIndex] = { ...usersDb[userIndex], ...updates };
            localStorage.setItem('edupulse_users_db', JSON.stringify(usersDb));
        }
    };

    const addPoints = (points: number, _reason: string) => {
        if (!user) return;

        const newXP = user.xp + points;
        const { level, xpToNextLevel } = calculateLevel(newXP);

        updateUser({
            points: user.points + points,
            xp: newXP,
            level,
            xpToNextLevel
        });
    };

    const addBadge = (badge: Omit<Badge, 'earnedAt'>) => {
        if (!user) return;

        // Check if badge already exists
        if (user.badges.some(b => b.id === badge.id)) return;

        const newBadge: Badge = {
            ...badge,
            earnedAt: new Date().toISOString()
        };

        updateUser({
            badges: [...user.badges, newBadge]
        });
    };

    const addQuizResult = (result: Omit<QuizResult, 'id'>) => {
        if (!user) return;

        const newResult: QuizResult = {
            ...result,
            id: generateId()
        };

        // Add XP from quiz
        addPoints(result.xpEarned, `Completed quiz: ${result.quizTitle}`);

        updateUser({
            quizHistory: [...user.quizHistory, newResult]
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                logout,
                updateUser,
                addPoints,
                addBadge,
                addQuizResult
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
