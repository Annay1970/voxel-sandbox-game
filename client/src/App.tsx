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
          <Canvas
            shadows
            camera={{
              position: [0, 20, 0], 
              fov: 70,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "high-performance"
            }}
          >
            <color attach="background" args={["#87CEEB"]} />
            <fog attach="fog" args={["#87CEEB", 30, 100]} />
            
            <Suspense fallback={null}>
              <World />
            </Suspense>
          </Canvas>
          <UI />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
