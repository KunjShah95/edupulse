import { useEffect, useRef, useCallback } from 'react';

// Hook for managing focus trapping in modals/dialogs
export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [isActive]);

    return containerRef;
};

// Hook for managing skip links
export const useSkipLink = () => {
    const skipToContent = () => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView();
        }
    };

    return { skipToContent };
};

// Hook for managing screen reader announcements
export const useAnnouncement = () => {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.setAttribute('aria-relevant', 'additions text');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    return { announce };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
    items: unknown[],
    onSelect: (index: number) => void,
    options: {
        loop?: boolean;
        orientation?: 'horizontal' | 'vertical';
        focusFirst?: boolean;
    } = {}
) => {
    const { loop = true, orientation = 'vertical', focusFirst = false } = options;
    const currentIndexRef = useRef(-1);

    const handleKeyDown = (e: KeyboardEvent) => {
        const { key } = e;
        const isHorizontal = orientation === 'horizontal';
        const isVertical = orientation === 'vertical';

        let nextIndex = currentIndexRef.current;

        switch (key) {
            case 'ArrowUp':
                if (isVertical) {
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndexRef.current - 1);
                }
                break;
            case 'ArrowDown':
                if (isVertical) {
                    e.preventDefault();
                    nextIndex = Math.min(items.length - 1, currentIndexRef.current + 1);
                }
                break;
            case 'ArrowLeft':
                if (isHorizontal) {
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndexRef.current - 1);
                }
                break;
            case 'ArrowRight':
                if (isHorizontal) {
                    e.preventDefault();
                    nextIndex = Math.min(items.length - 1, currentIndexRef.current + 1);
                }
                break;
            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                nextIndex = items.length - 1;
                break;
            case 'Enter':
            case ' ':
                if (currentIndexRef.current >= 0) {
                    e.preventDefault();
                    onSelect(currentIndexRef.current);
                }
                break;
            default:
                return;
        }

        // Handle wrapping
        if (loop && nextIndex < 0) {
            nextIndex = items.length - 1;
        } else if (loop && nextIndex >= items.length) {
            nextIndex = 0;
        }

        if (nextIndex !== currentIndexRef.current && nextIndex >= 0 && nextIndex < items.length) {
            currentIndexRef.current = nextIndex;
            // Focus the item at the new index
            const targetElement = document.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement;
            targetElement?.focus();
        }
    };

    const reset = useCallback(() => {
        currentIndexRef.current = focusFirst ? 0 : -1;
    }, [focusFirst]);

    useEffect(() => {
        reset();
    }, [items, reset]);

    const getCurrentIndex = () => currentIndexRef.current;

    return {
        handleKeyDown,
        reset,
        getCurrentIndex
    };
};

// Hook for managing ARIA attributes
export const useAriaAttributes = (
    role: string,
    options: {
        expanded?: boolean;
        selected?: boolean;
        pressed?: boolean;
        checked?: boolean;
        disabled?: boolean;
        busy?: boolean;
        hidden?: boolean;
    } = {}
) => {
    const attributes: Record<string, unknown> = {
        role,
    };

    if (options.expanded !== undefined) {
        attributes['aria-expanded'] = options.expanded;
    }
    if (options.selected !== undefined) {
        attributes['aria-selected'] = options.selected;
    }
    if (options.pressed !== undefined) {
        attributes['aria-pressed'] = options.pressed;
    }
    if (options.checked !== undefined) {
        attributes['aria-checked'] = options.checked;
    }
    if (options.disabled !== undefined) {
        attributes['aria-disabled'] = options.disabled;
    }
    if (options.busy !== undefined) {
        attributes['aria-busy'] = options.busy;
    }
    if (options.hidden !== undefined) {
        attributes['aria-hidden'] = options.hidden;
    }

    return attributes;
};

// Hook for managing color contrast
export const useColorContrast = (foreground: string, background: string) => {
    // Calculate relative luminance
    const getLuminance = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
    };

    const contrastRatio = (() => {
        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    })();

    return {
        ratio: contrastRatio,
        isAA: contrastRatio >= 4.5,
        isAAA: contrastRatio >= 7,
        isLargeTextAA: contrastRatio >= 3,
        isLargeTextAAA: contrastRatio >= 4.5
    };
};
