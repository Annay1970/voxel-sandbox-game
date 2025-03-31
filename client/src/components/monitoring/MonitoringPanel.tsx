import React, { useState, useEffect, useRef } from 'react';
import { KeyboardDebugPanel } from './KeyboardDebugPanel';
import { useControlMonitoring } from '../../lib/monitoring/ControlsMonitor';

interface GameError {
  id: string;
  timestamp: number;
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: any;
}

export const MonitoringPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const [errors, setErrors] = useState<GameError[]>([]);
  const [warnings, setWarnings] = useState<GameError[]>([]);
  const [info, setInfo] = useState<GameError[]>([]);
  const [fps, setFps] = useState<number>(0);
  const [frameTime, setFrameTime] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const controlState = useControlMonitoring();
  
  const framesRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number | null>(null);
  
  // Handle errors from window
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      addError({
        id: `error_${Date.now()}`,
        timestamp: Date.now(),
        message: error.message,
        type: 'error',
        details: {
          stack: error.error?.stack,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno
        }
      });
    };
    
    // Handle uncaught promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      addError({
        id: `rejection_${Date.now()}`,
        timestamp: Date.now(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        type: 'error',
        details: {
          stack: event.reason?.stack,
          reason: event.reason
        }
      });
    };
    
    // Handle console.error
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      addError({
        id: `console_error_${Date.now()}`,
        timestamp: Date.now(),
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        type: 'error',
        details: { args }
      });
    };
    
    // Handle console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(console, args);
      addWarning({
        id: `console_warn_${Date.now()}`,
        timestamp: Date.now(),
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        type: 'warning',
        details: { args }
      });
    };
    
    // Handle console.info
    const originalConsoleInfo = console.info;
    console.info = (...args: any[]) => {
      originalConsoleInfo.apply(console, args);
      addInfo({
        id: `console_info_${Date.now()}`,
        timestamp: Date.now(),
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        type: 'info',
        details: { args }
      });
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);
  
  // Toggle panel visibility with tilde key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Add error, warning, and info handlers
  const handleError = (error: GameError) => {
    addError(error);
  };
  
  const handleWarning = (warning: GameError) => {
    addWarning(warning);
  };
  
  const handleInfo = (info: GameError) => {
    addInfo(info);
  };
  
  // Helper functions to add new items with a limit
  const addError = (error: GameError) => {
    setErrors(prev => [error, ...prev].slice(0, 100));
  };
  
  const addWarning = (warning: GameError) => {
    setWarnings(prev => [warning, ...prev].slice(0, 100));
  };
  
  const addInfo = (info: GameError) => {
    setInfo(prev => [info, ...prev].slice(0, 100));
  };
  
  // Performance monitoring
  useEffect(() => {
    const updateFrameStats = () => {
      framesRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      if (delta >= 1000) {
        // Update FPS
        setFps(Math.round((framesRef.current * 1000) / delta));
        
        // Update frame time (ms per frame)
        setFrameTime(delta / framesRef.current);
        
        // Reset counters
        framesRef.current = 0;
        lastTimeRef.current = now;
        
        // Update memory usage if available
        // Note: memory API is not standard and only available in Chrome
        const perf = performance as any;
        if (perf.memory) {
          setMemoryUsage(Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)));
        }
      }
      
      requestRef.current = requestAnimationFrame(updateFrameStats);
    };
    
    requestRef.current = requestAnimationFrame(updateFrameStats);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Show nothing when not visible
  if (!isVisible) {
    return null;
  }
  
  // Format timestamp to time string
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 text-white z-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Game Monitoring Panel</h1>
          <div className="flex items-center space-x-4">
            <div className={`px-2 py-1 rounded ${fps < 30 ? 'bg-red-900' : 'bg-green-900'}`}>
              FPS: {fps}
            </div>
            <div className={`px-2 py-1 rounded ${frameTime > 16 ? 'bg-yellow-900' : 'bg-green-900'}`}>
              Frame Time: {frameTime.toFixed(2)}ms
            </div>
            {memoryUsage > 0 && (
              <div className={`px-2 py-1 rounded ${memoryUsage > 200 ? 'bg-red-900' : 'bg-green-900'}`}>
                Memory: {memoryUsage}MB
              </div>
            )}
            <button 
              className="bg-red-700 px-3 py-1 rounded hover:bg-red-600"
              onClick={() => setIsVisible(false)}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-4">
          <nav className="flex space-x-4">
            <button 
              className={`px-4 py-2 ${activeTab === 'performance' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'errors' ? 'border-b-2 border-red-500' : ''}`}
              onClick={() => setActiveTab('errors')}
            >
              Errors ({errors.length})
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'warnings' ? 'border-b-2 border-yellow-500' : ''}`}
              onClick={() => setActiveTab('warnings')}
            >
              Warnings ({warnings.length})
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'info' ? 'border-b-2 border-green-500' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Info ({info.length})
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'controls' ? 'border-b-2 border-purple-500' : ''}`}
              onClick={() => setActiveTab('controls')}
            >
              Controls
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="bg-gray-900 p-4 rounded">
          {activeTab === 'performance' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Performance Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-medium mb-2">Rendering</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>FPS:</div>
                    <div className={fps < 30 ? 'text-red-400' : 'text-green-400'}>{fps}</div>
                    <div>Frame Time:</div>
                    <div className={frameTime > 16 ? 'text-yellow-400' : 'text-green-400'}>
                      {frameTime.toFixed(2)}ms
                    </div>
                    {memoryUsage > 0 && (
                      <>
                        <div>Memory Usage:</div>
                        <div className={memoryUsage > 200 ? 'text-red-400' : 'text-green-400'}>
                          {memoryUsage}MB
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-medium mb-2">Controls Active</h3>
                  <div className="text-sm">
                    {controlState.activeControls.length === 0 ? (
                      <span className="text-gray-400">No active controls</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {controlState.activeControls.map(control => (
                          <span 
                            key={control}
                            className="bg-blue-900 px-2 py-1 rounded text-xs"
                          >
                            {control}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-span-2">
                  <KeyboardDebugPanel />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'errors' && (
            <div>
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold">Errors</h2>
                <button 
                  className="text-xs bg-red-900 px-2 py-1 rounded hover:bg-red-800"
                  onClick={() => setErrors([])}
                >
                  Clear All
                </button>
              </div>
              {errors.length === 0 ? (
                <div className="text-gray-400 p-4 text-center">No errors recorded</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {errors.map(error => (
                    <div key={error.id} className="bg-red-900 bg-opacity-30 p-3 rounded border border-red-800">
                      <div className="flex justify-between text-xs text-red-300 mb-1">
                        <span>{formatTime(error.timestamp)}</span>
                      </div>
                      <div className="font-mono text-sm mb-2">{error.message}</div>
                      {error.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-red-300">Details</summary>
                          <pre className="mt-2 p-2 bg-black bg-opacity-30 rounded overflow-x-auto">
                            {error.details.stack || JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'warnings' && (
            <div>
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold">Warnings</h2>
                <button 
                  className="text-xs bg-yellow-900 px-2 py-1 rounded hover:bg-yellow-800"
                  onClick={() => setWarnings([])}
                >
                  Clear All
                </button>
              </div>
              {warnings.length === 0 ? (
                <div className="text-gray-400 p-4 text-center">No warnings recorded</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {warnings.map(warning => (
                    <div key={warning.id} className="bg-yellow-900 bg-opacity-30 p-3 rounded border border-yellow-800">
                      <div className="flex justify-between text-xs text-yellow-300 mb-1">
                        <span>{formatTime(warning.timestamp)}</span>
                      </div>
                      <div className="font-mono text-sm mb-2">{warning.message}</div>
                      {warning.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-yellow-300">Details</summary>
                          <pre className="mt-2 p-2 bg-black bg-opacity-30 rounded overflow-x-auto">
                            {JSON.stringify(warning.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'info' && (
            <div>
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold">Info</h2>
                <button 
                  className="text-xs bg-green-900 px-2 py-1 rounded hover:bg-green-800"
                  onClick={() => setInfo([])}
                >
                  Clear All
                </button>
              </div>
              {info.length === 0 ? (
                <div className="text-gray-400 p-4 text-center">No info messages recorded</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {info.map(item => (
                    <div key={item.id} className="bg-green-900 bg-opacity-30 p-3 rounded border border-green-800">
                      <div className="flex justify-between text-xs text-green-300 mb-1">
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                      <div className="font-mono text-sm mb-2">{item.message}</div>
                      {item.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-green-300">Details</summary>
                          <pre className="mt-2 p-2 bg-black bg-opacity-30 rounded overflow-x-auto">
                            {JSON.stringify(item.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'controls' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Controls Debug</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <KeyboardDebugPanel />
                </div>
                
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-medium mb-2">Active Controls</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Forward:</div>
                    <div className={controlState.forward ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.forward ? 'Active' : 'Inactive'}
                    </div>
                    <div>Back:</div>
                    <div className={controlState.back ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.back ? 'Active' : 'Inactive'}
                    </div>
                    <div>Left:</div>
                    <div className={controlState.left ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.left ? 'Active' : 'Inactive'}
                    </div>
                    <div>Right:</div>
                    <div className={controlState.right ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.right ? 'Active' : 'Inactive'}
                    </div>
                    <div>Jump:</div>
                    <div className={controlState.jump ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.jump ? 'Active' : 'Inactive'}
                    </div>
                    <div>Sprint:</div>
                    <div className={controlState.sprint ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.sprint ? 'Active' : 'Inactive'}
                    </div>
                    <div>Attack:</div>
                    <div className={controlState.attack ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.attack ? 'Active' : 'Inactive'}
                    </div>
                    <div>Place:</div>
                    <div className={controlState.place ? 'text-green-400' : 'text-gray-400'}>
                      {controlState.place ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Press ~ (tilde) key to toggle this panel. Press F3 for lightweight monitor.
        </div>
      </div>
    </div>
  );
};