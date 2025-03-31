import { useState, useEffect } from 'react';
import { gamepadManager, GamepadState } from './GamepadManager';

// Default result structure when no gamepad is available
const defaultControlState = {
  // Movement (left stick)
  movementX: 0,
  movementY: 0,
  
  // Camera (right stick)
  cameraX: 0,
  cameraY: 0,
  
  // Face buttons
  jump: false,      // A button (default gamepad mapping)
  attack: false,    // X button
  interact: false,  // B button
  place: false,     // Y button
  
  // Shoulder buttons
  sprint: false,    // Left trigger (L2/LT)
  inventory: false, // Right trigger (R2/RT)
  
  // D-pad buttons
  dpadUp: false,
  dpadDown: false,
  dpadLeft: false,
  dpadRight: false,
  
  // Meta buttons
  start: false,
  select: false,
  
  // Thumbstick buttons
  leftStickPress: false,
  rightStickPress: false,
  
  // Whether a gamepad is connected
  connected: false
};

/**
 * Custom hook to access gamepad input in React components
 * 
 * @returns A state object containing all gamepad controls
 */
export function useGamepadControls() {
  const [controls, setControls] = useState(defaultControlState);
  
  // Listen for gamepad changes
  useEffect(() => {
    // Function to update the controls state from the gamepad
    const updateControls = (gamepad: GamepadState | null) => {
      if (!gamepad) {
        setControls({...defaultControlState, connected: false});
        return;
      }
      
      setControls({
        // Movement (left stick)
        movementX: gamepad.axes[0] || 0,
        movementY: gamepad.axes[1] || 0,
        
        // Camera (right stick)
        cameraX: gamepad.axes[2] || 0,
        cameraY: gamepad.axes[3] || 0,
        
        // Face buttons (Xbox mapping)
        jump: gamepad.buttons[0]?.pressed || false,      // A
        interact: gamepad.buttons[1]?.pressed || false,  // B
        attack: gamepad.buttons[2]?.pressed || false,    // X
        place: gamepad.buttons[3]?.pressed || false,     // Y
        
        // Shoulder buttons
        sprint: gamepad.buttons[6]?.pressed || false,     // LT
        inventory: gamepad.buttons[7]?.pressed || false,  // RT
        
        // D-pad
        dpadUp: gamepad.buttons[12]?.pressed || false,
        dpadDown: gamepad.buttons[13]?.pressed || false,
        dpadLeft: gamepad.buttons[14]?.pressed || false,
        dpadRight: gamepad.buttons[15]?.pressed || false,
        
        // Meta buttons
        select: gamepad.buttons[8]?.pressed || false, // Back/Select/Share
        start: gamepad.buttons[9]?.pressed || false,  // Start/Options
        
        // Thumbstick buttons
        leftStickPress: gamepad.buttons[10]?.pressed || false,
        rightStickPress: gamepad.buttons[11]?.pressed || false,
        
        // Connected status
        connected: true
      });
    };
    
    // Subscribe to gamepad updates
    const unsubscribe = gamepadManager.subscribe(updateControls);
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  return controls;
}