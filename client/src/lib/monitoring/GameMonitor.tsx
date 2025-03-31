import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameState {
  // Game-level states
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  currentTime: number; // In-game time
  timeOfDay: number; // 0-24000
  dayCount: number;
  weather: string;
  
  // Player states
  playerPosition: [number, number, number];
  playerRotation: [number, number, number];
  playerHealth: number;
  playerMaxHealth: number;
  playerMovementState: string; // idle, walking, running, jumping, falling
  
  // World states
  currentChunk: string;
  loadedChunks: number;
  loadedEntities: number;
  renderedBlocks: number;
  
  // Performance
  frameRate: number;
  renderTime: number;
  physicsTime: number;
  memoryUsage: number;
  
  // Session
  sessionDuration: number;
  sessionStart: number;
}

interface GameMonitorContextType {
  gameState: GameState;
  updateState: (updates: Partial<GameState>) => void;
  reportError: (error: Error, context?: string) => void;
  reportWarning: (message: string, details?: any) => void;
  reportInfo: (message: string, details?: any) => void;
}

const defaultGameState: GameState = {
  isPlaying: false,
  isPaused: false,
  isLoaded: false,
  currentTime: 0,
  timeOfDay: 6000, // Dawn
  dayCount: 1,
  weather: 'clear',
  
  playerPosition: [0, 0, 0],
  playerRotation: [0, 0, 0],
  playerHealth: 20,
  playerMaxHealth: 20,
  playerMovementState: 'idle',
  
  currentChunk: '0,0',
  loadedChunks: 0,
  loadedEntities: 0,
  renderedBlocks: 0,
  
  frameRate: 0,
  renderTime: 0,
  physicsTime: 0,
  memoryUsage: 0,
  
  sessionDuration: 0,
  sessionStart: Date.now()
};

const GameMonitorContext = createContext<GameMonitorContextType>({
  gameState: defaultGameState,
  updateState: () => {},
  reportError: () => {},
  reportWarning: () => {},
  reportInfo: () => {}
});

// Custom hook to access game state
export const useGameMonitor = () => useContext(GameMonitorContext);

// Provider component
export const GameMonitorProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  
  // Update session duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        sessionDuration: Math.floor((Date.now() - prev.sessionStart) / 1000)
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Log errors to console to be captured by monitoring panel
  const reportError = (error: Error, context?: string) => {
    console.error(`[GAME ERROR] ${context ? `[${context}]` : ''}: ${error.message}`, error);
  };
  
  const reportWarning = (message: string, details?: any) => {
    console.warn(`[GAME WARNING]: ${message}`, details);
  };
  
  const reportInfo = (message: string, details?: any) => {
    console.info(`[GAME INFO]: ${message}`, details);
  };
  
  // Partial update function for gameState
  const updateState = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <GameMonitorContext.Provider value={{
      gameState,
      updateState,
      reportError,
      reportWarning,
      reportInfo
    }}>
      {children}
    </GameMonitorContext.Provider>
  );
};