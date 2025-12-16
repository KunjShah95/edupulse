
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Paperclip, Phone, Video, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const contacts = [
    { id: 1, name: 'Dr. Sarah Wilson', role: 'Math Teacher', avatar: 'SW', online: true, lastMsg: 'The results are published.' },
    { id: 2, name: 'Principal Office', role: 'Administration', avatar: 'PO', online: false, lastMsg: 'Please attend the meeting tomorrow.' },
    { id: 3, name: 'Mr. James Brown', role: 'Physics Teacher', avatar: 'JB', online: true, lastMsg: 'Lab equipment is ready.' },
    { id: 4, name: 'Class 10-A Group', role: 'Group Chat', avatar: '10A', online: false, lastMsg: 'Study guide attached.' },
    { id: 5, name: 'Emily Davis', role: 'Parent', avatar: 'ED', online: false, lastMsg: 'Can we schedule a call?' },
];

const initialMessages = [
    { id: 1, sender: 'them', text: 'Hi, I wanted to discuss the upcoming math test.', time: '10:30 AM' },
    { id: 2, sender: 'me', text: 'Sure, happy to help. What specific topics are you concerned about?', time: '10:32 AM' },
    { id: 3, sender: 'them', text: 'Mainly calculus and derivatives.', time: '10:33 AM' },
    { id: 4, sender: 'me', text: 'I understand. We can review those after class on Thursday.', time: '10:35 AM' },
    { id: 5, sender: 'them', text: 'That would be great! Thank you so much.', time: '10:36 AM' },
];

const MessagesPage = () => {
    const [selectedContact, setSelectedContact] = useState(contacts[0]);
    const [messages, setMessages] = useState(initialMessages);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        const newMessage = {
            id: messages.length + 1,
            sender: 'me',
            text: inputMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInputMessage('');

        // Simulate reply
        setTimeout(() => {
            const reply = {
                id: messages.length + 2,
                sender: 'them',
                text: "Thanks for your message! I'll get back to you shortly.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prevMessages => [...prevMessages, reply]);
            addToast('New message received', 'info');
        }, 3000);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="h-[calc(100vh-100px)] flex gap-6"
        >
            {/* Contacts List */}
            <div className="w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="font-bold text-lg dark:text-white mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 ${selectedContact.id === contact.id
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                                    {contact.avatar}
                                </div>
                                {contact.online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className={`font-semibold text-sm truncate ${selectedContact.id === contact.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                                        }`}>{contact.name}</h4>
                                    <span className="text-[10px] text-slate-400">10:30 AM</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 hidden md:flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300">
                                {selectedContact.avatar}
                            </div>
                            {selectedContact.online && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{selectedContact.name}</h3>
                            <p className="text-xs text-green-500 font-medium">{selectedContact.online ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => addToast('Starting voice call...', 'success')}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Phone className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => addToast('Starting video call...', 'success')}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Video className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => addToast('Contact info', 'info')}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-center my-4">
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full">TODAY</span>
                    </div>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender === 'me'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                }`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-blue-200' : 'text-slate-400'
                                    }`}>{msg.time}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => addToast('Attachment feature coming soon', 'info')}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white text-sm resize-none py-2 max-h-32"
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            className={`p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95 ${!inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!inputMessage.trim()}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MessagesPage;
