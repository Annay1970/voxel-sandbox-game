import React, { useState, useEffect } from 'react';
import { useControlMonitoring } from '../../lib/monitoring/ControlsMonitor';

interface KeyState {
  key: string;
  pressed: boolean;
  lastPressed: number;
  count: number;
  active: boolean; // If detected by useKeyboardControls
}

export const KeyboardDebugPanel: React.FC = () => {
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>({});
  const [latestKey, setLatestKey] = useState<string | null>(null);
  const controlState = useControlMonitoring();
  
  // Track direct keyboard events
  useEffect(() => {
    const keysToTrack = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'];
    
    const updateKeyState = (key: string, pressed: boolean) => {
      const now = Date.now();
      
      setKeyStates(prevStates => {
        const prevState = prevStates[key] || {
          key,
          pressed: false,
          lastPressed: 0,
          count: 0,
          active: false
        };
        
        return {
          ...prevStates,
          [key]: {
            ...prevState,
            pressed,
            lastPressed: pressed ? now : prevState.lastPressed,
            count: pressed ? prevState.count + 1 : prevState.count
          }
        };
      });
      
      if (pressed) {
        setLatestKey(key);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysToTrack.includes(e.code)) {
        updateKeyState(e.code, true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysToTrack.includes(e.code)) {
        updateKeyState(e.code, false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Update key states with control state
  useEffect(() => {
    const controlMapping: Record<string, string[]> = {
      forward: ['KeyW'],
      back: ['KeyS'],
      left: ['KeyA'],
      right: ['KeyD'],
      jump: ['Space'],
      sprint: ['ShiftLeft']
    };
    
    setKeyStates(prevStates => {
      const newStates = { ...prevStates };
      
      // Reset all active states
      Object.keys(newStates).forEach(key => {
        newStates[key] = { ...newStates[key], active: false };
      });
      
      // Set active states based on current controls
      Object.entries(controlMapping).forEach(([control, keys]) => {
        const isActive = controlState[control as keyof typeof controlState];
        if (isActive) {
          keys.forEach(key => {
            if (newStates[key]) {
              newStates[key] = { ...newStates[key], active: true };
            }
          });
        }
      });
      
      return newStates;
    });
  }, [controlState]);
  
  const keyDisplay = (keyCode: string, label: string) => {
    const state = keyStates[keyCode] || {
      key: keyCode,
      pressed: false,
      lastPressed: 0,
      count: 0,
      active: false
    };
    
    const isRecent = Date.now() - state.lastPressed < 1000;
    const discrepancy = state.pressed && !state.active;
    
    return (
      <div 
        className={`
          border rounded p-2 text-center w-14 h-14 flex flex-col items-center justify-center
          ${state.pressed ? 'bg-blue-700 border-blue-500' : 'bg-gray-800 border-gray-700'}
          ${isRecent ? 'ring-2 ring-yellow-500' : ''}
          ${discrepancy ? 'border-red-500' : ''}
          ${state.active ? 'border-green-500' : ''}
          transition-all duration-100
        `}
      >
        <div className="text-sm font-bold">{label}</div>
        <div className="text-xs text-gray-400">{state.count}</div>
        {discrepancy && <div className="text-xs text-red-500">!</div>}
      </div>
    );
  };
  
  return (
    <div className="p-2 bg-gray-900 rounded-md">
      <div className="text-sm font-semibold mb-2">Keyboard Input Debug</div>
      
      <div className="mb-4 text-xs">
        <div className="bg-blue-700 inline-block w-3 h-3 mr-1 rounded-sm"></div> Pressed
        <div className="bg-gray-800 inline-block w-3 h-3 mx-1 border border-green-500 rounded-sm"></div> Active in Controls
        <div className="bg-gray-800 inline-block w-3 h-3 mx-1 border border-red-500 rounded-sm"></div> Discrepancy
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-start-2">{keyDisplay('KeyW', 'W')}</div>
        <div></div>
        <div>{keyDisplay('KeyA', 'A')}</div>
        <div>{keyDisplay('KeyS', 'S')}</div>
        <div>{keyDisplay('KeyD', 'D')}</div>
        <div></div>
        <div className="col-span-2">{keyDisplay('Space', 'Space')}</div>
        <div>{keyDisplay('ShiftLeft', 'Shift')}</div>
      </div>
      
      <div className="text-xs">
        <div>Latest key: <span className="font-mono">{latestKey || 'None'}</span></div>
        <div>Active controls: <span className="font-mono">{controlState.activeControls.join(', ') || 'None'}</span></div>
      </div>
    </div>
  );
};