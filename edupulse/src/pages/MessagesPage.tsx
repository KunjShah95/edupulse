
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Paperclip, Phone, Video, Info, Check, CheckCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { useAuth, User } from '../context/AuthContext';

interface Message {
    id: string;
    sender: Partial<User>;
    content: string;
    createdAt: string;
    attachments: string[];
    readAt?: string;
}

interface Conversation {
    id: string;
    participants: string[];
}

// Mock contacts for now, will be replaced with real data
const contacts: Partial<User>[] = [
    { id: 'user-2', firstName: 'Dr. Sarah', lastName: 'Wilson', role: 'teacher' },
    { id: 'user-3', firstName: 'Principal', lastName: 'Office', role: 'admin' },
];

const MessagesPage = () => {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const [selectedContact, setSelectedContact] = useState<Partial<User>>(contacts[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (socket && selectedContact?.id) {
            // Get or create conversation
            socket.emit('getConversation', selectedContact.id, (conv: Conversation) => {
                setConversation(conv);
                socket.emit('joinRoom', conv.id);

                // Fetch initial messages
                fetch(`http://localhost:3000/api/v1/chat/${conv.id}/messages`, {
                    headers: {
                        'Authorization': `Bearer your-jwt-token` // Replace with actual token
                    }
                })
                    .then(res => res.json())
                    .then(data => setMessages(data))
                    .catch(err => console.error('Error fetching messages:', err));
            });
        }
    }, [socket, selectedContact]);

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', (message: Message) => {
                setMessages(prev => [...prev, message]);
                if (message.sender.id !== user?.id) {
                    addToast(`New message from ${message.sender.firstName}`, 'info');
                }
            });

            socket.on('typing', ({ user, isTyping }) => {
                // Logic to show typing indicator for the user
                setIsTyping(isTyping);
            });

            socket.on('messageRead', ({ messageId }) => {
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
                ));
            });

            return () => {
                socket.off('newMessage');
                socket.off('typing');
                socket.off('messageRead');
            };
        }
    }, [socket, addToast, user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversation) return;

        const formData = new FormData();
        formData.append('file', file);

        addToast('Uploading file...', 'info');

        try {
            const response = await fetch(`http://localhost:3000/api/v1/chat/upload/${conversation.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer your-jwt-token` // Replace with actual token
                },
                body: formData,
            });

            if (response.ok) {
                addToast('File uploaded successfully', 'success');
            } else {
                addToast('File upload failed', 'error');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            addToast('File upload failed', 'error');
        }
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !socket || !conversation) return;

        socket.emit('sendMessage', {
            conversationId: conversation.id,
            message: inputMessage,
        });

        setInputMessage('');
    };

    const handleTyping = (isTyping: boolean) => {
        if (!socket || !conversation) return;
        socket.emit('typing', {
            conversationId: conversation.id,
            isTyping,
        });
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
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 ${selectedContact?.id === contact.id
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                                    {contact.firstName?.charAt(0)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className={`font-semibold text-sm truncate ${selectedContact?.id === contact.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                                        }`}>{contact.firstName} {contact.lastName}</h4>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{contact.role}</p>
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
                                {selectedContact?.firstName?.charAt(0)}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'} border-2 border-white dark:border-slate-900 rounded-full`}></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{selectedContact?.firstName} {selectedContact?.lastName}</h3>
                            <p className={`text-xs font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>{isConnected ? 'Connected' : 'Disconnected'}</p>
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
                        <div key={msg.id} className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender.id === user?.id
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                }`}>
                                <p className="text-sm">{msg.content}</p>
                                {msg.attachments?.map(url => (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline block mt-1">
                                        Attachment
                                    </a>
                                ))}
                                <p className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${msg.sender.id === user?.id ? 'text-blue-200' : 'text-slate-400'
                                    }`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender.id === user?.id && (
                                        msg.readAt ? <CheckCheck size={14} /> : <Check size={14} />
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="p-4 text-sm text-slate-500 italic">
                        {selectedContact?.firstName} is typing...
                    </div>
                )}
                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <textarea
                            value={inputMessage}
                            onChange={(e) => {
                                setInputMessage(e.target.value);
                                handleTyping(true);
                            }}
                            onBlur={() => handleTyping(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                    handleTyping(false);
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
