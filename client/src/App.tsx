import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, KeyboardControls, Stars, Loader } from '@react-three/drei';
import GamepadDisplay from './components/game/GamepadDisplay';
import Crosshair from './components/game/Crosshair';
import MobileControls from './components/game/MobileControls';
import Player from './components/game/Player';
import BlockInteraction from './components/game/BlockInteraction';
import DemoCreatures from './components/game/DemoCreatures';
import WeatherInfo from './components/ui/WeatherInfo';
import StaminaBar from './components/ui/StaminaBar';
import TemperatureIndicator from './components/ui/TemperatureIndicator';
import HungerBar from './components/ui/HungerBar';
import { useIsMobile } from './hooks/use-is-mobile';
import { gamepadManager } from './lib/controls/GamepadManager';

// Define game controls
export enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
  sprint = 'sprint',
  attack = 'attack',
  place = 'place',
  interact = 'interact',
  inventory = 'inventory',
  toggleCamera = 'toggleCamera'
}

// Loading screen component
interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen = ({ progress }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      <h1 className="mb-4 text-4xl font-bold">Voxel World</h1>
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2">{Math.round(progress)}% loaded</p>
    </div>
  );
};

// We're using Block components from BlockInteraction instead

// We now have an actual Player component imported from './components/game/Player'

function App() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const { isMobile, isTouch } = useIsMobile();
  
  // Simulate loading
  useEffect(() => {
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 5;
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        clearInterval(interval);
        setTimeout(() => setLoading(false), 500); // Small delay for smooth transition
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Initialize gamepad support
  useEffect(() => {
    // Start the gamepad manager
    gamepadManager.start();
    
    // Cleanup on unmount
    return () => {
      gamepadManager.stop();
    };
  }, []);
  
  // Define key mappings for keyboard controls
  const keyMap = [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.sprint, keys: ['ShiftLeft', 'ShiftRight'] },
    { name: Controls.attack, keys: ['KeyF'] },
    { name: Controls.place, keys: ['KeyE'] },
    { name: Controls.interact, keys: ['KeyQ'] },
    { name: Controls.inventory, keys: ['Tab', 'KeyI'] },
    { name: Controls.toggleCamera, keys: ['KeyV'] }
  ];
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {loading ? (
        <LoadingScreen progress={progress} />
      ) : showDemo ? (
        <>
          <DemoCreatures />
          <button 
            className="fixed top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded z-50"
            onClick={() => setShowDemo(false)}
          >
            Back to Game
          </button>
        </>
      ) : (
        <>
          <KeyboardControls map={keyMap}>
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
              <Suspense fallback={null}>
                <Sky sunPosition={[10, 5, 10]} />
                <Stars radius={100} depth={50} count={5000} factor={4} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <Player position={[0, 1, 0]} />
                <BlockInteraction />
                
                {/* Ground plane as a fallback */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
                  <planeGeometry args={[100, 100]} />
                  <meshStandardMaterial color="#3b8c3b" />
                </mesh>
              </Suspense>
            </Canvas>
          </KeyboardControls>
          
          {/* Game UI components */}
          <div className="absolute left-4 top-4 text-white">
            <h1 className="text-2xl font-bold">Voxel World</h1>
            <p className="text-sm mt-1">A sandbox adventure</p>
          </div>
          
          {/* Button to show demo */}
          <button 
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setShowDemo(true)}
          >
            Show Creature Demo
          </button>
          
          {/* Crosshair in the center of the screen */}
          <Crosshair size={20} color="white" thickness={2} gap={6} />
          
          {/* Gamepad display (press G to toggle) */}
          <GamepadDisplay showByDefault={false} />
          
          {/* Mobile controls for touch devices */}
          {isMobile && <MobileControls />}
          
          {/* Weather information display */}
          <WeatherInfo position="top-right" detailed={true} />
          
          {/* Stamina bar */}
          <StaminaBar />
          
          {/* Temperature indicator */}
          <TemperatureIndicator />
          
          {/* Hunger bar */}
          <HungerBar />
        </>
      )}
      
      {!loading && !showDemo && <Loader />}
    </div>
  );
}

export default App;