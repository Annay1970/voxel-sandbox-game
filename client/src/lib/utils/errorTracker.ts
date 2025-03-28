import { useEffect } from 'react';

// Types of errors we want to track
type ErrorType = 'javascript' | 'webgl' | 'three' | 'resource' | 'performance' | 'unknown';

// Interface for our error entry
interface ErrorEntry {
  timestamp: number;
  type: ErrorType;
  message: string;
  stack?: string;
  location?: string;
  componentName?: string;
  additionalInfo?: Record<string, any>;
}

// Global collection of errors
const errors: ErrorEntry[] = [];
const MAX_ERRORS = 50; // Limit to prevent memory issues

// Error threshold settings
let consecutiveErrorCount = 0;
const CONSECUTIVE_ERROR_THRESHOLD = 5;
const ERROR_TIME_WINDOW = 10000; // 10 seconds

// Performance tracking
const performanceMetrics = {
  fps: 0,
  frameTime: 0,
  frameCount: 0,
  lastFrameTime: 0,
  memoryUsage: {
    jsHeapSizeLimit: 0,
    totalJSHeapSize: 0,
    usedJSHeapSize: 0
  }
};

// Flag to indicate if we're in a critical error state
let hasCriticalError = false;

// Determine the error type based on the error message and stack
function determineErrorType(error: Error): ErrorType {
  const errorStr = error.toString().toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  if (errorStr.includes('webgl') || errorStr.includes('gl context') || errorStr.includes('gpu')) {
    return 'webgl';
  }
  
  if (stack.includes('three') || errorStr.includes('three.js')) {
    return 'three';
  }
  
  if (errorStr.includes('failed to load') || errorStr.includes('not found') || 
      errorStr.includes('texture') || errorStr.includes('resource')) {
    return 'resource';
  }
  
  if (errorStr.includes('timeout') || errorStr.includes('memory') || 
      errorStr.includes('stack') || errorStr.includes('heap')) {
    return 'performance';
  }
  
  return 'javascript';
}

// Extract component name from error stack if possible
function extractComponentName(stack?: string): string | undefined {
  if (!stack) return undefined;
  
  // Look for React component names in the stack
  const componentMatch = stack.match(/at ([A-Z][a-zA-Z0-9]+)\s?\(/);
  return componentMatch ? componentMatch[1] : undefined;
}

// Track a new error
export function trackError(error: Error, additionalInfo?: Record<string, any>): void {
  // Don't track more errors if we're already in a critical error state
  if (hasCriticalError) return;
  
  const errorType = determineErrorType(error);
  const componentName = extractComponentName(error.stack);
  
  const errorEntry: ErrorEntry = {
    timestamp: Date.now(),
    type: errorType,
    message: error.message,
    stack: error.stack,
    location: window.location.href,
    componentName,
    additionalInfo
  };
  
  console.error('[ErrorTracker]', errorEntry);
  
  // Add to our collection
  errors.push(errorEntry);
  
  // Limit collection size
  if (errors.length > MAX_ERRORS) {
    errors.shift();
  }
  
  // Check for consecutive errors
  const recentErrors = errors.filter(
    e => e.timestamp > Date.now() - ERROR_TIME_WINDOW
  );
  
  if (recentErrors.length >= CONSECUTIVE_ERROR_THRESHOLD) {
    hasCriticalError = true;
    console.error('[ErrorTracker] Critical error threshold reached!', recentErrors);
    // Force show the error UI
    triggerErrorUI(error, recentErrors);
  }
}

// Get all errors
export function getErrors(): ErrorEntry[] {
  return [...errors];
}

// Clear errors
export function clearErrors(): void {
  errors.length = 0;
  consecutiveErrorCount = 0;
  hasCriticalError = false;
}

// Track WebGL context lost events
export function trackWebGLContextLoss(event: Event): void {
  trackError(new Error('WebGL context lost'), { event });
}

// Update performance metrics
export function updatePerformanceMetrics(): void {
  const now = performance.now();
  const frameTime = now - performanceMetrics.lastFrameTime;
  performanceMetrics.lastFrameTime = now;
  
  // Only update every 30 frames to reduce overhead
  if (performanceMetrics.frameCount % 30 === 0) {
    performanceMetrics.fps = 1000 / frameTime;
    performanceMetrics.frameTime = frameTime;
    
    // Get memory info if available
    if (performance && (performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      performanceMetrics.memoryUsage = {
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        usedJSHeapSize: memoryInfo.usedJSHeapSize
      };
    }
    
    // Check for performance issues
    if (performanceMetrics.fps < 20 && performanceMetrics.frameCount > 100) {
      trackError(
        new Error(`Low FPS detected: ${performanceMetrics.fps.toFixed(1)}`),
        { performanceMetrics }
      );
    }
  }
  
  performanceMetrics.frameCount++;
}

// Get performance metrics
export function getPerformanceMetrics() {
  return { ...performanceMetrics };
}

// Global flag to track if error tracking is already initialized
let errorTrackingInitialized = false;

// React hook to set up error tracking
export function useErrorTracking(componentName?: string) {
  useEffect(() => {
    // Prevent duplicate initialization that could cause infinite loops
    if (errorTrackingInitialized) {
      return;
    }

    errorTrackingInitialized = true;
    console.log("Initializing error tracking");

    const handleError = (event: ErrorEvent) => {
      // Skip React Maximum update depth errors to prevent recursion
      if (event.message && event.message.includes("Maximum update depth exceeded")) {
        console.warn("Maximum update depth error detected", event.message);
        return;
      }
      
      trackError(event.error || new Error(event.message), { 
        componentName, 
        errorEvent: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = typeof event.reason === 'object' && event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      trackError(error, { componentName, type: 'unhandledrejection' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // If this is the WebGL component, track context loss
    if (componentName === 'Canvas' || componentName === 'World') {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('webglcontextlost', trackWebGLContextLoss);
      }
    }

    return () => {
      errorTrackingInitialized = false;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      
      if (componentName === 'Canvas' || componentName === 'World') {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.removeEventListener('webglcontextlost', trackWebGLContextLoss);
        }
      }
    };
  }, []); // Empty dependency array so it only runs once

  return {
    trackError: (error: Error, info?: Record<string, any>) => 
      trackError(error, { ...info, componentName }),
    getErrors,
    clearErrors
  };
}

// Trigger UI error display
export function triggerErrorUI(error: Error, recentErrors: ErrorEntry[]): void {
  // Here we'll create an error element and add it to the DOM
  const errorContainer = document.createElement('div');
  errorContainer.id = 'game-error-container';
  errorContainer.style.position = 'fixed';
  errorContainer.style.top = '0';
  errorContainer.style.left = '0';
  errorContainer.style.width = '100%';
  errorContainer.style.height = '100%';
  errorContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  errorContainer.style.color = 'white';
  errorContainer.style.padding = '2rem';
  errorContainer.style.zIndex = '10000';
  errorContainer.style.overflow = 'auto';
  errorContainer.style.fontFamily = 'monospace';

  // Create error content
  const errorContent = document.createElement('div');
  errorContent.innerHTML = `
    <h1 style="color: #ff5555;">Game Engine Error Detected</h1>
    <p>The game has encountered a critical error and cannot continue.</p>
    <h2>Error Details:</h2>
    <div style="background: #333; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
      <p style="color: #ff9999;">${error.message}</p>
      <pre style="color: #aaaaaa; overflow: auto; max-height: 200px;">${error.stack || 'No stack trace available'}</pre>
    </div>
    <h2>Recent Errors (${recentErrors.length}):</h2>
    <ul style="margin-bottom: 2rem;">
      ${recentErrors.map(err => `
        <li style="margin-bottom: 0.5rem; border-bottom: 1px solid #444; padding-bottom: 0.5rem;">
          <strong>${err.type}</strong>: ${err.message}
          ${err.componentName ? `<span style="color: #aaffaa;"> in ${err.componentName}</span>` : ''}
          <span style="color: #999999;"> (${new Date(err.timestamp).toLocaleTimeString()})</span>
        </li>
      `).join('')}
    </ul>
    <button id="game-error-reload" style="background: #4466ff; color: white; border: none; padding: 1rem 2rem; font-size: 1rem; border-radius: 4px; cursor: pointer;">Reload Game</button>
  `;
  
  errorContainer.appendChild(errorContent);
  document.body.appendChild(errorContainer);
  
  // Add reload button functionality
  document.getElementById('game-error-reload')?.addEventListener('click', () => {
    window.location.reload();
  });
}

// Global reference to the update interval for debug panel
let debugPanelInterval: number | null = null;

// Export a debug panel component that can be used in development
export function createPerformanceDebugPanel() {
  // If we already have a debug panel, just return it
  let debugPanel = document.getElementById('performance-debug-panel');
  
  if (debugPanel && debugPanelInterval) {
    return debugPanel;
  }
  
  // Clean up any existing interval
  if (debugPanelInterval) {
    window.clearInterval(debugPanelInterval);
    debugPanelInterval = null;
  }
  
  // Create the panel if it doesn't exist
  if (!debugPanel) {
    debugPanel = document.createElement('div');
    debugPanel.id = 'performance-debug-panel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.left = '10px';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '4px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '1000';
    document.body.appendChild(debugPanel);
  }
  
  // Set up a single update interval
  debugPanelInterval = window.setInterval(() => {
    if (!debugPanel) return;
    
    const metrics = getPerformanceMetrics();
    const errorCount = getErrors().length;
    
    debugPanel.innerHTML = `
      <div>FPS: ${metrics.fps.toFixed(1)}</div>
      <div>Frame Time: ${metrics.frameTime.toFixed(1)}ms</div>
      <div>Errors: ${errorCount}</div>
      <div>Memory: ${((metrics.memoryUsage.usedJSHeapSize || 0) / 1048576).toFixed(1)}MB / 
                   ${((metrics.memoryUsage.jsHeapSizeLimit || 0) / 1048576).toFixed(1)}MB</div>
    `;
  }, 500) as unknown as number;
  
  return debugPanel;
}