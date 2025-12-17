import { PrismaClient, UserRole, BadgeRarity, GradeType, AttendanceStatus, EventType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data
    await prisma.$transaction([
        prisma.auditLog.deleteMany(),
        prisma.notification.deleteMany(),
        prisma.message.deleteMany(),
        prisma.conversation.deleteMany(),
        prisma.bookReservation.deleteMany(),
        prisma.bookLoan.deleteMany(),
        prisma.book.deleteMany(),
        prisma.achievement.deleteMany(),
        prisma.badge.deleteMany(),
        prisma.gamification.deleteMany(),
        prisma.quizAttempt.deleteMany(),
        prisma.question.deleteMany(),
        prisma.quiz.deleteMany(),
        prisma.grade.deleteMany(),
        prisma.attendance.deleteMany(),
        prisma.schedule.deleteMany(),
        prisma.enrollment.deleteMany(),
        prisma.lesson.deleteMany(),
        prisma.course.deleteMany(),
        prisma.parentStudent.deleteMany(),
        prisma.parent.deleteMany(),
        prisma.admin.deleteMany(),
        prisma.teacher.deleteMany(),
        prisma.student.deleteMany(),
        prisma.refreshToken.deleteMany(),
        prisma.user.deleteMany(),
        prisma.event.deleteMany(),
        prisma.systemSetting.deleteMany(),
    ]);

    console.log('✅ Cleared existing data');

    // Hash password for all users
    const password = await argon2.hash('Password123!', {
        type: argon2.argon2id,
    });

    // ========================================
    // CREATE ADMIN
    // ========================================

    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@edupulse.com',
            password,
            firstName: 'System',
            lastName: 'Admin',
            role: UserRole.ADMIN,
            status: 'ACTIVE',
            emailVerified: true,
            admin: {
                create: {
                    adminCode: 'ADM001',
                    department: 'Administration',
                    accessLevel: 5,
                },
            },
            gamification: {
                create: {
                    points: 1000,
                    xp: 500,
                    level: 5,
                    xpToNextLevel: 250,
                    streak: 30,
                    longestStreak: 30,
                },
            },
        },
    });

    console.log('✅ Created admin user');

    // ========================================
    // CREATE TEACHERS
    // ========================================

    const teachers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'john.smith@edupulse.com',
                password,
                firstName: 'John',
                lastName: 'Smith',
                role: UserRole.TEACHER,
                status: 'ACTIVE',
                emailVerified: true,
                phone: '+1-555-0101',
                teacher: {
                    create: {
                        employeeId: 'TCH001',
                        department: 'Mathematics',
                        subjects: ['Algebra', 'Calculus', 'Geometry'],
                        qualification: 'M.Sc. Mathematics',
                    },
                },
                gamification: {
                    create: {
                        points: 500,
                        xp: 200,
                        level: 3,
                        xpToNextLevel: 150,
                    },
                },
            },
            include: { teacher: true },
        }),
        prisma.user.create({
            data: {
                email: 'sarah.johnson@edupulse.com',
                password,
                firstName: 'Sarah',
                lastName: 'Johnson',
                role: UserRole.TEACHER,
                status: 'ACTIVE',
                emailVerified: true,
                phone: '+1-555-0102',
                teacher: {
                    create: {
                        employeeId: 'TCH002',
                        department: 'Science',
                        subjects: ['Physics', 'Chemistry'],
                        qualification: 'Ph.D. Physics',
                    },
                },
                gamification: {
                    create: {
                        points: 600,
                        xp: 250,
                        level: 3,
                        xpToNextLevel: 100,
                    },
                },
            },
            include: { teacher: true },
        }),
        prisma.user.create({
            data: {
                email: 'michael.brown@edupulse.com',
                password,
                firstName: 'Michael',
                lastName: 'Brown',
                role: UserRole.TEACHER,
                status: 'ACTIVE',
                emailVerified: true,
                phone: '+1-555-0103',
                teacher: {
                    create: {
                        employeeId: 'TCH003',
                        department: 'Languages',
                        subjects: ['English Literature', 'Creative Writing'],
                        qualification: 'M.A. English Literature',
                    },
                },
                gamification: {
                    create: {
                        points: 450,
                        xp: 180,
                        level: 2,
                        xpToNextLevel: 170,
                    },
                },
            },
            include: { teacher: true },
        }),
    ]);

    console.log('✅ Created 3 teachers');

    // ========================================
    // CREATE STUDENTS
    // ========================================

    const students = await Promise.all([
        prisma.user.create({
            data: {
                email: 'alice.wilson@student.edupulse.com',
                password,
                firstName: 'Alice',
                lastName: 'Wilson',
                role: UserRole.STUDENT,
                status: 'ACTIVE',
                emailVerified: true,
                student: {
                    create: {
                        rollNumber: 'STU10001',
                        gradeLevel: '10th',
                        section: 'A',
                        stream: 'Science',
                    },
                },
                gamification: {
                    create: {
                        points: 850,
                        xp: 420,
                        level: 4,
                        xpToNextLevel: 80,
                        streak: 15,
                        longestStreak: 20,
                        badges: {
                            create: [
                                {
                                    name: 'Welcome Explorer',
                                    description: 'Joined EduPulse!',
                                    icon: '🎉',
                                    rarity: BadgeRarity.COMMON,
                                },
                                {
                                    name: 'Quiz Master',
                                    description: 'Completed 10 quizzes',
                                    icon: '🏆',
                                    rarity: BadgeRarity.RARE,
                                },
                            ],
                        },
                    },
                },
            },
            include: { student: true },
        }),
        prisma.user.create({
            data: {
                email: 'bob.martin@student.edupulse.com',
                password,
                firstName: 'Bob',
                lastName: 'Martin',
                role: UserRole.STUDENT,
                status: 'ACTIVE',
                emailVerified: true,
                student: {
                    create: {
                        rollNumber: 'STU10002',
                        gradeLevel: '10th',
                        section: 'A',
                        stream: 'Science',
                    },
                },
                gamification: {
                    create: {
                        points: 720,
                        xp: 350,
                        level: 3,
                        xpToNextLevel: 150,
                        streak: 8,
                        longestStreak: 12,
                        badges: {
                            create: [
                                {
                                    name: 'Welcome Explorer',
                                    description: 'Joined EduPulse!',
                                    icon: '🎉',
                                    rarity: BadgeRarity.COMMON,
                                },
                            ],
                        },
                    },
                },
            },
            include: { student: true },
        }),
        prisma.user.create({
            data: {
                email: 'charlie.davis@student.edupulse.com',
                password,
                firstName: 'Charlie',
                lastName: 'Davis',
                role: UserRole.STUDENT,
                status: 'ACTIVE',
                emailVerified: true,
                student: {
                    create: {
                        rollNumber: 'STU10003',
                        gradeLevel: '10th',
                        section: 'B',
                        stream: 'Commerce',
                    },
                },
                gamification: {
                    create: {
                        points: 580,
                        xp: 280,
                        level: 3,
                        xpToNextLevel: 220,
                        streak: 5,
                        longestStreak: 10,
                    },
                },
            },
            include: { student: true },
        }),
        prisma.user.create({
            data: {
                email: 'diana.taylor@student.edupulse.com',
                password,
                firstName: 'Diana',
                lastName: 'Taylor',
                role: UserRole.STUDENT,
                status: 'ACTIVE',
                emailVerified: true,
                student: {
                    create: {
                        rollNumber: 'STU11001',
                        gradeLevel: '11th',
                        section: 'A',
                        stream: 'Science',
                    },
                },
                gamification: {
                    create: {
                        points: 950,
                        xp: 500,
                        level: 5,
                        xpToNextLevel: 50,
                        streak: 25,
                        longestStreak: 25,
                        badges: {
                            create: [
                                {
                                    name: 'Welcome Explorer',
                                    description: 'Joined EduPulse!',
                                    icon: '🎉',
                                    rarity: BadgeRarity.COMMON,
                                },
                                {
                                    name: 'Quiz Master',
                                    description: 'Completed 10 quizzes',
                                    icon: '🏆',
                                    rarity: BadgeRarity.RARE,
                                },
                                {
                                    name: 'Streak Champion',
                                    description: 'Maintained a 25-day streak',
                                    icon: '🔥',
                                    rarity: BadgeRarity.EPIC,
                                },
                            ],
                        },
                    },
                },
            },
            include: { student: true },
        }),
        prisma.user.create({
            data: {
                email: 'evan.clark@student.edupulse.com',
                password,
                firstName: 'Evan',
                lastName: 'Clark',
                role: UserRole.STUDENT,
                status: 'ACTIVE',
                emailVerified: true,
                student: {
                    create: {
                        rollNumber: 'STU11002',
                        gradeLevel: '11th',
                        section: 'B',
                        stream: 'Arts',
                    },
                },
                gamification: {
                    create: {
                        points: 320,
                        xp: 150,
                        level: 2,
                        xpToNextLevel: 200,
                    },
                },
            },
            include: { student: true },
        }),
    ]);

    console.log('✅ Created 5 students');

    // ========================================
    // CREATE PARENT
    // ========================================

    const parentUser = await prisma.user.create({
        data: {
            email: 'parent.wilson@edupulse.com',
            password,
            firstName: 'Robert',
            lastName: 'Wilson',
            role: UserRole.PARENT,
            status: 'ACTIVE',
            emailVerified: true,
            phone: '+1-555-0201',
            parent: {
                create: {
                    occupation: 'Engineer',
                    relationship: 'Father',
                    children: {
                        create: {
                            studentId: students[0].student!.id, // Alice Wilson
                        },
                    },
                },
            },
            gamification: {
                create: {
                    points: 100,
                    xp: 50,
                    level: 1,
                    xpToNextLevel: 100,
                },
            },
        },
    });

    console.log('✅ Created parent user');

    // ========================================
    // CREATE COURSES
    // ========================================

    const courses = await Promise.all([
        prisma.course.create({
            data: {
                code: 'MATH101',
                name: 'Algebra Fundamentals',
                description: 'Introduction to algebraic concepts and problem-solving',
                subject: 'Mathematics',
                gradeLevel: '10th',
                credits: 4,
                teacherId: teachers[0].teacher!.id,
                isActive: true,
                schedules: {
                    create: [
                        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'Room 101' },
                        { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', room: 'Room 101' },
                        { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', room: 'Room 101' },
                    ],
                },
                lessons: {
                    create: [
                        { title: 'Introduction to Variables', order: 1, content: 'Learn about variables and expressions', isPublished: true },
                        { title: 'Solving Linear Equations', order: 2, content: 'Techniques for solving linear equations', isPublished: true },
                        { title: 'Quadratic Equations', order: 3, content: 'Understanding and solving quadratic equations', isPublished: false },
                    ],
                },
            },
        }),
        prisma.course.create({
            data: {
                code: 'PHY101',
                name: 'Physics Fundamentals',
                description: 'Introduction to physics principles and experiments',
                subject: 'Physics',
                gradeLevel: '10th',
                credits: 4,
                teacherId: teachers[1].teacher!.id,
                isActive: true,
                schedules: {
                    create: [
                        { dayOfWeek: 2, startTime: '10:00', endTime: '11:00', room: 'Lab 201' },
                        { dayOfWeek: 4, startTime: '10:00', endTime: '11:00', room: 'Lab 201' },
                    ],
                },
                lessons: {
                    create: [
                        { title: 'Motion and Forces', order: 1, content: 'Understanding motion and Newtons laws', isPublished: true },
                        { title: 'Energy and Work', order: 2, content: 'Concepts of energy, work, and power', isPublished: true },
                    ],
                },
            },
        }),
        prisma.course.create({
            data: {
                code: 'ENG101',
                name: 'English Literature',
                description: 'Exploring classic and modern literature',
                subject: 'English',
                gradeLevel: '10th',
                credits: 3,
                teacherId: teachers[2].teacher!.id,
                isActive: true,
                schedules: {
                    create: [
                        { dayOfWeek: 1, startTime: '11:00', endTime: '12:00', room: 'Room 301' },
                        { dayOfWeek: 4, startTime: '11:00', endTime: '12:00', room: 'Room 301' },
                    ],
                },
                lessons: {
                    create: [
                        { title: 'Introduction to Shakespeare', order: 1, content: 'Life and works of William Shakespeare', isPublished: true },
                        { title: 'Poetry Analysis', order: 2, content: 'Techniques for analyzing poetry', isPublished: true },
                    ],
                },
            },
        }),
    ]);

    console.log('✅ Created 3 courses');

    // ========================================
    // CREATE ENROLLMENTS
    // ========================================

    await prisma.enrollment.createMany({
        data: [
            // Alice in all courses
            { studentId: students[0].student!.id, courseId: courses[0].id, progress: 75 },
            { studentId: students[0].student!.id, courseId: courses[1].id, progress: 60 },
            { studentId: students[0].student!.id, courseId: courses[2].id, progress: 85 },
            // Bob in Math and Physics
            { studentId: students[1].student!.id, courseId: courses[0].id, progress: 50 },
            { studentId: students[1].student!.id, courseId: courses[1].id, progress: 45 },
            // Charlie in English
            { studentId: students[2].student!.id, courseId: courses[2].id, progress: 30 },
        ],
    });

    console.log('✅ Created enrollments');

    // ========================================
    // CREATE GRADES
    // ========================================

    await prisma.grade.createMany({
        data: [
            // Alice's grades
            { studentId: students[0].student!.id, courseId: courses[0].id, type: GradeType.ASSIGNMENT, title: 'Assignment 1', score: 45, maxScore: 50, percentage: 90, weight: 1 },
            { studentId: students[0].student!.id, courseId: courses[0].id, type: GradeType.QUIZ, title: 'Chapter 1 Quiz', score: 18, maxScore: 20, percentage: 90, weight: 0.5 },
            { studentId: students[0].student!.id, courseId: courses[1].id, type: GradeType.MIDTERM, title: 'Midterm Exam', score: 78, maxScore: 100, percentage: 78, weight: 2 },
            // Bob's grades
            { studentId: students[1].student!.id, courseId: courses[0].id, type: GradeType.ASSIGNMENT, title: 'Assignment 1', score: 38, maxScore: 50, percentage: 76, weight: 1 },
            { studentId: students[1].student!.id, courseId: courses[0].id, type: GradeType.QUIZ, title: 'Chapter 1 Quiz', score: 15, maxScore: 20, percentage: 75, weight: 0.5 },
        ],
    });

    console.log('✅ Created grades');

    // ========================================
    // CREATE ATTENDANCE
    // ========================================

    const today = new Date();
    const attendanceDates = Array.from({ length: 10 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        return date;
    });

    await prisma.attendance.createMany({
        data: attendanceDates.flatMap(date => [
            { studentId: students[0].student!.id, courseId: courses[0].id, date, status: AttendanceStatus.PRESENT },
            { studentId: students[1].student!.id, courseId: courses[0].id, date, status: Math.random() > 0.2 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT },
        ]),
    });

    console.log('✅ Created attendance records');

    // ========================================
    // CREATE QUIZZES
    // ========================================

    const quiz = await prisma.quiz.create({
        data: {
            courseId: courses[0].id,
            title: 'Algebra Basics Quiz',
            description: 'Test your knowledge of basic algebra concepts',
            subject: 'Mathematics',
            difficulty: 'Medium',
            timeLimit: 600, // 10 minutes
            passingScore: 60,
            xpReward: 100,
            isActive: true,
            questions: {
                create: [
                    {
                        question: 'What is the value of x in the equation 2x + 5 = 15?',
                        type: 'MCQ',
                        options: ['3', '5', '7', '10'],
                        correctAnswer: '5',
                        points: 10,
                        order: 1,
                        explanation: '2x + 5 = 15, 2x = 10, x = 5',
                    },
                    {
                        question: 'Simplify: 3(x + 2) - 2x',
                        type: 'MCQ',
                        options: ['x + 6', '5x + 6', 'x + 2', '5x + 2'],
                        correctAnswer: 'x + 6',
                        points: 10,
                        order: 2,
                        explanation: '3x + 6 - 2x = x + 6',
                    },
                    {
                        question: 'Is (x + y)² = x² + y² true?',
                        type: 'TRUE_FALSE',
                        options: ['True', 'False'],
                        correctAnswer: 'False',
                        points: 5,
                        order: 3,
                        explanation: '(x + y)² = x² + 2xy + y², not x² + y²',
                    },
                ],
            },
        },
    });

    console.log('✅ Created quiz');

    // ========================================
    // CREATE BOOKS
    // ========================================

    await prisma.book.createMany({
        data: [
            {
                isbn: '978-0-13-468599-1',
                title: 'Introduction to Algorithms',
                author: 'Thomas H. Cormen',
                publisher: 'MIT Press',
                publishYear: 2022,
                category: 'Computer Science',
                totalCopies: 5,
                availableCopies: 3,
                location: 'Shelf A-1',
            },
            {
                isbn: '978-0-07-352332-3',
                title: 'Calculus: Early Transcendentals',
                author: 'James Stewart',
                publisher: 'Cengage Learning',
                publishYear: 2020,
                category: 'Mathematics',
                totalCopies: 8,
                availableCopies: 6,
                location: 'Shelf B-2',
            },
            {
                isbn: '978-0-14-028329-7',
                title: 'The Great Gatsby',
                author: 'F. Scott Fitzgerald',
                publisher: 'Penguin Classics',
                publishYear: 2018,
                category: 'Literature',
                totalCopies: 10,
                availableCopies: 8,
                location: 'Shelf C-3',
            },
            {
                isbn: '978-0-321-12521-7',
                title: 'Physics for Scientists and Engineers',
                author: 'Raymond A. Serway',
                publisher: 'Cengage Learning',
                publishYear: 2021,
                category: 'Physics',
                totalCopies: 6,
                availableCopies: 4,
                location: 'Shelf D-4',
            },
        ],
    });

    console.log('✅ Created books');

    // ========================================
    // CREATE EVENTS
    // ========================================

    await prisma.event.createMany({
        data: [
            {
                title: 'Mid-Term Examinations',
                description: 'Mid-term examinations for all grades',
                type: EventType.EXAM,
                startDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
                endDate: new Date(today.getFullYear(), today.getMonth() + 1, 20),
                isPublic: true,
                createdBy: adminUser.id,
                targetRoles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT],
                color: '#ef4444',
            },
            {
                title: 'Parent-Teacher Meeting',
                description: 'Quarterly parent-teacher meeting',
                type: EventType.MEETING,
                startDate: new Date(today.getFullYear(), today.getMonth() + 1, 25, 14, 0),
                endDate: new Date(today.getFullYear(), today.getMonth() + 1, 25, 17, 0),
                isPublic: true,
                createdBy: adminUser.id,
                targetRoles: [UserRole.TEACHER, UserRole.PARENT],
                color: '#3b82f6',
            },
            {
                title: 'Winter Break',
                description: 'School closed for winter holidays',
                type: EventType.HOLIDAY,
                startDate: new Date(today.getFullYear(), 11, 23),
                endDate: new Date(today.getFullYear() + 1, 0, 2),
                allDay: true,
                isPublic: true,
                createdBy: adminUser.id,
                targetRoles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT],
                color: '#22c55e',
            },
        ],
    });

    console.log('✅ Created events');

    // ========================================
    // CREATE SYSTEM SETTINGS
    // ========================================

    await prisma.systemSetting.createMany({
        data: [
            { key: 'school_name', value: 'EduPulse Academy', category: 'general' },
            { key: 'school_email', value: 'info@edupulse.com', category: 'general' },
            { key: 'academic_year', value: '2024-2025', category: 'academic' },
            { key: 'grading_scale', value: 'percentage', category: 'academic' },
            { key: 'attendance_threshold', value: '75', category: 'academic' },
            { key: 'max_book_loans', value: '3', category: 'library' },
            { key: 'loan_duration_days', value: '14', category: 'library' },
            { key: 'fine_per_day', value: '1.00', category: 'library' },
        ],
    });

    console.log('✅ Created system settings');

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('   Admin:   admin@edupulse.com / Password123!');
    console.log('   Teacher: john.smith@edupulse.com / Password123!');
    console.log('   Student: alice.wilson@student.edupulse.com / Password123!');
    console.log('   Parent:  parent.wilson@edupulse.com / Password123!');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
