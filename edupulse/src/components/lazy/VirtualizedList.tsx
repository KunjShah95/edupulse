import React, { useState, useRef, useCallback } from 'react';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    overscan?: number;
}

// Virtualized list for performance with large datasets
export const VirtualizedList = <T,>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    className = '',
    overscan = 5
}: VirtualizedListProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const visibleStartIndex = Math.floor(scrollTop / itemHeight);
    const visibleEndIndex = Math.min(
        visibleStartIndex + Math.ceil(containerHeight / itemHeight) + overscan,
        items.length - 1
    );

    const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);
    const totalHeight = items.length * itemHeight;
    const offsetY = visibleStartIndex * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0
                    }}
                >
                    {visibleItems.map((item, index) => {
                        const actualIndex = visibleStartIndex + index;
                        return (
                            <div
                                key={actualIndex}
                                style={{ height: itemHeight }}
                                className="border-b border-slate-200 dark:border-zinc-700"
                            >
                                {renderItem(item, actualIndex)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
