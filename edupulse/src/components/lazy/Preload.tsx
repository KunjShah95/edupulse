import React, { useEffect } from 'react';

// Preload component for critical resources
export const Preload: React.FC<{ 
    href: string; 
    as?: string; 
    type?: string;
    crossOrigin?: string;
}> = ({ href, as, type, crossOrigin }) => {
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        if (as) link.as = as;
        if (type) link.type = type;
        if (crossOrigin) link.crossOrigin = crossOrigin;
        
        document.head.appendChild(link);
        
        return () => {
            document.head.removeChild(link);
        };
    }, [href, as, type, crossOrigin]);

    return null;
};
