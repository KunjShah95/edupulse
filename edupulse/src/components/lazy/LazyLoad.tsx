import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
    children: React.ReactNode;
    threshold?: number;
    rootMargin?: string;
    placeholder?: React.ReactNode;
    className?: string;
    onLoad?: () => void;
}

// Main LazyLoad component using Intersection Observer
export const LazyLoad: React.FC<LazyLoadProps> = ({
    children,
    threshold = 0.1,
    rootMargin = '50px',
    placeholder,
    className = '',
    onLoad
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                    onLoad?.();
                }
            },
            {
                threshold,
                rootMargin,
            }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [threshold, rootMargin, hasLoaded, onLoad]);

    return (
        <div ref={elementRef} className={className}>
            {isVisible ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            ) : (
                placeholder || (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                )
            )}
        </div>
    );
};

export default LazyLoad;
