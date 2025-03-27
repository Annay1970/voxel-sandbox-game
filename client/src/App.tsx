import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import World from "./components/game/World";
import UI from "./components/game/UI";
import { Controls } from "./lib/stores/useVoxelGame";
import { useErrorTracking, createPerformanceDebugPanel } from "./lib/utils/errorTracker";

function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  
  // Set up error tracking
  const { trackError } = useErrorTracking('App');
  
  // Load sounds
  useEffect(() => {
    try {
      const backgroundMusic = new Audio("/sounds/background.mp3");
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      setBackgroundMusic(backgroundMusic);

      const hitSound = new Audio("/sounds/hit.mp3");
      setHitSound(hitSound);

      const successSound = new Audio("/sounds/success.mp3");
      setSuccessSound(successSound);

      setShowCanvas(true); // Show canvas after loading sounds
      
      console.log("Game initialized and sounds loaded");
    } catch (error) {
      trackError(error as Error, { context: 'sound_initialization' });
      // Still show canvas even if sounds fail
      setShowCanvas(true);
    }
  }, [setBackgroundMusic, setHitSound, setSuccessSound, trackError]);
  
  // Create debug panel
  useEffect(() => {
    if (showDebugPanel) {
      const panel = createPerformanceDebugPanel();
      return () => {
        panel.remove();
      };
    }
  }, [showDebugPanel]);
  
  // Define keyboard controls
  const keyMap = [
    { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
    { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
    { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
    { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
    { name: Controls.jump, keys: ["Space"] },
    { name: Controls.mine, keys: ["KeyE"] },
    { name: Controls.place, keys: ["KeyQ"] },
    { name: Controls.inventory, keys: ["KeyI"] },
    { name: Controls.sprint, keys: ["ShiftLeft"] },
  ];

  return (
    <div className="w-full h-full">
      {showCanvas && (
        <KeyboardControls map={keyMap}>
          <ErrorBoundary>
            <Canvas
              shadows
              camera={{
                position: [5, 25, 5], 
                fov: 70,
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: true,
                powerPreference: "high-performance",
                alpha: false,
                preserveDrawingBuffer: true
              }}
              dpr={[1, 2]} // Limit DPR for better performance
              onCreated={({ gl }) => {
                // Configure renderer for better performance
                gl.setClearColor('#87CEEB', 1);
                console.log("Canvas created successfully");
              }}
            >
              <color attach="background" args={["#87CEEB"]} />
              <fog attach="fog" args={["#87CEEB", 30, 100]} />
              
              <Suspense fallback={<LoadingFallback />}>
                <World />
              </Suspense>
            </Canvas>
            <UI />
          </ErrorBoundary>
        </KeyboardControls>
      )}
    </div>
  );
}

// Custom error boundary component to catch and display render errors
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);
  
  // Set up error tracking
  const { trackError, getErrors } = useErrorTracking('ErrorBoundary');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error caught by ErrorBoundary:", event.error);
      
      // Track the error with our tracker
      if (event.error) {
        trackError(event.error, { source: 'window_error_event' });
      } else {
        trackError(new Error(event.message || 'Unknown error'), { 
          source: 'window_error_event',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
      
      // Update state with error information
      setError(event.error || new Error(event.message || 'Unknown error'));
      setErrorDetails(getErrors().slice(-5)); // Get the 5 most recent errors
      setHasError(true);
    };

    // Listen for errors
    window.addEventListener('error', handleError);
    
    // Add a key listener for debug panel toggle (Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        const panel = document.getElementById('performance-debug-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [trackError, getErrors]);

  if (hasError) {
    return (
      <div className="error-boundary p-4 bg-red-100 border border-red-400 rounded text-black">
        <h2 className="text-2xl mb-2 text-red-800">Game Engine Error</h2>
        <p className="mb-2 text-red-700">The game encountered an error and cannot continue. See the details below to help identify the problem.</p>
        
        {error && (
          <div className="mb-4">
            <h3 className="font-bold text-red-900">Main Error:</h3>
            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40 border border-red-300">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </div>
        )}
        
        {errorDetails.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-red-900">Recent Errors:</h3>
            <ul className="bg-white rounded border border-red-300 p-2 text-xs">
              {errorDetails.map((err, index) => (
                <li key={index} className="mb-2 pb-2 border-b border-red-100 last:border-b-0">
                  <div><span className="font-bold">Type:</span> {err.type}</div>
                  <div><span className="font-bold">Message:</span> {err.message}</div>
                  {err.componentName && <div><span className="font-bold">Component:</span> {err.componentName}</div>}
                  <div><span className="font-bold">Time:</span> {new Date(err.timestamp).toLocaleTimeString()}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}>
            Reload Game
          </button>
          
          <button 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={() => {
              // Create and download error report
              const report = {
                timestamp: new Date().toISOString(),
                mainError: error ? { message: error.message, stack: error.stack } : null,
                recentErrors: errorDetails,
                userAgent: navigator.userAgent,
                url: window.location.href
              };
              
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'game-error-report.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>
            Download Error Report
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Loading fallback component
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  );
}

export default App;
