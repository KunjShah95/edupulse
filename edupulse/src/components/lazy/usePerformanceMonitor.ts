import { useState, useEffect, useCallback } from 'react';

interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
    memory?: PerformanceMemory;
}

// Performance monitor hook
export const usePerformanceMonitor = () => {
    const [metrics, setMetrics] = useState({
        renderTime: 0,
        memoryUsage: 0,
        loadTime: 0
    });

    useEffect(() => {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            setMetrics(prev => ({
                ...prev,
                renderTime,
                memoryUsage: (performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0
            }));
        };
    }, []);

    const measureLoadTime = useCallback(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
            setMetrics(prev => ({
                ...prev,
                loadTime: navigation.loadEventEnd - navigation.startTime
            }));
        }
    }, []);

    return { metrics, measureLoadTime };
};
