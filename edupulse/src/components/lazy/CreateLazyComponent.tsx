import React from 'react';
import { Loader2 } from 'lucide-react';

// Code splitting helper
export const CreateLazyComponent = <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
): React.FC<React.ComponentProps<T>> => {
    const LazyComponent = React.lazy(importFunc);

    const Fallback = fallback || (() => <Loader2 className="w-6 h-6 animate-spin" />);

    const TypedLazyComponent =
        LazyComponent as unknown as React.ComponentType<React.ComponentProps<T>>;

    const Component: React.FC<React.ComponentProps<T>> = (props) => (
        <React.Suspense fallback={<Fallback />}>
            <TypedLazyComponent {...props} />
        </React.Suspense>
    );

    return Component;
};
