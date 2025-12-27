import { useEffect } from 'react';

interface WindowWithGC extends Window {
    gc?: () => void;
}

// Memory cleanup hook
export const useMemoryCleanup = () => {
    useEffect(() => {
        return () => {
            // Clean up any large objects, event listeners, etc.
            if ('gc' in window) {
                (window as WindowWithGC).gc?.();
            }
        };
    }, []);
};
