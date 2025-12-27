// API Client for EduPulse Frontend

// Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number = 500, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
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
    points: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    badges: Badge[];
    quizHistory: QuizResult[];
    streak: number;
    lastActiveDate: string;
}

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    subject: string;
    grade: string;
    timeLimit: number;
    passingScore: number;
    questions: QuizQuestion[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points: number;
}

export interface QuizSubmission {
    id: string;
    quizId: string;
    userId: string;
    answers: { [questionId: string]: string };
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    completedAt: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'system' | 'quiz' | 'message' | 'assignment' | 'announcement';
    priority: 'low' | 'medium' | 'high';
    read: boolean;
    actionUrl?: string;
    actionText?: string;
    createdAt: string;
    expiresAt?: string;
}

// API Client Class
class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001/api') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('edupulse_token');
    }

    private async request<T = unknown>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(data.message || 'API request failed', response.status, data.code);
            }

            return {
                success: true,
                data: data.data || data,
                message: data.message,
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
            }
            
            throw new ApiError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
        }
    }

    private setToken(token: string) {
        this.token = token;
        localStorage.setItem('edupulse_token', token);
    }

    private clearToken() {
        this.token = null;
        localStorage.removeItem('edupulse_token');
    }

    // Authentication Methods
    async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
        const response = await this.request<{ user: User; token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.data) {
            this.setToken(response.data.token);
        }

        return response.data!;
    }

    async signup(userData: SignupRequest): Promise<{ user: User; token: string }> {
        const response = await this.request<{ user: User; token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.data) {
            this.setToken(response.data.token);
        }

        return response.data!;
    }

    async logout(): Promise<void> {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            // Even if logout fails on server, clear local token
            console.error('Logout error:', error);
        } finally {
            this.clearToken();
        }
    }

    async refreshToken(): Promise<string> {
        const response = await this.request<{ token: string }>('/auth/refresh', {
            method: 'POST',
        });

        if (response.data) {
            this.setToken(response.data.token);
            return response.data.token;
        }

        throw new Error('Failed to refresh token');
    }

    async getCurrentUser(): Promise<User> {
        const response = await this.request<User>('/auth/me');
        return response.data!;
    }

    // Password Reset Methods
    async forgotPassword(email: string): Promise<void> {
        await this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token: string, password: string): Promise<void> {
        await this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    }

    // Quiz Methods
    async getQuizzes(filters?: {
        subject?: string;
        grade?: string;
        createdBy?: string;
    }): Promise<Quiz[]> {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
        }

        const response = await this.request<Quiz[]>(`/quiz${queryParams.toString() ? `?${queryParams}` : ''}`);
        return response.data!;
    }

    async getQuiz(id: string): Promise<Quiz> {
        const response = await this.request<Quiz>(`/quiz/${id}`);
        return response.data!;
    }

    async createQuiz(quizData: Omit<Quiz, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Quiz> {
        const response = await this.request<Quiz>('/quiz', {
            method: 'POST',
            body: JSON.stringify(quizData),
        });
        return response.data!;
    }

    async updateQuiz(id: string, quizData: Partial<Quiz>): Promise<Quiz> {
        const response = await this.request<Quiz>(`/quiz/${id}`, {
            method: 'PUT',
            body: JSON.stringify(quizData),
        });
        return response.data!;
    }

    async deleteQuiz(id: string): Promise<void> {
        await this.request(`/quiz/${id}`, {
            method: 'DELETE',
        });
    }

    async submitQuiz(quizId: string, answers: { [questionId: string]: string }): Promise<QuizSubmission> {
        const response = await this.request<QuizSubmission>(`/quiz/${quizId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        });
        return response.data!;
    }

    async getQuizSubmissions(userId?: string): Promise<QuizSubmission[]> {
        const endpoint = userId ? `/quiz/submissions?userId=${userId}` : '/quiz/submissions';
        const response = await this.request<QuizSubmission[]>(endpoint);
        return response.data!;
    }

    // User Methods
    async getUsers(filters?: {
        role?: string;
        grade?: string;
        subject?: string;
    }): Promise<User[]> {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
        }

        const response = await this.request<User[]>(`/users${queryParams.toString() ? `?${queryParams}` : ''}`);
        return response.data!;
    }

    async getUser(id: string): Promise<User> {
        const response = await this.request<User>(`/users/${id}`);
        return response.data!;
    }

    async updateUser(id: string, userData: Partial<User>): Promise<User> {
        const response = await this.request<User>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        return response.data!;
    }

    // Message Methods
    async getMessages(conversationId?: string): Promise<unknown[]> {
        const endpoint = conversationId ? `/messages?conversationId=${conversationId}` : '/messages';
        const response = await this.request<unknown[]>(endpoint);
        return response.data!;
    }

    async sendMessage(recipientId: string, content: string): Promise<unknown> {
        const response = await this.request<unknown>('/messages', {
            method: 'POST',
            body: JSON.stringify({ recipientId, content }),
        });
        return response.data!;
    }

    // Notification Methods
    async getNotifications(): Promise<Notification[]> {
        const response = await this.request<Notification[]>('/notifications');
        return response.data!;
    }

    async markNotificationAsRead(id: string): Promise<void> {
        await this.request(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    }

    async markAllNotificationsAsRead(): Promise<void> {
        await this.request('/notifications/read-all', {
            method: 'PUT',
        });
    }

    // File Upload Methods
    async uploadFile(file: File, description?: string): Promise<unknown> {
        const formData = new FormData();
        formData.append('file', file);
        if (description) {
            formData.append('description', description);
        }

        const response = await this.request<unknown>('/files/upload', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
        return response.data!;
    }

    async getFile(id: string): Promise<Blob> {
        const response = await fetch(`${this.baseUrl}/files/${id}`, {
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        });

        if (!response.ok) {
            throw new ApiError('Failed to fetch file', response.status);
        }

        return response.blob();
    }

    async deleteFile(id: string): Promise<void> {
        await this.request(`/files/${id}`, {
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for use in other modules
export { ApiClient };
