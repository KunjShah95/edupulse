import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Book, Clock, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const categories = ['All Books', 'Fiction', 'Science', 'History', 'Technology', 'Arts', 'Biography'];

const allBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', rating: 4.8, cover: 'bg-blue-100', category: 'Fiction', status: 'Available' },
    { id: 2, title: 'A Brief History of Time', author: 'Stephen Hawking', rating: 4.9, cover: 'bg-purple-100', category: 'Science', status: 'Borrowed' },
    { id: 3, title: 'Clean Code', author: 'Robert C. Martin', rating: 5.0, cover: 'bg-emerald-100', category: 'Technology', status: 'Available' },
    { id: 4, title: '1984', author: 'George Orwell', rating: 4.7, cover: 'bg-orange-100', category: 'Fiction', status: 'Available' },
    { id: 5, title: 'Steve Jobs', author: 'Walter Isaacson', rating: 4.9, cover: 'bg-gray-100', category: 'Biography', status: 'Available' },
    { id: 6, title: 'Sapiens', author: 'Yuval Noah Harari', rating: 4.8, cover: 'bg-amber-100', category: 'History', status: 'Borrowed' },
    { id: 7, title: 'The Da Vinci Code', author: 'Dan Brown', rating: 4.6, cover: 'bg-red-100', category: 'Fiction', status: 'Available' },
];

const LibraryPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToast } = useToast();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Filter books
    const filteredBooks = allBooks.filter(book => {
        const matchesCategory = activeCategory === 'All' || book.category === activeCategory;
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleBookClick = (book: any) => {
        addToast(`You selected: ${book.title}`, 'info');
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Library Catalog</h1>
                    <p className="text-sm text-slate-500">Explore and manage library resources.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search title, author, isbn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <motion.div variants={item} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveCategory('All')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeCategory === 'All'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    All Books
                </button>
                {categories.filter(cat => cat !== 'All Books').map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeCategory === cat
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <motion.div variants={item} className="lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBooks.map((book) => (
                            <div key={book.id} onClick={() => handleBookClick(book)} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full">
                                <div className={`aspect-[3/4] rounded-xl ${book.cover} mb-4 relative overflow-hidden flex-shrink-0`}>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                        {book.category}
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <button className="w-full py-2 bg-white text-slate-900 text-xs font-bold rounded-lg shadow-lg">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate" title={book.title}>{book.title}</h3>
                                    <p className="text-slate-500 text-sm mb-3 truncate">{book.author}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            {book.rating}
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${book.status === 'Available' ? 'bg-green-100 text-green-600 dark:bg-green-900/10 dark:text-green-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/10 dark:text-orange-400'
                                            }`}>
                                            {book.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Placeholders for visual fullness */}
                        <div
                            onClick={() => addToast('Book request form opening...', 'info')}
                            className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all min-h-[300px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-500 mb-3 transition-colors">
                                <Book className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">Request a Book</p>
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar */}
                <motion.div variants={item} className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">My Books</h3>
                            <p className="text-slate-400 text-sm mb-6">2 books currently borrowed</p>

                            <div className="space-y-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-sm">Cosmos</h5>
                                        <span className="text-xs text-orange-400 font-bold">Due Today</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div className="w-[90%] h-full bg-orange-400 rounded-full" />
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-slate-400">Return by 5:00 PM</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToast('Book returned successfully!', 'success');
                                            }}
                                            className="text-[10px] bg-white text-slate-900 px-2 py-1 rounded font-bold hover:bg-slate-200"
                                        >
                                            Return
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-sm">Physics Vol 1</h5>
                                        <span className="text-xs text-emerald-400 font-bold">12 days left</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div className="w-[30%] h-full bg-emerald-400 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Reading Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Book className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold dark:text-white">12</p>
                                    <p className="text-xs text-slate-500">Books read this year</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold dark:text-white">48h</p>
                                    <p className="text-xs text-slate-500">Reading time</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default LibraryPage;
