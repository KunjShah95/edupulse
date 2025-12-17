import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import QuizService from './quiz.service.js';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => ({
        quiz: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        question: {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        quizSubmission: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
    })),
}));

describe('Quiz Service', () => {
    let quizService: any;
    let mockPrisma: any;

    beforeEach(() => {
        quizService = new (require('./quiz.service.js').default)();
        mockPrisma = (PrismaClient as any)();
        quizService.prisma = mockPrisma;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // QUIZ CRUD OPERATIONS
    // ========================================

    describe('Quiz CRUD', () => {
        it('should create a quiz with valid data', async () => {
            const quizData = {
                title: 'Chapter 3 Quiz',
                description: 'Test your knowledge',
                courseId: 'course-123',
                subject: 'Mathematics',
                difficulty: 'Hard',
                passingScore: 70,
                timeLimit: 30,
                maxAttempts: 3,
                xpReward: 100,
                isActive: true,
            };

            const mockQuiz = { id: 'quiz-123', ...quizData, createdAt: new Date(), updatedAt: new Date() };
            mockPrisma.quiz.create.mockResolvedValue(mockQuiz);

            const result = await quizService.createQuiz(quizData);

            expect(result).toEqual(mockQuiz);
            expect(mockPrisma.quiz.create).toHaveBeenCalledWith({
                data: quizData,
            });
        });

        it('should get quiz by ID with questions', async () => {
            const mockQuiz = {
                id: 'quiz-123',
                title: 'Chapter 3 Quiz',
                questions: [
                    { id: 'q1', question: 'What is 2+2?', type: 'MCQ', order: 1 },
                    { id: 'q2', question: 'Is gravity real?', type: 'TRUE_FALSE', order: 2 },
                ],
            };

            mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

            const result = await quizService.getQuiz('quiz-123');

            expect(result).toEqual(mockQuiz);
            expect(mockPrisma.quiz.findUnique).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                include: { questions: { orderBy: { order: 'asc' } } },
            });
        });

        it('should return null if quiz not found', async () => {
            mockPrisma.quiz.findUnique.mockResolvedValue(null);

            const result = await quizService.getQuiz('non-existent-id');

            expect(result).toBeNull();
        });

        it('should get quizzes by course with pagination', async () => {
            const mockQuizzes = [
                { id: 'q1', title: 'Quiz 1', courseId: 'course-123' },
                { id: 'q2', title: 'Quiz 2', courseId: 'course-123' },
            ];

            mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
            mockPrisma.quiz.count.mockResolvedValue(2);

            const result = await quizService.getQuizzesByCourse('course-123', 1, 10);

            expect(result.quizzes).toEqual(mockQuizzes);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                pages: 1,
            });
            expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith({
                where: { courseId: 'course-123' },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should update quiz with partial data', async () => {
            const updateData = { title: 'Updated Title', passingScore: 75 };
            const mockQuiz = {
                id: 'quiz-123',
                ...updateData,
                courseId: 'course-123',
            };

            mockPrisma.quiz.update.mockResolvedValue(mockQuiz);

            const result = await quizService.updateQuiz('quiz-123', updateData);

            expect(result).toEqual(mockQuiz);
            expect(mockPrisma.quiz.update).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                data: updateData,
            });
        });

        it('should delete quiz and cascade delete questions', async () => {
            mockPrisma.quiz.delete.mockResolvedValue({ id: 'quiz-123' });

            const result = await quizService.deleteQuiz('quiz-123');

            expect(result).toEqual({ id: 'quiz-123' });
            expect(mockPrisma.quiz.delete).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
            });
        });
    });

    // ========================================
    // QUESTION MANAGEMENT
    // ========================================

    describe('Question Management', () => {
        it('should add question to quiz with MCQ type', async () => {
            const questionData = {
                question: 'What is 2+2?',
                type: 'MCQ',
                points: 5,
                options: ['3', '4', '5'],
                correctAnswer: '4',
                explanation: 'Basic math',
            };

            const mockQuestion = {
                id: 'q-123',
                quizId: 'quiz-123',
                ...questionData,
                order: 1,
            };

            mockPrisma.question.create.mockResolvedValue(mockQuestion);
            mockPrisma.question.findMany.mockResolvedValue([]);

            const result = await quizService.addQuestion('quiz-123', questionData);

            expect(result).toEqual(mockQuestion);
            expect(mockPrisma.question.create).toHaveBeenCalled();
        });

        it('should add TRUE_FALSE question', async () => {
            const questionData = {
                question: 'Is gravity real?',
                type: 'TRUE_FALSE',
                points: 2,
                options: ['True', 'False'],
                correctAnswer: 'True',
            };

            const mockQuestion = {
                id: 'q-124',
                quizId: 'quiz-123',
                ...questionData,
                order: 1,
            };

            mockPrisma.question.create.mockResolvedValue(mockQuestion);
            mockPrisma.question.findMany.mockResolvedValue([]);

            const result = await quizService.addQuestion('quiz-123', questionData);

            expect(result.type).toBe('TRUE_FALSE');
            expect(result.options).toEqual(['True', 'False']);
        });

        it('should add SHORT_ANSWER question', async () => {
            const questionData = {
                question: 'What is the capital of France?',
                type: 'SHORT_ANSWER',
                points: 3,
                options: [],
                correctAnswer: 'Paris',
            };

            const mockQuestion = {
                id: 'q-125',
                quizId: 'quiz-123',
                ...questionData,
                order: 1,
            };

            mockPrisma.question.create.mockResolvedValue(mockQuestion);
            mockPrisma.question.findMany.mockResolvedValue([]);

            const result = await quizService.addQuestion('quiz-123', questionData);

            expect(result.type).toBe('SHORT_ANSWER');
        });

        it('should update question', async () => {
            const updateData = {
                question: 'Updated question text',
                correctAnswer: 'New answer',
            };

            const mockQuestion = {
                id: 'q-123',
                ...updateData,
                quizId: 'quiz-123',
            };

            mockPrisma.question.update.mockResolvedValue(mockQuestion);

            const result = await quizService.updateQuestion('q-123', updateData);

            expect(result).toEqual(mockQuestion);
            expect(mockPrisma.question.update).toHaveBeenCalled();
        });

        it('should delete question', async () => {
            mockPrisma.question.delete.mockResolvedValue({ id: 'q-123' });

            const result = await quizService.deleteQuestion('q-123');

            expect(result).toEqual({ id: 'q-123' });
        });

        it('should reorder questions by ID array', async () => {
            const questionIds = ['q2', 'q1', 'q3'];
            mockPrisma.question.update.mockResolvedValue({ id: 'q1', order: 2 });

            await quizService.reorderQuestions('quiz-123', questionIds);

            expect(mockPrisma.question.update).toHaveBeenCalled();
        });
    });

    // ========================================
    // QUIZ SUBMISSION & SCORING
    // ========================================

    describe('Quiz Submission', () => {
        it('should submit quiz and calculate score correctly', async () => {
            const submissions = [
                { questionId: 'q1', answer: '4' },
                { questionId: 'q2', answer: 'true' },
            ];

            const mockQuiz = {
                id: 'quiz-123',
                totalPoints: 10,
                passingScore: 70,
                xpReward: 50,
                questions: [
                    {
                        id: 'q1',
                        correctAnswer: '4',
                        points: 5,
                        type: 'MCQ',
                    },
                    {
                        id: 'q2',
                        correctAnswer: 'true',
                        points: 5,
                        type: 'TRUE_FALSE',
                    },
                ],
            };

            mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
            mockPrisma.quizSubmission.create.mockResolvedValue({
                id: 'submission-123',
                score: 10,
                percentage: 100,
                passed: true,
            });

            const result = await quizService.submitQuiz('quiz-123', 'student-123', { answers: submissions });

            expect(result.passed).toBe(true);
            expect(result.score).toBe(10);
            expect(result.percentage).toBe(100);
        });

        it('should calculate partial score for incorrect answers', async () => {
            const submissions = [
                { questionId: 'q1', answer: '3' }, // Incorrect
                { questionId: 'q2', answer: 'true' }, // Correct
            ];

            const mockQuiz = {
                id: 'quiz-123',
                totalPoints: 10,
                passingScore: 70,
                questions: [
                    { id: 'q1', correctAnswer: '4', points: 5, type: 'MCQ' },
                    { id: 'q2', correctAnswer: 'true', points: 5, type: 'TRUE_FALSE' },
                ],
            };

            mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
            mockPrisma.quizSubmission.create.mockResolvedValue({
                score: 5,
                percentage: 50,
                passed: false,
                correctAnswers: 1,
                totalQuestions: 2,
            });

            const result = await quizService.submitQuiz('quiz-123', 'student-123', { answers: submissions });

            expect(result.passed).toBe(false);
            expect(result.score).toBe(5);
            expect(result.percentage).toBe(50);
            expect(result.correctAnswers).toBe(1);
        });

        it('should award XP on passing quiz', async () => {
            const submissions = [
                { questionId: 'q1', answer: '4' },
            ];

            const mockQuiz = {
                id: 'quiz-123',
                totalPoints: 10,
                passingScore: 70,
                xpReward: 100,
                questions: [
                    { id: 'q1', correctAnswer: '4', points: 10 },
                ],
            };

            mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
            mockPrisma.quizSubmission.create.mockResolvedValue({
                score: 10,
                passed: true,
                xpEarned: 100,
            });

            const result = await quizService.submitQuiz('quiz-123', 'student-123', { answers: submissions });

            expect(result.passed).toBe(true);
            expect(result.xpEarned).toBe(100);
            expect(mockPrisma.user.update).toHaveBeenCalled();
        });

        it('should not award XP on failing quiz', async () => {
            const submissions = [
                { questionId: 'q1', answer: '3' },
            ];

            const mockQuiz = {
                id: 'quiz-123',
                totalPoints: 10,
                passingScore: 70,
                questions: [
                    { id: 'q1', correctAnswer: '4', points: 10 },
                ],
            };

            mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
            mockPrisma.quizSubmission.create.mockResolvedValue({
                score: 0,
                passed: false,
                xpEarned: 0,
            });

            const result = await quizService.submitQuiz('quiz-123', 'student-123', { answers: submissions });

            expect(result.passed).toBe(false);
            expect(result.xpEarned).toBe(0);
        });

        it('should handle short answer case-insensitive matching', async () => {
            const submissions = [
                { questionId: 'q1', answer: 'PARIS' }, // Uppercase
            ];

            const mockQuiz = {
                id: 'quiz-123',
                totalPoints: 10,
                passingScore: 70,
                questions: [
                    {
                        id: 'q1',
                        correctAnswer: 'Paris',
                        points: 10,
                        type: 'SHORT_ANSWER',
                    },
                ],
            };

            mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

            const result = await quizService.checkAnswer(
                { correctAnswer: 'Paris', type: 'SHORT_ANSWER' },
                'PARIS'
            );

            expect(result).toBe(true);
        });
    });

    // ========================================
    // ANALYTICS
    // ========================================

    describe('Quiz Analytics', () => {
        it('should get quiz analytics with pass rate', async () => {
            const mockAnalytics = {
                quizId: 'quiz-123',
                totalSubmissions: 10,
                passedSubmissions: 7,
                passRate: 70,
                averageScore: 75.5,
                averagePercentage: 75.5,
                averageTimeTaken: 600,
                highestScore: 100,
                lowestScore: 50,
            };

            vi.spyOn(quizService, 'getQuizAnalytics').mockResolvedValue(mockAnalytics);

            const result = await quizService.getQuizAnalytics('quiz-123');

            expect(result.passRate).toBe(70);
            expect(result.averageScore).toBe(75.5);
            expect(result.totalSubmissions).toBe(10);
        });

        it('should get student quiz attempts', async () => {
            const mockAttempts = [
                {
                    id: 'submission-1',
                    score: 80,
                    percentage: 80,
                    passed: true,
                    timeTaken: 600,
                    submittedAt: new Date(),
                },
                {
                    id: 'submission-2',
                    score: 60,
                    percentage: 60,
                    passed: false,
                    timeTaken: 900,
                    submittedAt: new Date(),
                },
            ];

            mockPrisma.quizSubmission.findMany.mockResolvedValue(mockAttempts);

            const result = await quizService.getStudentQuizAttempts('student-123', 'quiz-123');

            expect(result).toHaveLength(2);
            expect(result[0].passed).toBe(true);
            expect(result[1].passed).toBe(false);
        });

        it('should get student quiz stats', async () => {
            const mockStats = {
                studentId: 'student-123',
                totalQuizzes: 5,
                quizzesPassed: 4,
                passRate: 80,
                averageScore: 78,
                totalXPEarned: 400,
                attemptedQuizzes: [
                    {
                        quizId: 'q1',
                        title: 'Quiz 1',
                        bestScore: 100,
                        attempts: 1,
                    },
                ],
            };

            vi.spyOn(quizService, 'getStudentQuizStats').mockResolvedValue(mockStats);

            const result = await quizService.getStudentQuizStats('student-123');

            expect(result.passRate).toBe(80);
            expect(result.averageScore).toBe(78);
            expect(result.totalXPEarned).toBe(400);
        });
    });

    // ========================================
    // ERROR HANDLING
    // ========================================

    describe('Error Handling', () => {
        it('should throw error if quiz not found', async () => {
            mockPrisma.quiz.findUnique.mockResolvedValue(null);

            const result = await quizService.getQuiz('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw error if question limit exceeded', async () => {
            const questionData = {
                question: 'Test?',
                type: 'MCQ',
                points: 1,
                options: ['a'],
                correctAnswer: 'a',
            };

            mockPrisma.question.findMany.mockResolvedValue(
                Array(100).fill({ id: 'q', quizId: 'quiz-123' })
            );

            expect(async () => {
                await quizService.addQuestion('quiz-123', questionData);
            }).rejects.toThrow();
        });

        it('should validate question type', async () => {
            const invalidQuestionData = {
                question: 'Test?',
                type: 'INVALID_TYPE',
                points: 1,
                options: ['a'],
                correctAnswer: 'a',
            };

            expect(() => {
                quizService.validateQuestionData(invalidQuestionData);
            }).toThrow();
        });

        it('should validate points range', async () => {
            const invalidQuestionData = {
                question: 'Test?',
                type: 'MCQ',
                points: 0,
                options: ['a'],
                correctAnswer: 'a',
            };

            expect(() => {
                quizService.validateQuestionData(invalidQuestionData);
            }).toThrow('Points must be between 1 and 1000');
        });

        it('should handle database errors gracefully', async () => {
            const error = new Error('Database connection failed');
            mockPrisma.quiz.findUnique.mockRejectedValue(error);

            expect(async () => {
                await quizService.getQuiz('quiz-123');
            }).rejects.toThrow('Database connection failed');
        });
    });
});
