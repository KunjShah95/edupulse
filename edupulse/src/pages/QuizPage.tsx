import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Clock, Star, CheckCircle, XCircle, Flame, Target, Award, ChevronRight, Play, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface Quiz {
    id: string;
    title: string;
    subject: string;
    description: string;
    questions: Question[];
    timeLimit: number;
    xpReward: number;
    difficulty: 'easy' | 'medium' | 'hard';
    icon: string;
    color: string;
    locked: boolean;
    requiredLevel: number;
}

const quizzes: Quiz[] = [
    {
        id: 'math-basics',
        title: 'Math Fundamentals',
        subject: 'Mathematics',
        description: 'Test your basic arithmetic and algebra skills',
        timeLimit: 300,
        xpReward: 150,
        difficulty: 'easy',
        icon: '📐',
        color: 'emerald',
        locked: false,
        requiredLevel: 1,
        questions: [
            { id: '1', question: 'What is 15 × 8?', options: ['120', '115', '125', '110'], correctAnswer: 0, points: 10, difficulty: 'easy' },
            { id: '2', question: 'Solve: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7', 'x = 3'], correctAnswer: 0, points: 15, difficulty: 'medium' },
            { id: '3', question: 'What is √144?', options: ['14', '12', '11', '13'], correctAnswer: 1, points: 10, difficulty: 'easy' },
            { id: '4', question: 'What is 25% of 200?', options: ['25', '50', '75', '100'], correctAnswer: 1, points: 10, difficulty: 'easy' },
            { id: '5', question: 'Solve: 3² + 4²', options: ['25', '12', '7', '49'], correctAnswer: 0, points: 15, difficulty: 'medium' },
        ]
    },
    {
        id: 'science-world',
        title: 'Science Explorer',
        subject: 'Science',
        description: 'Discover the wonders of physics and chemistry',
        timeLimit: 360,
        xpReward: 200,
        difficulty: 'medium',
        icon: '🔬',
        color: 'zinc',
        locked: false,
        requiredLevel: 1,
        questions: [
            { id: '1', question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctAnswer: 0, points: 10, difficulty: 'easy' },
            { id: '2', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 1, points: 10, difficulty: 'easy' },
            { id: '3', question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correctAnswer: 0, points: 20, difficulty: 'hard' },
            { id: '4', question: 'What gas do plants absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 2, points: 10, difficulty: 'easy' },
            { id: '5', question: 'What is the atomic number of Carbon?', options: ['8', '6', '12', '14'], correctAnswer: 1, points: 15, difficulty: 'medium' },
        ]
    },
    {
        id: 'history-quest',
        title: 'History Quest',
        subject: 'History',
        description: 'Journey through time and test your knowledge',
        timeLimit: 300,
        xpReward: 175,
        difficulty: 'medium',
        icon: '🏛️',
        color: 'amber',
        locked: false,
        requiredLevel: 2,
        questions: [
            { id: '1', question: 'In which year did World War II end?', options: ['1944', '1945', '1946', '1943'], correctAnswer: 1, points: 10, difficulty: 'easy' },
            { id: '2', question: 'Who was the first President of the USA?', options: ['Lincoln', 'Jefferson', 'Washington', 'Adams'], correctAnswer: 2, points: 10, difficulty: 'easy' },
            { id: '3', question: 'The Great Wall of China was built primarily to defend against?', options: ['Japanese', 'Mongols', 'Russians', 'Indians'], correctAnswer: 1, points: 15, difficulty: 'medium' },
            { id: '4', question: 'Which empire was ruled by Julius Caesar?', options: ['Greek', 'Roman', 'Persian', 'Ottoman'], correctAnswer: 1, points: 10, difficulty: 'easy' },
            { id: '5', question: 'In which year did the French Revolution begin?', options: ['1789', '1776', '1799', '1815'], correctAnswer: 0, points: 15, difficulty: 'medium' },
        ]
    },
    {
        id: 'english-master',
        title: 'Language Master',
        subject: 'English',
        description: 'Master grammar, vocabulary and comprehension',
        timeLimit: 240,
        xpReward: 250,
        difficulty: 'hard',
        icon: '📚',
        color: 'zinc',
        locked: true,
        requiredLevel: 3,
        questions: [
            { id: '1', question: 'Choose the correct form: "She ___ to school every day."', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1, points: 10, difficulty: 'easy' },
            { id: '2', question: 'What is the antonym of "benevolent"?', options: ['Kind', 'Malevolent', 'Generous', 'Caring'], correctAnswer: 1, points: 20, difficulty: 'hard' },
            { id: '3', question: 'Identify the noun: "The quick brown fox jumps."', options: ['quick', 'brown', 'fox', 'jumps'], correctAnswer: 2, points: 10, difficulty: 'easy' },
            { id: '4', question: 'What literary device is "The wind whispered"?', options: ['Simile', 'Metaphor', 'Personification', 'Alliteration'], correctAnswer: 2, points: 15, difficulty: 'medium' },
            { id: '5', question: 'What is the past participle of "write"?', options: ['Wrote', 'Written', 'Writing', 'Writes'], correctAnswer: 1, points: 10, difficulty: 'easy' },
        ]
    }
];

const QuizPage = () => {
    const { user, addQuizResult, addBadge, addPoints } = useAuth();
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startQuiz = (quiz: Quiz) => {
        if (quiz.locked && user && user.level < quiz.requiredLevel) return;
        setSelectedQuiz(quiz);
        setGameState('playing');
        setCurrentQuestion(0);
        setScore(0);
        setCorrectAnswers(0);
        setTimeLeft(quiz.timeLimit);
        setCombo(0);
        setMaxCombo(0);
        setSelectedAnswer(null);
        setShowAnswer(false);
    };

    useEffect(() => {
        if (gameState !== 'playing' || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState('result');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const handleAnswer = useCallback((answerIndex: number) => {
        if (showAnswer || !selectedQuiz) return;
        setSelectedAnswer(answerIndex);
        setShowAnswer(true);

        const question = selectedQuiz.questions[currentQuestion];
        const isCorrect = answerIndex === question.correctAnswer;

        if (isCorrect) {
            const comboBonus = Math.floor(combo * 5);
            const earnedPoints = question.points + comboBonus;
            setScore(prev => prev + earnedPoints);
            setCorrectAnswers(prev => prev + 1);
            setCombo(prev => {
                const newCombo = prev + 1;
                if (newCombo > maxCombo) setMaxCombo(newCombo);
                return newCombo;
            });
        } else {
            setCombo(0);
        }

        setTimeout(() => {
            if (currentQuestion < selectedQuiz.questions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedAnswer(null);
                setShowAnswer(false);
            } else {
                finishQuiz();
            }
        }, 1500);
    }, [showAnswer, selectedQuiz, currentQuestion, combo, maxCombo]);

    const finishQuiz = () => {
        if (!selectedQuiz || !user) return;

        const timeTaken = selectedQuiz.timeLimit - timeLeft;
        const xpEarned = Math.floor(score * 1.5) + (correctAnswers === selectedQuiz.questions.length ? 50 : 0);

        addQuizResult({
            quizId: selectedQuiz.id,
            quizTitle: selectedQuiz.title,
            subject: selectedQuiz.subject,
            score,
            totalQuestions: selectedQuiz.questions.length,
            correctAnswers,
            xpEarned,
            completedAt: new Date().toISOString(),
            timeTaken
        });

        if (correctAnswers === selectedQuiz.questions.length) {
            addBadge({ id: `perfect-${selectedQuiz.id}`, name: 'Perfect Score!', description: `Aced ${selectedQuiz.title}`, icon: '🏆', rarity: 'rare' });
        }
        if (maxCombo >= 3) {
            addBadge({ id: 'combo-master', name: 'Combo Master', description: 'Got 3+ answers in a row', icon: '🔥', rarity: 'common' });
        }
        if (user.quizHistory.length === 0) {
            addBadge({ id: 'first-quiz', name: 'Quiz Starter', description: 'Completed your first quiz', icon: '🎯', rarity: 'common' });
            addPoints(25, 'First quiz bonus');
        }

        setGameState('result');
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'easy': return 'text-emerald-400 bg-emerald-500/10';
            case 'medium': return 'text-amber-400 bg-amber-500/10';
            case 'hard': return 'text-red-400 bg-red-500/10';
            default: return 'text-zinc-400 bg-zinc-500/10';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-center p-8">
                    <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
                    <p className="text-zinc-400">Please login to access quizzes and earn rewards!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {gameState === 'menu' && (
                    <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* User Stats Bar */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                                        {user.level}
                                    </div>
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-semibold">{user.firstName} {user.lastName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-32 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${((user.xp % 100) / 100) * 100}%` }} className="h-full bg-emerald-500" />
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-zinc-500">{user.xpToNextLevel} XP to next level</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400"><Star className="w-5 h-5" /><span className="font-bold text-lg">{user.points}</span></div>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500">Points</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400"><Flame className="w-5 h-5" /><span className="font-bold text-lg">{user.streak}</span></div>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500">Streak</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400"><Award className="w-5 h-5" /><span className="font-bold text-lg">{user.badges.length}</span></div>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500">Badges</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quiz Grid */}
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />Available Quizzes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizzes.map((quiz) => {
                                const isLocked = quiz.locked && user.level < quiz.requiredLevel;
                                return (
                                    <motion.div
                                        key={quiz.id}
                                        whileHover={!isLocked ? { y: -2 } : {}}
                                        onClick={() => !isLocked && startQuiz(quiz)}
                                        className={`relative overflow-hidden rounded-xl border transition-all shadow-sm ${isLocked ? 'opacity-60 cursor-not-allowed border-zinc-200 dark:border-zinc-800' : 'cursor-pointer border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md'} bg-white dark:bg-zinc-900`}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="text-4xl">{quiz.icon}</div>
                                                {isLocked && <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"><Lock className="w-5 h-5 text-zinc-500" /></div>}
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{quiz.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-zinc-500 mb-3">{quiz.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>{quiz.difficulty}</span>
                                                <span className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800">{quiz.questions.length} Questions</span>
                                                <span className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800">{formatTime(quiz.timeLimit)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400"><Zap className="w-4 h-4" /><span className="text-sm font-medium">+{quiz.xpReward} XP</span></div>
                                                {!isLocked ? (
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">
                                                        <Play className="w-4 h-4" /> Start
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-500 dark:text-zinc-500">Requires Level {quiz.requiredLevel}</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {gameState === 'playing' && selectedQuiz && (
                    <motion.div key="playing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedQuiz.title}</h2><p className="text-sm text-slate-500 dark:text-zinc-500">Question {currentQuestion + 1} of {selectedQuiz.questions.length}</p></div>
                            <div className="flex items-center gap-4">
                                {combo > 1 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-3 py-1 bg-orange-500/10 rounded-full"><Flame className="w-4 h-4 text-orange-500" /><span className="text-orange-500 font-bold">{combo}x</span></motion.div>}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 30 ? 'bg-red-500/10 text-red-500' : 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'}`}><Clock className="w-5 h-5" /><span className="font-mono font-bold">{formatTime(timeLeft)}</span></div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full mb-6 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQuestion + 1) / selectedQuiz.questions.length) * 100}%` }} className="h-full bg-emerald-500" />
                        </div>

                        {/* Question */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 mb-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(selectedQuiz.questions[currentQuestion].difficulty)}`}>{selectedQuiz.questions[currentQuestion].difficulty}</span>
                                <span className="text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1"><Star className="w-4 h-4" />{selectedQuiz.questions[currentQuestion].points} pts</span>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedQuiz.questions[currentQuestion].question}</h3>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-3">
                            {selectedQuiz.questions[currentQuestion].options.map((option, idx) => {
                                const isCorrect = idx === selectedQuiz.questions[currentQuestion].correctAnswer;
                                const isSelected = selectedAnswer === idx;
                                let bgClass = 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700';
                                if (showAnswer) {
                                    if (isCorrect) bgClass = 'bg-emerald-500/10 border-emerald-500';
                                    else if (isSelected) bgClass = 'bg-red-500/10 border-red-500';
                                }
                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={!showAnswer ? { scale: 1.01 } : {}}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={showAnswer}
                                        className={`p-4 rounded-xl border text-left transition-all ${bgClass} ${showAnswer ? 'cursor-default' : 'cursor-pointer'} shadow-sm`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-white">{String.fromCharCode(65 + idx)}</span>
                                                <span className="text-slate-900 dark:text-white font-medium">{option}</span>
                                            </div>
                                            {showAnswer && isCorrect && <CheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />}
                                            {showAnswer && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Score */}
                        <div className="mt-6 text-center"><span className="text-slate-500 dark:text-zinc-500">Current Score: </span><span className="text-2xl font-bold text-slate-900 dark:text-white">{score}</span></div>
                    </motion.div>
                )}

                {gameState === 'result' && selectedQuiz && (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center">
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Trophy className="w-12 h-12 text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Quiz Complete!</h2>
                            <p className="text-slate-500 dark:text-zinc-500 mb-6">{selectedQuiz.title}</p>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4"><p className="text-3xl font-bold text-slate-900 dark:text-white">{score}</p><p className="text-xs text-slate-500 dark:text-zinc-500">Score</p></div>
                                <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4"><p className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">{correctAnswers}/{selectedQuiz.questions.length}</p><p className="text-xs text-slate-500 dark:text-zinc-500">Correct</p></div>
                                <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4"><p className="text-3xl font-bold text-orange-500 dark:text-orange-400">{maxCombo}x</p><p className="text-xs text-slate-500 dark:text-zinc-500">Max Combo</p></div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-center gap-2"><Zap className="w-6 h-6 text-amber-500 dark:text-amber-400" /><span className="text-2xl font-bold text-amber-500 dark:text-amber-400">+{Math.floor(score * 1.5) + (correctAnswers === selectedQuiz.questions.length ? 50 : 0)} XP</span></div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => startQuiz(selectedQuiz)} className="flex-1 px-6 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"><Play className="w-5 h-5" />Retry</button>
                                <button onClick={() => setGameState('menu')} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">More Quizzes <ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizPage;
