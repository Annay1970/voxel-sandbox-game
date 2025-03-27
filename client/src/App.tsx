import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import World from "./components/game/World";
import UI from "./components/game/UI";
import { Controls } from "./lib/stores/useVoxelGame";

function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Load sounds
  useEffect(() => {
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
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);
  
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

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error caught by ErrorBoundary:", event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="error-boundary p-4 bg-red-100 border border-red-400 rounded">
        <h2 className="text-2xl mb-2 text-red-800">Something went wrong rendering the game</h2>
        <p className="mb-4 text-red-700">The game engine encountered an error. Try refreshing the page.</p>
        {error && <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">{error.toString()}</pre>}
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => window.location.reload()}>
          Reload Game
        </button>
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
