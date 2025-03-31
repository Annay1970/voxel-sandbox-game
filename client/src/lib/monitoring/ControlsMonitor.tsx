import React, { useEffect, useState, createContext, useContext } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { Controls } from "../stores/useVoxelGame";

interface ControlState {
  [key: string]: boolean | string[];
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  attack: boolean;
  place: boolean;
  activeControls: string[];
}

interface ControlsContextValue {
  controlState: ControlState;
  registerInput: (type: string, state: boolean) => void;
  onInputDetected?: (input: string, state: boolean) => void;
}

const defaultControlState: ControlState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
  attack: false,
  place: false,
  activeControls: []
};

const ControlsContext = createContext<ControlsContextValue>({
  controlState: defaultControlState,
  registerInput: () => {}
});

// Hook to access control monitoring data
export const useControlMonitoring = () => {
  return useContext(ControlsContext).controlState;
};

interface ControlsMonitorProps {
  children?: React.ReactNode;
  onInputDetected?: (input: string, state: boolean) => void;
}

export const ControlsMonitor: React.FC<ControlsMonitorProps> = ({ 
  children,
  onInputDetected
}) => {
  const [controlState, setControlState] = useState<ControlState>(defaultControlState);
  const forward = useKeyboardControls<Controls>(state => state.forward);
  const back = useKeyboardControls<Controls>(state => state.back);
  const left = useKeyboardControls<Controls>(state => state.left);
  const right = useKeyboardControls<Controls>(state => state.right);
  const jump = useKeyboardControls<Controls>(state => state.jump);
  const sprint = useKeyboardControls<Controls>(state => state.sprint);
  const attack = useKeyboardControls<Controls>(state => state.attack);
  const place = useKeyboardControls<Controls>(state => state.place);
  
  // Detect changes in control state from drei's useKeyboardControls
  useEffect(() => {
    const newState: ControlState = {
      forward,
      back,
      left,
      right,
      jump,
      sprint,
      attack,
      place,
      activeControls: []
    };
    
    // Calculate active controls
    const active: string[] = [];
    if (forward) active.push('forward');
    if (back) active.push('back');
    if (left) active.push('left');
    if (right) active.push('right');
    if (jump) active.push('jump');
    if (sprint) active.push('sprint');
    if (attack) active.push('attack');
    if (place) active.push('place');
    
    newState.activeControls = active;
    
    setControlState(newState);
    
    // Check for changes to report
    Object.entries(newState).forEach(([key, value]) => {
      if (key !== 'activeControls' && value !== controlState[key]) {
        onInputDetected?.(key, !!value);
      }
    });
  }, [forward, back, left, right, jump, sprint, attack, place, onInputDetected, controlState]);
  
  // Direct keyboard event listener for fallback detection
  useEffect(() => {
    const keyMap: Record<string, string> = {
      'KeyW': 'forward',
      'ArrowUp': 'forward',
      'KeyS': 'back',
      'ArrowDown': 'back',
      'KeyA': 'left',
      'ArrowLeft': 'left',
      'KeyD': 'right',
      'ArrowRight': 'right',
      'Space': 'jump',
      'ShiftLeft': 'sprint',
      'KeyF': 'attack',
      'KeyE': 'place'
    };
    
    // Track direct key presses for comparison with useKeyboardControls
    const directKeys = new Set<string>();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const control = keyMap[e.code];
      if (control) {
        directKeys.add(control);
        // Report but don't update state (we use useKeyboardControls for that)
        onInputDetected?.(control, true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const control = keyMap[e.code];
      if (control) {
        directKeys.delete(control);
        // Report but don't update state (we use useKeyboardControls for that)
        onInputDetected?.(control, false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Periodically check for discrepancies
    const intervalId = setInterval(() => {
      const directActiveControls = Array.from(directKeys);
      const useKeyboardActiveControls = controlState.activeControls;
      
      // Log discrepancies for debugging
      const directOnly = directActiveControls.filter(
        control => !useKeyboardActiveControls.includes(control)
      );
      
      const keyboardOnly = useKeyboardActiveControls.filter(
        control => !directActiveControls.includes(control)
      );
      
      if (directOnly.length > 0 || keyboardOnly.length > 0) {
        console.warn('Control discrepancy detected:', {
          directOnly,
          keyboardOnly,
          directState: directActiveControls,
          keyboardState: useKeyboardActiveControls
        });
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(intervalId);
    };
  }, [onInputDetected, controlState]);
  
  // Custom input registration (for mobile/custom controls)
  const registerInput = (type: string, state: boolean) => {
    setControlState(prev => {
      if (prev[type] === state) return prev;
      
      const newState = { ...prev, [type]: state };
      
      // Update active controls
      const active = [...prev.activeControls];
      if (state && !active.includes(type)) {
        active.push(type);
      } else if (!state && active.includes(type)) {
        const index = active.indexOf(type);
        if (index >= 0) {
          active.splice(index, 1);
        }
      }
      
      newState.activeControls = active;
      
      // Report
      onInputDetected?.(type, state);
      
      return newState;
    });
  };
  
  return (
    <ControlsContext.Provider value={{ controlState, registerInput, onInputDetected }}>
      {children}
    </ControlsContext.Provider>
  );
};