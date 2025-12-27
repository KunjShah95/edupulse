import { 
    LazyLoad, 
    VirtualizedList, 
    ImageWithLazyLoad, 
    CreateLazyComponent,
    usePerformanceMonitor,
    useBundleAnalyzer,
    useMemoryCleanup,
    Preload
} from './lazy';

/**
 * Main LazyLoad Component
 * Re-exports optimized lazy loading components from the lazy/ subdirectory
 * to avoid code duplication and improve maintainability.
 */

// Re-export all lazy components for backward compatibility
export { 
    LazyLoad as LazyLoad,
    VirtualizedList, 
    ImageWithLazyLoad, 
    CreateLazyComponent,
    usePerformanceMonitor,
    useBundleAnalyzer,
    useMemoryCleanup,
    Preload
};

// Default export for backward compatibility
export default LazyLoad;

/**
 * Usage Examples:
 * 
 * 1. Basic lazy loading:
 * <LazyLoad>
 *   <HeavyComponent />
 * </LazyLoad>
 * 
 * 2. Virtualized list for large datasets:
 * <VirtualizedList
 *   items={largeArray}
 *   itemHeight={50}
 *   containerHeight={400}
 *   renderItem={(item, index) => <div>{item}</div>}
 * />
 * 
 * 3. Lazy loaded images:
 * <ImageWithLazyLoad
 *   src="large-image.jpg"
 *   alt="Description"
 * />
 * 
 * 4. Code splitting:
 * const LazyComponent = CreateLazyComponent(() => import('./HeavyComponent'));
 * <LazyComponent />
 * 
 * 5. Performance monitoring:
 * const { metrics } = usePerformanceMonitor();
 * 
 * 6. Bundle analysis (development only):
 * const { bundleSize } = useBundleAnalyzer();
 * 
 * 7. Memory cleanup:
 * useMemoryCleanup(); // Call in component that handles large datasets
 * 
 * 8. Resource preloading:
 * <Preload href="/important-font.woff" as="font" type="font/woff" crossOrigin="anonymous" />
 */
