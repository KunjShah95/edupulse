import { useState, useEffect } from 'react';

// Bundle analyzer helper (for development)
export const useBundleAnalyzer = () => {
    const [bundleSize, setBundleSize] = useState(0);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            // This would typically connect to a bundle analyzer
            // For now, we'll simulate it
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('.js') && entry.name.includes('chunk')) {
                        setBundleSize((entry as PerformanceResourceTiming).transferSize || 0);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
            
            return () => observer.disconnect();
        }
    }, []);

    return { bundleSize };
};
