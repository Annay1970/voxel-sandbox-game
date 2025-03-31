import React, { useEffect, useState } from 'react';
import { useGamepadControls } from '../../lib/controls/useGamepadControls';
import { gamepadManager, GamepadButton, GamepadAxis, ControllerType } from '../../lib/controls/GamepadManager';

const GamepadDisplay: React.FC<{ showByDefault?: boolean }> = ({ showByDefault = false }) => {
  const [visible, setVisible] = useState(showByDefault);
  const gamepadControls = useGamepadControls();
  
  // Toggle visibility when the 'G' key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyG') {
        setVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!visible) {
    // Show a small indicator if a controller is connected
    if (gamepadControls.isControllerConnected) {
      return (
        <div 
          className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md text-xs cursor-pointer"
          onClick={() => setVisible(true)}
        >
          {gamepadControls.getPrimaryControllerName()} connected
          <span className="ml-2 text-xs text-gray-400">(Press G to show)</span>
        </div>
      );
    }
    return null;
  }
  
  // Format time to display last activity
  const formatTimeSince = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${seconds % 60}s ago`;
    }
  };
  
  // Render a controller type icon
  const ControllerIcon = ({ type }: { type: ControllerType }) => {
    switch (type) {
      case ControllerType.Xbox:
        return <span className="text-green-500">Xbox</span>;
      case ControllerType.PlayStation:
        return <span className="text-blue-500">PlayStation</span>;
      case ControllerType.Nintendo:
        return <span className="text-red-500">Nintendo</span>;
      default:
        return <span className="text-gray-500">Controller</span>;
    }
  };
  
  // Render a button icon
  const ButtonDisplay = ({ name, pressed }: { name: string, pressed: boolean }) => (
    <div className={`px-2 py-1 rounded ${pressed ? 'bg-green-700' : 'bg-gray-800'}`}>
      {name}
    </div>
  );
  
  // Render a joystick position
  const AxisDisplay = ({ x, y, label }: { x: number, y: number, label: string }) => {
    // Calculate position for the thumb stick indicator
    const stickSize = 64;
    const dotSize = 12;
    const centerX = stickSize / 2;
    const centerY = stickSize / 2;
    const posX = centerX + x * (stickSize / 2 - dotSize / 2);
    const posY = centerY + y * (stickSize / 2 - dotSize / 2);
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-sm mb-1">{label}</div>
        <div 
          className="rounded-full bg-gray-800 relative" 
          style={{ width: stickSize, height: stickSize }}
        >
          {/* Center point */}
          <div 
            className="absolute bg-gray-600 rounded-full"
            style={{
              width: 4,
              height: 4,
              left: centerX - 2,
              top: centerY - 2
            }}
          />
          
          {/* Thumb position */}
          <div 
            className="absolute bg-green-500 rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              left: posX - dotSize / 2,
              top: posY - dotSize / 2,
              transition: 'all 0.05s ease-out'
            }}
          />
        </div>
        <div className="text-xs mt-1">
          X: {x.toFixed(2)} Y: {y.toFixed(2)}
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-md shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          <ControllerIcon type={gamepadControls.getPrimaryControllerType()} />
          {' '}{gamepadControls.getPrimaryControllerName()}
        </h2>
        <button 
          className="px-2 py-1 bg-red-800 rounded hover:bg-red-700 text-sm"
          onClick={() => setVisible(false)}
        >
          Close
        </button>
      </div>
      
      {gamepadControls.isControllerConnected ? (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <AxisDisplay 
              x={gamepadControls.movementX} 
              y={gamepadControls.movementY}
              label="Movement"
            />
            <AxisDisplay 
              x={gamepadControls.cameraX} 
              y={-gamepadControls.cameraY} // Invert for display
              label="Camera"
            />
          </div>
          
          <div className="font-medium mb-2">Buttons</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <ButtonDisplay name="Jump" pressed={gamepadControls.jump} />
            <ButtonDisplay name="Sprint" pressed={gamepadControls.sprint} />
            <ButtonDisplay name="Attack" pressed={gamepadControls.attack} />
            <ButtonDisplay name="Place" pressed={gamepadControls.place} />
            <ButtonDisplay name="Interact" pressed={gamepadControls.interact} />
            <ButtonDisplay name="Inventory" pressed={gamepadControls.inventory} />
            <ButtonDisplay name="Menu" pressed={gamepadControls.menu} />
          </div>
          
          {gamepadControls.lastInputName && (
            <div className="text-sm text-gray-300">
              Last input: 
              <span className="ml-1 font-mono text-green-400">
                {gamepadControls.lastInputName} 
                ({gamepadControls.lastInputType}) 
                {formatTimeSince(gamepadControls.lastInputTime)}
              </span>
            </div>
          )}
          
          <div className="mt-4 flex justify-between">
            <button 
              className="px-3 py-1 bg-blue-800 rounded hover:bg-blue-700 text-sm"
              onClick={() => gamepadControls.vibrate(300, 0.8, 0.5)}
            >
              Test Vibration
            </button>
            <div className="text-xs text-gray-400 mt-1">
              Press G to toggle this panel
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-gray-400">
          <div className="mb-2">No controller detected</div>
          <div className="text-sm">Connect a controller to use gamepad controls</div>
        </div>
      )}
    </div>
  );
};

export default GamepadDisplay;