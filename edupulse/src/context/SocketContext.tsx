import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Adjust the URL to your backend server
            const newSocket = io('http://localhost:3000', {
                auth: {
                    userId: user.id,
                    token: 'some-jwt-token' // Replace with actual token
                },
            });

            setSocket(newSocket);

            newSocket.on('connect', () => {
                setIsConnected(true);
                console.log('Socket connected');
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
                console.log('Socket disconnected');
            });

            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
