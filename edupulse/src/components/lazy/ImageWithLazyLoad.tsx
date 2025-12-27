import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageWithLazyLoadProps {
    src: string;
    alt: string;
    placeholder?: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}

// Image component with lazy loading and error handling
export const ImageWithLazyLoad: React.FC<ImageWithLazyLoadProps> = ({
    src,
    alt,
    placeholder,
    className = '',
    onLoad,
    onError
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [inView, setInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(img);
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        observer.observe(img);

        return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    return (
        <div className={`relative ${className}`}>
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
                    {placeholder || <Loader2 className="w-6 h-6 animate-spin text-slate-400" />}
                </div>
            )}
            
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
                    <div className="text-center text-slate-500 dark:text-zinc-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm">Failed to load image</p>
                    </div>
                </div>
            )}

            {inView && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                    } ${className}`}
                    loading="lazy"
                />
            )}
        </div>
    );
};
