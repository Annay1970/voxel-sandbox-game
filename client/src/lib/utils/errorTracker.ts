import { useState, useCallback } from 'react';

// Performance metrics tracking
let frameCount = 0;
let lastFrameTime = performance.now();
let frameRate = 60;
let memoryUsage: any = {};

// Update metrics, called on each render frame
export function updatePerformanceMetrics() {
  const now = performance.now();
  frameCount++;
  
  // Update FPS calculation every second
  if (now - lastFrameTime >= 1000) {
    frameRate = frameCount;
    frameCount = 0;
    lastFrameTime = now;
    
    // Log performance stats in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${frameRate} FPS`);
      console.log('Memory:', memoryUsage);
    }
  }
  
  // Try to get memory info if available (Chrome only)
  if ((performance as any).memory) {
    memoryUsage = {
      totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    };
  }
}

// Get current performance data
export function getPerformanceMetrics() {
  return {
    fps: frameRate,
    memory: memoryUsage
  };
}

// Basic error tracking hook
export function useErrorTracking(componentName: string) {
  const [errors, setErrors] = useState<Error[]>([]);
  
  const trackError = useCallback((error: Error, metadata?: any) => {
    console.error(`Error in ${componentName}:`, error, metadata || {});
    
    // Store error
    setErrors(prev => [...prev, error]);
    
    // Log to console with additional context
    console.group(`Error in ${componentName}`);
    console.error(error);
    if (metadata) {
      console.info('Additional context:', metadata);
    }
    console.groupEnd();
    
    // Return the error (allows for chaining)
    return error;
  }, [componentName]);
  
  return {
    errors,
    trackError,
    clearErrors: () => setErrors([])
  };
}

// Export error types for use in components
export type ErrorHandler = (error: Error, metadata?: any) => Error;

// Default noop error tracker for optional use
export const noopErrorTracker: ErrorHandler = (error) => error;