import { useEffect, useState, useRef } from 'react';
import { gamepadManager, ControllerState, GamepadButton, GamepadAxis, ControllerType } from './GamepadManager';

// Mapping between gamepad controls and our game's actions
interface GamepadControlMapping {
  // Movement
  forward: GamepadButton | GamepadAxis;
  back: GamepadButton | GamepadAxis;
  left: GamepadButton | GamepadAxis;
  right: GamepadButton | GamepadAxis;
  jump: GamepadButton;
  sprint: GamepadButton;
  
  // Actions
  attack: GamepadButton;
  place: GamepadButton;
  interact: GamepadButton;
  
  // Inventory/UI
  inventory: GamepadButton;
  menu: GamepadButton;
  
  // Camera
  cameraX: GamepadAxis;
  cameraY: GamepadAxis;
}

// Default control mappings for different controller types
const DEFAULT_MAPPINGS: Record<ControllerType, GamepadControlMapping> = {
  [ControllerType.Xbox]: {
    // Movement
    forward: GamepadAxis.LeftStickY, // Negative Y is forward
    back: GamepadAxis.LeftStickY,    // Positive Y is back
    left: GamepadAxis.LeftStickX,    // Negative X is left
    right: GamepadAxis.LeftStickX,   // Positive X is right
    jump: GamepadButton.A,
    sprint: GamepadButton.L3,        // Left stick press
    
    // Actions
    attack: GamepadButton.R2,        // Right trigger
    place: GamepadButton.L2,         // Left trigger
    interact: GamepadButton.X,
    
    // Inventory/UI
    inventory: GamepadButton.Y,
    menu: GamepadButton.Start,
    
    // Camera
    cameraX: GamepadAxis.RightStickX,
    cameraY: GamepadAxis.RightStickY
  },
  
  [ControllerType.PlayStation]: {
    // Movement
    forward: GamepadAxis.LeftStickY,
    back: GamepadAxis.LeftStickY,
    left: GamepadAxis.LeftStickX,
    right: GamepadAxis.LeftStickX,
    jump: GamepadButton.A,          // Cross button
    sprint: GamepadButton.L3,       // Left stick press
    
    // Actions
    attack: GamepadButton.R2,       // Right trigger
    place: GamepadButton.L2,        // Left trigger
    interact: GamepadButton.X,      // Square button
    
    // Inventory/UI
    inventory: GamepadButton.Y,     // Triangle button
    menu: GamepadButton.Start,      // Options button
    
    // Camera
    cameraX: GamepadAxis.RightStickX,
    cameraY: GamepadAxis.RightStickY
  },
  
  [ControllerType.Nintendo]: {
    // Movement
    forward: GamepadAxis.LeftStickY,
    back: GamepadAxis.LeftStickY,
    left: GamepadAxis.LeftStickX,
    right: GamepadAxis.LeftStickX,
    jump: GamepadButton.B,          // Bottom button (Nintendo style)
    sprint: GamepadButton.L3,       // Left stick press
    
    // Actions
    attack: GamepadButton.R2,       // ZR button
    place: GamepadButton.L2,        // ZL button
    interact: GamepadButton.Y,      // Left button
    
    // Inventory/UI
    inventory: GamepadButton.X,     // Top button
    menu: GamepadButton.Start,      // Plus button
    
    // Camera
    cameraX: GamepadAxis.RightStickX,
    cameraY: GamepadAxis.RightStickY
  },
  
  // Generic and unknown controllers use Xbox-like mapping as default
  [ControllerType.Generic]: {
    forward: GamepadAxis.LeftStickY,
    back: GamepadAxis.LeftStickY,
    left: GamepadAxis.LeftStickX,
    right: GamepadAxis.LeftStickX,
    jump: GamepadButton.A,
    sprint: GamepadButton.L3,
    
    attack: GamepadButton.R2,
    place: GamepadButton.L2,
    interact: GamepadButton.X,
    
    inventory: GamepadButton.Y,
    menu: GamepadButton.Start,
    
    cameraX: GamepadAxis.RightStickX,
    cameraY: GamepadAxis.RightStickY
  },
  
  [ControllerType.Unknown]: {
    forward: GamepadAxis.LeftStickY,
    back: GamepadAxis.LeftStickY,
    left: GamepadAxis.LeftStickX,
    right: GamepadAxis.LeftStickX,
    jump: GamepadButton.A,
    sprint: GamepadButton.L3,
    
    attack: GamepadButton.R2,
    place: GamepadButton.L2,
    interact: GamepadButton.X,
    
    inventory: GamepadButton.Y,
    menu: GamepadButton.Start,
    
    cameraX: GamepadAxis.RightStickX,
    cameraY: GamepadAxis.RightStickY
  }
};

// The state returned by the hook
export interface GamepadControlsState {
  // Connected controllers
  controllers: Map<number, ControllerState>;
  controllerCount: number;
  primaryController?: ControllerState;
  
  // Movement and camera inputs
  movementX: number;
  movementY: number;
  cameraX: number;
  cameraY: number;
  
  // Button states
  jump: boolean;
  sprint: boolean;
  attack: boolean;
  place: boolean;
  interact: boolean;
  inventory: boolean;
  menu: boolean;
  
  // Utility functions
  isControllerConnected: boolean;
  getPrimaryControllerType: () => ControllerType;
  getPrimaryControllerName: () => string;
  vibrate: (duration?: number, strongMagnitude?: number, weakMagnitude?: number) => boolean;
  
  // For debugging and UI
  lastInputTime: number;
  lastInputType: 'button' | 'axis' | null;
  lastInputName: string | null;
}

// Main hook for using gamepad controls
export function useGamepadControls(startImmediately: boolean = true) {
  // State for connected controllers
  const [controllers, setControllers] = useState<Map<number, ControllerState>>(new Map());
  const [primaryControllerIndex, setPrimaryControllerIndex] = useState<number>(-1);
  
  // Game control states
  const [jumpPressed, setJumpPressed] = useState(false);
  const [sprintPressed, setSprintPressed] = useState(false);
  const [attackPressed, setAttackPressed] = useState(false);
  const [placePressed, setPlacePressed] = useState(false);
  const [interactPressed, setInteractPressed] = useState(false);
  const [inventoryPressed, setInventoryPressed] = useState(false);
  const [menuPressed, setMenuPressed] = useState(false);
  const [movementX, setMovementX] = useState(0);
  const [movementY, setMovementY] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  
  // Debug and UI states
  const [lastInputTime, setLastInputTime] = useState<number>(0);
  const [lastInputType, setLastInputType] = useState<'button' | 'axis' | null>(null);
  const [lastInputName, setLastInputName] = useState<string | null>(null);
  
  // Keep a current mapping based on controller type
  const currentMappingRef = useRef<GamepadControlMapping>(DEFAULT_MAPPINGS[ControllerType.Xbox]);
  
  // Start the gamepad manager when component mounts
  useEffect(() => {
    if (startImmediately) {
      gamepadManager.start();
    }
    
    // Update controller states when they change
    const handleControllersUpdate = (updatedControllers: Map<number, ControllerState>) => {
      setControllers(new Map(updatedControllers));
      
      // Set the first connected controller as primary if none is selected
      if (primaryControllerIndex === -1 && updatedControllers.size > 0) {
        // Safe way to get the first key from a Map
        const firstKey = Array.from(updatedControllers.keys())[0];
        if (firstKey !== undefined) {
          setPrimaryControllerIndex(firstKey as number);
          
          // Set mapping based on controller type
          const firstController = updatedControllers.get(firstKey);
          if (firstController) {
            currentMappingRef.current = DEFAULT_MAPPINGS[firstController.type];
          }
        }
      }
      
      // If primary controller disconnected, find another
      if (primaryControllerIndex !== -1 && !updatedControllers.has(primaryControllerIndex)) {
        if (updatedControllers.size > 0) {
          // Safe way to get the first key
          const firstKey = Array.from(updatedControllers.keys())[0];
          if (firstKey !== undefined) {
            setPrimaryControllerIndex(firstKey as number);
            
            // Update mapping for new controller
            const newController = updatedControllers.get(firstKey);
            if (newController) {
              currentMappingRef.current = DEFAULT_MAPPINGS[newController.type];
            }
          }
        } else {
          setPrimaryControllerIndex(-1);
        }
      }
      
      // Update control states based on primary controller
      updateControlStates(updatedControllers);
    };
    
    gamepadManager.addListener(handleControllersUpdate);
    
    // Initial scan for controllers
    gamepadManager.scanForControllers?.();
    
    return () => {
      gamepadManager.removeListener(handleControllersUpdate);
      if (startImmediately) {
        gamepadManager.stop();
      }
    };
  }, [startImmediately, primaryControllerIndex]);
  
  // Helper to update all control states based on controller input
  const updateControlStates = (updatedControllers: Map<number, ControllerState>) => {
    if (primaryControllerIndex === -1) return;
    
    const controller = updatedControllers.get(primaryControllerIndex);
    if (!controller) return;
    
    const mapping = currentMappingRef.current;
    
    // Movement controls
    let newMovementX = 0;
    let newMovementY = 0;
    
    // D-pad movement (digital)
    if (controller.buttons[GamepadButton.DPadUp as number]?.pressed) {
      newMovementY = -1;
      updateLastInput('button', 'DPadUp');
    } else if (controller.buttons[GamepadButton.DPadDown as number]?.pressed) {
      newMovementY = 1;
      updateLastInput('button', 'DPadDown');
    }
    
    if (controller.buttons[GamepadButton.DPadLeft as number]?.pressed) {
      newMovementX = -1;
      updateLastInput('button', 'DPadLeft');
    } else if (controller.buttons[GamepadButton.DPadRight as number]?.pressed) {
      newMovementX = 1;
      updateLastInput('button', 'DPadRight');
    }
    
    // Analog stick movement (analog)
    if (typeof mapping.forward === 'number' && 
        typeof mapping.back === 'number' && 
        mapping.forward === mapping.back) {
      // If using analog stick, Y axis is inverted in most controllers
      const analogY = controller.axes[mapping.forward as number] || 0;
      if (Math.abs(analogY) > 0.1) { // Small threshold to avoid drift
        newMovementY = -analogY; // Invert Y axis (negative is forward)
        updateLastInput('axis', 'LeftStickY');
      }
    }
    
    if (typeof mapping.left === 'number' && 
        typeof mapping.right === 'number' && 
        mapping.left === mapping.right) {
      const analogX = controller.axes[mapping.left as number] || 0;
      if (Math.abs(analogX) > 0.1) {
        newMovementX = analogX;
        updateLastInput('axis', 'LeftStickX');
      }
    }
    
    setMovementX(newMovementX);
    setMovementY(newMovementY);
    
    // Camera controls
    const newCameraX = controller.axes[mapping.cameraX as number] || 0;
    const newCameraY = controller.axes[mapping.cameraY as number] || 0;
    
    if (Math.abs(newCameraX) > 0.1) {
      setCameraX(newCameraX);
      updateLastInput('axis', 'RightStickX');
    } else {
      setCameraX(0);
    }
    
    if (Math.abs(newCameraY) > 0.1) {
      // Camera Y is typically inverted for looking up/down
      setCameraY(-newCameraY);
      updateLastInput('axis', 'RightStickY');
    } else {
      setCameraY(0);
    }
    
    // Button controls
    // Jump
    const jumpState = controller.buttons[mapping.jump as number]?.pressed || false;
    if (jumpState !== jumpPressed) {
      setJumpPressed(jumpState);
      if (jumpState) updateLastInput('button', 'Jump');
    }
    
    // Sprint
    const sprintState = controller.buttons[mapping.sprint as number]?.pressed || false;
    if (sprintState !== sprintPressed) {
      setSprintPressed(sprintState);
      if (sprintState) updateLastInput('button', 'Sprint');
    }
    
    // Attack
    const attackState = controller.buttons[mapping.attack as number]?.pressed || false;
    if (attackState !== attackPressed) {
      setAttackPressed(attackState);
      if (attackState) updateLastInput('button', 'Attack');
    }
    
    // Place
    const placeState = controller.buttons[mapping.place as number]?.pressed || false;
    if (placeState !== placePressed) {
      setPlacePressed(placeState);
      if (placeState) updateLastInput('button', 'Place');
    }
    
    // Interact
    const interactState = controller.buttons[mapping.interact as number]?.pressed || false;
    if (interactState !== interactPressed) {
      setInteractPressed(interactState);
      if (interactState) updateLastInput('button', 'Interact');
    }
    
    // Inventory
    const inventoryState = controller.buttons[mapping.inventory as number]?.pressed || false;
    if (inventoryState !== inventoryPressed) {
      setInventoryPressed(inventoryState);
      if (inventoryState) updateLastInput('button', 'Inventory');
    }
    
    // Menu
    const menuState = controller.buttons[mapping.menu as number]?.pressed || false;
    if (menuState !== menuPressed) {
      setMenuPressed(menuState);
      if (menuState) updateLastInput('button', 'Menu');
    }
  };
  
  // Update the last input info for UI/debugging
  const updateLastInput = (type: 'button' | 'axis', name: string) => {
    setLastInputTime(Date.now());
    setLastInputType(type);
    setLastInputName(name);
  };
  
  // Get the primary controller if available
  const primaryController = controllers.get(primaryControllerIndex);
  
  // Vibration helper function
  const vibrate = (duration = 200, strongMagnitude = 1.0, weakMagnitude = 1.0): boolean => {
    if (primaryControllerIndex !== -1) {
      return gamepadManager.vibrate(primaryControllerIndex, duration, strongMagnitude, weakMagnitude);
    }
    return false;
  };
  
  // Get controller type and name helper functions
  const getPrimaryControllerType = (): ControllerType => {
    return primaryController?.type || ControllerType.Unknown;
  };
  
  const getPrimaryControllerName = (): string => {
    if (primaryControllerIndex !== -1) {
      return gamepadManager.getControllerName(primaryControllerIndex);
    }
    return 'No Controller';
  };
  
  // Return the hook state
  return {
    // Connected controllers
    controllers,
    controllerCount: controllers.size,
    primaryController,
    
    // Movement and camera
    movementX,
    movementY,
    cameraX,
    cameraY,
    
    // Button states
    jump: jumpPressed,
    sprint: sprintPressed,
    attack: attackPressed,
    place: placePressed,
    interact: interactPressed,
    inventory: inventoryPressed,
    menu: menuPressed,
    
    // Utility
    isControllerConnected: controllers.size > 0,
    getPrimaryControllerType,
    getPrimaryControllerName,
    vibrate,
    
    // Debug/UI
    lastInputTime,
    lastInputType,
    lastInputName
  };
}