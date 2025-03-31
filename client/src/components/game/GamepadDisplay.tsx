import React, { useState, useEffect } from 'react';
import { useGamepadControls } from '../../lib/controls/useGamepadControls';
import { gamepadManager } from '../../lib/controls/GamepadManager';

// Enum for controller types (for icon display)
enum ControllerType {
  Xbox = 'xbox',
  PlayStation = 'playstation',
  Nintendo = 'nintendo',
  Generic = 'generic'
}

interface GamepadDisplayProps {
  showByDefault?: boolean;
}

/**
 * Visual display for gamepad input, useful for testing and debugging
 */
export default function GamepadDisplay({ showByDefault = false }: GamepadDisplayProps) {
  const [isVisible, setIsVisible] = useState(showByDefault);
  const [isCompact, setIsCompact] = useState(true);
  const gamepad = useGamepadControls();
  
  // Toggle visibility when G key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyG') {
        setIsVisible(prev => !prev);
      } else if (e.code === 'KeyC' && isVisible) {
        setIsCompact(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  // Determine controller type based on ID
  const getControllerType = (id: string): ControllerType => {
    id = id.toLowerCase();
    
    if (id.includes('xbox') || id.includes('microsoft')) {
      return ControllerType.Xbox;
    } else if (id.includes('playstation') || id.includes('sony') || id.includes('dualshock') || id.includes('dualsense')) {
      return ControllerType.PlayStation;
    } else if (id.includes('nintendo') || id.includes('switch') || id.includes('joycon')) {
      return ControllerType.Nintendo;
    } else {
      return ControllerType.Generic;
    }
  };
  
  const ControllerIcon = ({ type }: { type: ControllerType }) => {
    switch (type) {
      case ControllerType.Xbox:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.07,18.28C5.14,16.86 4,14.54 4,12C4,11.25 4.12,10.5 4.34,9.8C4.44,9.54 4.73,9.27 5.5,9C6.41,8.67 7.67,8.91 9.08,9.79C9.45,10 9.89,10.33 10.38,10.71C11.5,11.57 12.7,12.62 13.19,13.83C13.58,14.77 13.34,15.71 12.5,16.33C10.83,17.54 9.18,18 7.07,18.28M18.36,17.72C16.43,18.67 14.04,18.67 12.23,17.92C14.29,17.29 17,14.88 17,13.12C17,12.09 16.47,11.27 16.26,10.89C15.95,10.31 14.68,8.93 13.77,8.25C12.23,7.05 11,6.45 9.77,6.3C10.5,5.91 11.23,5.5 12,5.5C12.77,5.5 13.43,5.73 14.13,6C14.5,6.13 15.04,6.5 15.5,7.13C15.96,7.76 16.89,9.12 17.03,9.5C17.31,10.31 17.5,11.16 17.5,12C17.5,14.16 16.22,16.22 15.04,17.22C16.1,17.5 17.18,17.82 18.36,17.72M14.72,13.87C14.5,13.16 13.8,12.39 13.23,11.82C13.04,11.63 12.5,11.28 12.05,11C11.79,10.83 11.5,10.7 11.25,10.54C12.4,11 14.2,12.3 14.58,13.34C14.93,14.34 14.22,15.07 13.66,15.5C14.25,15.28 14.93,14.87 14.72,13.87Z" />
          </svg>
        );
      case ControllerType.PlayStation:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5,10.29V5.36H9.4V10.8L17,11.57V12.5L9.4,13.04V17.5H8.5V12.76L6.5,12.5V11.57L8.5,11.43V10.29M18.33,16.27L20.32,15.8V5.92L18.56,6.34L17.85,8.77L16.76,9.25L17.5,7.08L15.03,7.42V8.63L16.15,8.3L15.79,9.91L14.67,10.3L15.03,9.04L12.5,9.42V10.8L13.58,10.47L13.23,11.86L12.16,12.35L12.5,10.97L10.77,11.36L10.91,14.97L11.92,14.9V13.33H12.92V14.8L18.44,14.08L18.33,16.27M13.13,17.5L15.41,16.5V13.74L13.13,14.3V17.5M16.41,16.25L18.33,15.88L18.5,13L16.41,13.58V16.25Z" />
          </svg>
        );
      case ControllerType.Nintendo:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.04,20.4H7.12C6.19,20.4 5.3,20 4.64,19.36C4,18.7 3.6,17.81 3.6,16.88V7.12C3.6,6.19 4,5.3 4.64,4.64C5.3,4 6.19,3.62 7.12,3.62H10.04V20.4M7.12,2A5.12,5.12 0 0,0 2,7.12V16.88C2,19.71 4.29,22 7.12,22H11.65V2H7.12M5.11,8C5.11,6.95 5.96,6.11 7,6.11C8.04,6.11 8.89,6.95 8.89,8C8.89,9.05 8.04,9.89 7,9.89C5.96,9.89 5.11,9.05 5.11,8M16.88,11.78C16.34,11.78 15.88,11.33 15.88,10.78C15.88,10.23 16.34,9.78 16.88,9.78C17.43,9.78 17.88,10.23 17.88,10.78C17.88,11.33 17.43,11.78 16.88,11.78M16.88,8.22C16.34,8.22 15.88,7.77 15.88,7.22C15.88,6.67 16.34,6.22 16.88,6.22C17.43,6.22 17.88,6.67 17.88,7.22C17.88,7.77 17.43,8.22 16.88,8.22M14.38,10.78C14.38,11.33 13.93,11.78 13.38,11.78C12.83,11.78 12.38,11.33 12.38,10.78C12.38,10.23 12.83,9.78 13.38,9.78C13.93,9.78 14.38,10.23 14.38,10.78M19.38,10.78C19.38,11.33 18.93,11.78 18.38,11.78C17.83,11.78 17.38,11.33 17.38,10.78C17.38,10.23 17.83,9.78 18.38,9.78C18.93,9.78 19.38,10.23 19.38,10.78M16.88,13.22C16.34,13.22 15.88,12.77 15.88,12.22C15.88,11.67 16.34,11.22 16.88,11.22C17.43,11.22 17.88,11.67 17.88,12.22C17.88,12.77 17.43,13.22 16.88,13.22M13.38,7.22C13.38,7.77 12.93,8.22 12.38,8.22C11.83,8.22 11.38,7.77 11.38,7.22C11.38,6.67 11.83,6.22 12.38,6.22C12.93,6.22 13.38,6.67 13.38,7.22M16.88,2A5.12,5.12 0 0,0 11.75,7.12V16.88C11.75,19.71 14.05,22 16.88,22C19.71,22 22,19.71 22,16.88V7.12A5.12,5.12 0 0,0 16.88,2M20.4,16.88C20.4,17.81 20,18.7 19.36,19.36C18.7,20 17.81,20.4 16.88,20.4C15.95,20.4 15.06,20 14.4,19.36C13.75,18.7 13.35,17.81 13.35,16.88V7.12C13.35,6.19 13.75,5.3 14.4,4.64C15.06,4 15.95,3.6 16.88,3.6C17.81,3.6 18.7,4 19.36,4.64C20,5.3 20.4,6.19 20.4,7.12V16.88Z" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.5,9H2V15H7.5V9M6,13.5H3.5V10.5H6V13.5M22,9H16.5V15H22V9M20.5,13.5H18V10.5H20.5V13.5M15,9H9.5V15H15V9M13.5,13.5H11V10.5H13.5V13.5Z" />
          </svg>
        );
    }
  };
  
  const getControllerName = (id: string): string => {
    if (!id) return "No Controller";
    
    if (id.toLowerCase().includes('xbox')) {
      return "Xbox Controller";
    } else if (id.toLowerCase().includes('dualshock 4')) {
      return "PS4 Controller";
    } else if (id.toLowerCase().includes('dualsense')) {
      return "PS5 Controller";
    } else if (id.toLowerCase().includes('dual shock')) {
      return "PlayStation Controller";
    } else if (id.toLowerCase().includes('joycon')) {
      return "Nintendo Joy-Con";
    } else if (id.toLowerCase().includes('switch')) {
      return "Nintendo Switch Controller";
    } else {
      return "Generic Controller";
    }
  };
  
  // Get the controller type based on connected gamepad
  const controllerType = gamepad.connected 
    ? getControllerType(gamepadManager.getActiveGamepad()?.id || '')
    : ControllerType.Generic;
    
  // Get a more user-friendly controller name
  const controllerName = gamepad.connected 
    ? getControllerName(gamepadManager.getActiveGamepad()?.id || '')
    : "No Controller";
  
  return (
    <div className={`fixed right-4 ${isCompact ? 'top-4' : 'top-16'} z-50 p-4 bg-gray-800 bg-opacity-90 rounded-md text-white shadow-lg transition-all duration-300 ease-in-out ${isCompact ? 'w-48' : 'w-96'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <ControllerIcon type={controllerType} />
          <span className="ml-2 font-semibold">
            {gamepad.connected ? controllerName : "No Controller"}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsCompact(prev => !prev)}
            className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
          >
            {isCompact ? "Expand" : "Collapse"}
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
          >
            Hide
          </button>
        </div>
      </div>
      
      {/* Connection status */}
      <div className="flex items-center mb-2">
        <div className={`w-3 h-3 rounded-full ${gamepad.connected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
        <span className="text-sm">{gamepad.connected ? "Connected" : "Disconnected"}</span>
      </div>
      
      {/* Compact view only shows minimal info */}
      {isCompact ? (
        <div className="text-xs text-gray-300 mt-2">
          <p>Press G to hide, C to expand</p>
        </div>
      ) : (
        <>
          {/* Left stick */}
          <div className="mt-3">
            <div className="text-sm font-semibold mb-1">Left Stick</div>
            <div className="flex">
              <div className="w-16 h-16 relative border border-gray-600 rounded-full bg-gray-700">
                <div 
                  className="w-4 h-4 bg-blue-500 rounded-full absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${50 + gamepad.movementX * 50}%`, 
                    top: `${50 + gamepad.movementY * 50}%` 
                  }}
                ></div>
              </div>
              <div className="ml-4 text-xs">
                <div>X: {gamepad.movementX.toFixed(2)}</div>
                <div>Y: {gamepad.movementY.toFixed(2)}</div>
                <div className="mt-2">
                  {gamepad.leftStickPress && <span className="bg-blue-500 px-1 py-0.5 rounded">Pressed</span>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right stick */}
          <div className="mt-3">
            <div className="text-sm font-semibold mb-1">Right Stick</div>
            <div className="flex">
              <div className="w-16 h-16 relative border border-gray-600 rounded-full bg-gray-700">
                <div 
                  className="w-4 h-4 bg-blue-500 rounded-full absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${50 + gamepad.cameraX * 50}%`, 
                    top: `${50 + gamepad.cameraY * 50}%` 
                  }}
                ></div>
              </div>
              <div className="ml-4 text-xs">
                <div>X: {gamepad.cameraX.toFixed(2)}</div>
                <div>Y: {gamepad.cameraY.toFixed(2)}</div>
                <div className="mt-2">
                  {gamepad.rightStickPress && <span className="bg-blue-500 px-1 py-0.5 rounded">Pressed</span>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="mt-3">
            <div className="text-sm font-semibold mb-1">Buttons</div>
            <div className="grid grid-cols-2 gap-2">
              <ButtonIndicator label="A/Cross" isActive={gamepad.jump} />
              <ButtonIndicator label="B/Circle" isActive={gamepad.interact} />
              <ButtonIndicator label="X/Square" isActive={gamepad.attack} />
              <ButtonIndicator label="Y/Triangle" isActive={gamepad.place} />
              <ButtonIndicator label="L1/LB" isActive={gamepad.sprint} />
              <ButtonIndicator label="R1/RB" isActive={gamepad.inventory} />
              <ButtonIndicator label="Start" isActive={gamepad.start} />
              <ButtonIndicator label="Select" isActive={gamepad.select} />
            </div>
          </div>
          
          {/* D-Pad */}
          <div className="mt-3">
            <div className="text-sm font-semibold mb-1">D-Pad</div>
            <div className="grid grid-cols-3 gap-1">
              <div></div>
              <ButtonIndicator label="Up" isActive={gamepad.dpadUp} />
              <div></div>
              <ButtonIndicator label="Left" isActive={gamepad.dpadLeft} />
              <div></div>
              <ButtonIndicator label="Right" isActive={gamepad.dpadRight} />
              <div></div>
              <ButtonIndicator label="Down" isActive={gamepad.dpadDown} />
              <div></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-300 mt-4">
            <p>Press G to hide, C to collapse</p>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for button indicators
const ButtonIndicator = ({ label, isActive }: { label: string, isActive: boolean }) => (
  <div className={`px-2 py-1 text-xs rounded ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
    {label}
  </div>
);