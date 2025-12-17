import { PrismaClient, Quiz, Question } from '@prisma/client';
import { z } from 'zod';

export const createQuizSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    courseId: z.string().optional(),
    subject: z.string(),
    difficulty: z.string().default('Medium'),
    passingScore: z.number().min(0).max(100).default(60),
    timeLimit: z.number().optional(), // in seconds
    maxAttempts: z.number().default(1),
    xpReward: z.number().default(50),
    isActive: z.boolean().default(true),
});

export const updateQuizSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    subject: z.string().optional(),
    difficulty: z.string().optional(),
    passingScore: z.number().min(0).max(100).optional(),
    timeLimit: z.number().optional(),
    maxAttempts: z.number().optional(),
    xpReward: z.number().optional(),
    isActive: z.boolean().optional(),
});

export const createQuestionSchema = z.object({
    question: z.string().min(1),
    type: z.enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER']),
    points: z.number().min(1).default(1),
    explanation: z.string().optional(),
    options: z.array(z.string()).min(2),
    correctAnswer: z.string(),
});

export const submitQuizSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string(),
        answer: z.string(),
    })),
    timeTaken: z.number().optional(),
});

export interface QuizWithQuestions extends Quiz {
    questions: Question[];
}

export interface QuizSubmissionResult {
    score: number;
    percentage: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    xpEarned: number;
}

class QuizService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // ========================================
    // QUIZ MANAGEMENT
    // ========================================

    async createQuiz(data: z.infer<typeof createQuizSchema>): Promise<Quiz> {
        return this.prisma.quiz.create({
            data: {
                title: data.title,
                description: data.description,
                courseId: data.courseId,
                subject: data.subject,
                difficulty: data.difficulty,
                passingScore: data.passingScore,
                timeLimit: data.timeLimit,
                maxAttempts: data.maxAttempts,
                xpReward: data.xpReward,
                isActive: data.isActive,
            },
        });
    }

    async getQuiz(quizId: string): Promise<QuizWithQuestions | null> {
        return this.prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });
    }

    async getQuizzesByCourse(courseId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [quizzes, total] = await Promise.all([
            this.prisma.quiz.findMany({
                where: { courseId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    subject: true,
                    difficulty: true,
                    passingScore: true,
                    timeLimit: true,
                    maxAttempts: true,
                    xpReward: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: {
                            questions: true,
                            attempts: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.quiz.count({ where: { courseId } }),
        ]);

        return {
            quizzes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateQuiz(quizId: string, data: z.infer<typeof updateQuizSchema>): Promise<Quiz> {
        return this.prisma.quiz.update({
            where: { id: quizId },
            data,
        });
    }

    async deleteQuiz(quizId: string): Promise<void> {
        // Delete related data
        await this.prisma.quizAttempt.deleteMany({
            where: { quizId },
        });

        await this.prisma.question.deleteMany({
            where: { quizId },
        });

        await this.prisma.quiz.delete({
            where: { id: quizId },
        });
    }

    // ========================================
    // QUESTION MANAGEMENT
    // ========================================

    async addQuestion(quizId: string, data: z.infer<typeof createQuestionSchema>) {
        // Get max order
        const maxOrder = await this.prisma.question.aggregate({
            where: { quizId },
            _max: { order: true },
        });

        const order = (maxOrder._max.order || 0) + 1;

        return this.prisma.question.create({
            data: {
                quizId,
                question: data.question,
                type: data.type,
                points: data.points,
                explanation: data.explanation,
                options: data.options,
                correctAnswer: data.correctAnswer,
                order,
            },
        });
    }

    async updateQuestion(questionId: string, data: Partial<z.infer<typeof createQuestionSchema>>) {
        return this.prisma.question.update({
            where: { id: questionId },
            data: {
                ...(data.question && { question: data.question }),
                ...(data.type && { type: data.type }),
                ...(data.points && { points: data.points }),
                ...(data.explanation !== undefined && { explanation: data.explanation }),
                ...(data.options && { options: data.options }),
                ...(data.correctAnswer && { correctAnswer: data.correctAnswer }),
            },
        });
    }

    async deleteQuestion(questionId: string): Promise<void> {
        await this.prisma.question.delete({
            where: { id: questionId },
        });
    }

    async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
        for (let i = 0; i < questionIds.length; i++) {
            await this.prisma.question.update({
                where: { id: questionIds[i] },
                data: { order: i + 1 },
            });
        }
    }

    // ========================================
    // QUIZ SUBMISSION
    // ========================================

    async submitQuiz(
        quizId: string,
        studentId: string,
        data: z.infer<typeof submitQuizSchema>
    ): Promise<QuizSubmissionResult> {
        const quiz = await this.getQuiz(quizId);
        if (!quiz) {
            throw new Error('Quiz not found');
        }

        let score = 0;
        let correctAnswers = 0;
        const totalPoints = quiz.questions.reduce((sum: number, q: Question) => sum + q.points, 0);

        // Score answers
        for (const answer of data.answers) {
            const question = quiz.questions.find((q: Question) => q.id === answer.questionId);
            if (!question) continue;

            const isCorrect = this.checkAnswer(question, answer.answer);
            if (isCorrect) {
                score += question.points;
                correctAnswers++;
            }
        }

        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const passed = percentage >= quiz.passingScore;

        // Calculate XP earned
        let xpEarned = 0;
        if (passed) {
            xpEarned = Math.round((percentage / 100) * quiz.xpReward);
        }

        // Store submission
        await this.prisma.quizAttempt.create({
            data: {
                quizId,
                studentId,
                score,
                totalQuestions: quiz.questions.length,
                correctAnswers,
                percentage,
                timeTaken: data.timeTaken || 0,
                xpEarned,
                answers: data.answers,
            },
        });

        // Award XP if passed
        if (passed && xpEarned > 0) {
            await this.awardXP(studentId, xpEarned);
        }

        return {
            score,
            percentage,
            passed,
            correctAnswers,
            totalQuestions: quiz.questions.length,
            xpEarned,
        };
    }

    private checkAnswer(question: Question, answer: string): boolean {
        return question.correctAnswer.toLowerCase() === answer.toLowerCase();
    }

    private async awardXP(userId: string, xpAmount: number): Promise<void> {
        const gamer = await this.prisma.gamification.findUnique({
            where: { userId },
        });

        if (!gamer) {
            await this.prisma.gamification.create({
                data: {
                    userId,
                    xp: xpAmount,
                    points: xpAmount,
                },
            });
        } else {
            await this.prisma.gamification.update({
                where: { userId },
                data: {
                    xp: gamer.xp + xpAmount,
                    points: gamer.points + xpAmount,
                },
            });
        }
    }

    // ========================================
    // ANALYTICS
    // ========================================

    async getQuizAnalytics(quizId: string) {
        const submissions = await this.prisma.quizAttempt.findMany({
            where: { quizId },
            select: {
                score: true,
                percentage: true,
                correctAnswers: true,
                totalQuestions: true,
                xpEarned: true,
                startedAt: true,
                student: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        const totalSubmissions = submissions.length;
        const passedCount = submissions.filter((s: any) => s.percentage >= 60).length;
        const averageScore = submissions.length > 0 
            ? Math.round(submissions.reduce((sum: number, s: any) => sum + s.percentage, 0) / submissions.length)
            : 0;

        return {
            totalSubmissions,
            passed: passedCount,
            failed: totalSubmissions - passedCount,
            passRate: totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0,
            averageScore,
            submissions,
        };
    }

    async getStudentQuizAttempts(studentId: string, quizId: string) {
        return this.prisma.quizAttempt.findMany({
            where: {
                quizId,
                studentId,
            },
            orderBy: {
                startedAt: 'desc',
            },
        });
    }

    async getStudentQuizStats(studentId: string) {
        const submissions = await this.prisma.quizAttempt.findMany({
            where: { studentId },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        passingScore: true,
                        course: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const totalAttempts = submissions.length;
        const passedAttempts = submissions.filter((s: any) => s.percentage >= (s.quiz?.passingScore || 60)).length;
        const totalXpEarned = submissions.reduce((sum: number, s: any) => sum + s.xpEarned, 0);
        const averageScore = submissions.length > 0
            ? Math.round(submissions.reduce((sum: number, s: any) => sum + s.percentage, 0) / submissions.length)
            : 0;

        return {
            totalAttempts,
            passed: passedAttempts,
            failed: totalAttempts - passedAttempts,
            passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
            averageScore,
            totalXpEarned,
            submissions,
        };
    }
}

export default new QuizService();
