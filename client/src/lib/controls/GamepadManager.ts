// Gamepad Manager for handling controller inputs
// Supports Xbox, PlayStation, and standard gamepads

// Standard button mapping indices for common controllers
export enum GamepadButton {
  // Face buttons (ABXY / Cross Circle Square Triangle)
  A = 0, // Xbox A, PS Cross, Nintendo B
  B = 1, // Xbox B, PS Circle, Nintendo A
  X = 2, // Xbox X, PS Square, Nintendo Y
  Y = 3, // Xbox Y, PS Triangle, Nintendo X
  
  // Shoulder buttons
  L1 = 4, // Left bumper
  R1 = 5, // Right bumper
  L2 = 6, // Left trigger
  R2 = 7, // Right trigger
  
  // Center buttons
  Select = 8, // Back, Share, Minus
  Start = 9,  // Start, Options, Plus
  
  // Thumbstick buttons
  L3 = 10, // Left stick press
  R3 = 11, // Right stick press
  
  // D-pad
  DPadUp = 12,
  DPadDown = 13,
  DPadLeft = 14,
  DPadRight = 15,
  
  // Special buttons (varies by controller)
  Home = 16,     // Xbox Guide, PS Home, Nintendo Home
  TouchPad = 17  // PS4/PS5 TouchPad button
}

// Joystick axes indices
export enum GamepadAxis {
  LeftStickX = 0,
  LeftStickY = 1,
  RightStickX = 2,
  RightStickY = 3
}

// Controller types we can identify
export enum ControllerType {
  Unknown = 'unknown',
  Xbox = 'xbox',
  PlayStation = 'playstation',
  Nintendo = 'nintendo',
  Generic = 'generic'
}

export interface ControllerState {
  id: string;
  index: number;
  type: ControllerType;
  connected: boolean;
  timestamp: number;
  buttons: {
    [key: number]: {
      pressed: boolean;
      value: number;
      touched?: boolean;
    };
  };
  axes: {
    [key: number]: number;
  };
  vibrationActuator?: GamepadHapticActuator;
  mapping: string;
  lastUpdated: number;
}

// Function to detect controller type from ID
function detectControllerType(id: string): ControllerType {
  id = id.toLowerCase();
  
  if (id.includes('xbox') || id.includes('microsoft')) {
    return ControllerType.Xbox;
  } else if (
    id.includes('playstation') || 
    id.includes('ps5') || 
    id.includes('ps4') || 
    id.includes('ps3') || 
    id.includes('dualshock') || 
    id.includes('dualsense')
  ) {
    return ControllerType.PlayStation;
  } else if (
    id.includes('nintendo') || 
    id.includes('switch') || 
    id.includes('joycon') ||
    id.includes('pro controller')
  ) {
    return ControllerType.Nintendo;
  } else {
    return ControllerType.Generic;
  }
}

class GamepadManager {
  private controllers: Map<number, ControllerState> = new Map();
  private listeners: Set<(controllers: Map<number, ControllerState>) => void> = new Set();
  private frameId: number | null = null;
  private deadzone = 0.15; // Ignore small joystick movements
  
  constructor() {
    this.bindEvents();
  }
  
  // Start scanning for controllers
  public start(): void {
    this.scanForControllers();
    
    // Start polling
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.update.bind(this));
    }
    
    // Log initial controllers
    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
          console.log(`Controller connected: ${gamepad.id}`, gamepad);
        }
      }
    }
  }
  
  // Stop polling
  public stop(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  // Set up connection and disconnection events
  private bindEvents(): void {
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
  }
  
  // Add a controller when it's connected
  private handleGamepadConnected(event: GamepadEvent): void {
    console.log(`Controller connected: ${event.gamepad.id}`);
    
    this.scanForControllers();
    
    // Start polling if not already
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.update.bind(this));
    }
  }
  
  // Remove a controller when it's disconnected
  private handleGamepadDisconnected(event: GamepadEvent): void {
    console.log(`Controller disconnected: ${event.gamepad.id}`);
    
    this.controllers.delete(event.gamepad.index);
    this.notifyListeners();
    
    // Stop polling if no controllers left
    if (this.controllers.size === 0 && this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  // Check for new controllers
  public scanForControllers(): void {
    if (!navigator.getGamepads) {
      console.warn('Gamepad API not supported in this browser');
      return;
    }
    
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      
      if (gamepad && !this.controllers.has(gamepad.index)) {
        // Create a new controller state
        const state: ControllerState = {
          id: gamepad.id,
          index: gamepad.index,
          type: detectControllerType(gamepad.id),
          connected: true,
          timestamp: gamepad.timestamp,
          buttons: {},
          axes: {},
          mapping: gamepad.mapping,
          lastUpdated: Date.now(),
          vibrationActuator: (gamepad as any).vibrationActuator
        };
        
        // Initialize buttons
        for (let j = 0; j < gamepad.buttons.length; j++) {
          const button = gamepad.buttons[j];
          state.buttons[j] = {
            pressed: button.pressed,
            value: button.value,
            touched: (button as any).touched
          };
        }
        
        // Initialize axes
        for (let j = 0; j < gamepad.axes.length; j++) {
          state.axes[j] = this.applyDeadzone(gamepad.axes[j]);
        }
        
        this.controllers.set(gamepad.index, state);
      }
    }
    
    this.notifyListeners();
  }
  
  // Main update loop
  private update(): void {
    this.updateControllerStates();
    this.frameId = requestAnimationFrame(this.update.bind(this));
  }
  
  // Update all controller states
  private updateControllerStates(): void {
    if (!navigator.getGamepads) return;
    
    const gamepads = navigator.getGamepads();
    let changed = false;
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      
      if (!gamepad) continue;
      
      const state = this.controllers.get(gamepad.index);
      
      if (state) {
        changed = this.updateControllerState(state, gamepad) || changed;
      }
    }
    
    if (changed) {
      this.notifyListeners();
    }
  }
  
  // Update a single controller's state
  private updateControllerState(state: ControllerState, gamepad: Gamepad): boolean {
    let changed = false;
    
    // Update timestamp
    if (state.timestamp !== gamepad.timestamp) {
      state.timestamp = gamepad.timestamp;
      state.lastUpdated = Date.now();
      changed = true;
    }
    
    // Update buttons
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const existing = state.buttons[i];
      
      if (!existing || 
          existing.pressed !== button.pressed || 
          existing.value !== button.value || 
          existing.touched !== (button as any).touched) {
        
        state.buttons[i] = {
          pressed: button.pressed,
          value: button.value,
          touched: (button as any).touched
        };
        
        changed = true;
      }
    }
    
    // Update axes
    for (let i = 0; i < gamepad.axes.length; i++) {
      const axisValue = this.applyDeadzone(gamepad.axes[i]);
      
      if (state.axes[i] !== axisValue) {
        state.axes[i] = axisValue;
        changed = true;
      }
    }
    
    return changed;
  }
  
  // Apply deadzone to axis values for better control
  private applyDeadzone(value: number): number {
    const absValue = Math.abs(value);
    
    if (absValue < this.deadzone) {
      return 0;
    } else {
      // Normalize the range after deadzone
      return Math.sign(value) * (absValue - this.deadzone) / (1 - this.deadzone);
    }
  }
  
  // Notify all listeners of controller state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.controllers);
    });
  }
  
  // Get the state of all controllers
  public getControllers(): Map<number, ControllerState> {
    return this.controllers;
  }
  
  // Get a specific controller
  public getController(index: number): ControllerState | undefined {
    return this.controllers.get(index);
  }
  
  // Check if a button is pressed on any controller
  public isButtonPressed(button: GamepadButton): boolean {
    const controllers = Array.from(this.controllers.values());
    for (const controller of controllers) {
      if (controller.buttons[button as number]?.pressed) {
        return true;
      }
    }
    return false;
  }
  
  // Check if a button is pressed on a specific controller
  public isButtonPressedOnController(index: number, button: GamepadButton): boolean {
    const controller = this.controllers.get(index);
    return !!controller?.buttons[button as number]?.pressed;
  }
  
  // Get axis value from any controller (returns first non-zero value)
  public getAxisValue(axis: GamepadAxis): number {
    let value = 0;
    
    const controllers = Array.from(this.controllers.values());
    for (const controller of controllers) {
      const axisValue = controller.axes[axis as number] || 0;
      
      if (Math.abs(axisValue) > Math.abs(value)) {
        value = axisValue;
      }
    }
    
    return value;
  }
  
  // Get axis value from a specific controller
  public getAxisValueFromController(index: number, axis: GamepadAxis): number {
    const controller = this.controllers.get(index);
    return controller?.axes[axis] || 0;
  }
  
  // Vibrate/rumble a controller (if supported)
  public vibrate(index: number, duration: number = 200, strongMagnitude: number = 1.0, weakMagnitude: number = 1.0): boolean {
    const controller = this.controllers.get(index);
    
    if (controller?.vibrationActuator) {
      try {
        controller.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration,
          weakMagnitude,
          strongMagnitude
        });
        return true;
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
        return false;
      }
    }
    
    return false;
  }
  
  // Register a listener for controller state changes
  public addListener(callback: (controllers: Map<number, ControllerState>) => void): void {
    this.listeners.add(callback);
  }
  
  // Remove a listener
  public removeListener(callback: (controllers: Map<number, ControllerState>) => void): void {
    this.listeners.delete(callback);
  }
  
  // Get a user-friendly name for a controller
  public getControllerName(index: number): string {
    const controller = this.controllers.get(index);
    
    if (!controller) return 'Unknown Controller';
    
    switch (controller.type) {
      case ControllerType.Xbox:
        return controller.id.includes('xbox one') || controller.id.includes('xbox series') 
          ? 'Xbox Controller' 
          : 'Xbox 360 Controller';
      case ControllerType.PlayStation:
        if (controller.id.includes('ps5') || controller.id.includes('dualsense')) {
          return 'PS5 Controller';
        } else if (controller.id.includes('ps4')) {
          return 'PS4 Controller';
        } else {
          return 'PlayStation Controller';
        }
      case ControllerType.Nintendo:
        return 'Nintendo Controller';
      default:
        return 'Generic Gamepad';
    }
  }
}

// Create a singleton instance of the GamepadManager
export const gamepadManager = new GamepadManager();

// Export a hook to use in React components
export function useGamepads() {
  return gamepadManager;
}