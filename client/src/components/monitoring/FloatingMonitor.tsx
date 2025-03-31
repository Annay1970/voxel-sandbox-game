import React, { useState, useEffect } from 'react';
import { KeyboardDebugPanel } from './KeyboardDebugPanel';
import { ControlsMonitor } from '../../lib/monitoring/ControlsMonitor';

interface FloatingMonitorProps {
  showByDefault?: boolean;
}

export const FloatingMonitor: React.FC<FloatingMonitorProps> = ({ 
  showByDefault = false 
}) => {
  const [visible, setVisible] = useState<boolean>(showByDefault);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 10, y: 10 });
  const [dragging, setDragging] = useState<boolean>(false);
  const [lastInput, setLastInput] = useState<{ key: string; time: number } | null>(null);
  
  // Handle input events from ControlsMonitor
  const handleInputDetected = (input: string, state: boolean) => {
    if (state) {
      setLastInput({ key: input, time: Date.now() });
    }
  };
  
  // Toggle visibility with F3 key (common debug key in many games)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        setVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - 150)),
          y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - 20))
        });
      }
    };
    
    const handleMouseUp = () => {
      setDragging(false);
    };
    
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);
  
  // Performance monitoring
  const [fps, setFps] = useState<number>(0);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateFps = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(updateFps);
    };
    
    const animId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animId);
  }, []);
  
  if (!visible) {
    return (
      <>
        <ControlsMonitor onInputDetected={handleInputDetected} />
        <div 
          className="fixed bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded-md text-xs"
          onClick={() => setVisible(true)}
        >
          Debug (F3)
          {lastInput && Date.now() - lastInput.time < 2000 && (
            <span className="ml-2 text-green-400">{lastInput.key}</span>
          )}
        </div>
      </>
    );
  }
  
  return (
    <>
      <ControlsMonitor onInputDetected={handleInputDetected} />
      <div 
        className="fixed bg-black bg-opacity-80 text-white rounded-md shadow-lg overflow-hidden"
        style={{ left: position.x, top: position.y, width: 300 }}
      >
        <div 
          className="bg-gray-800 p-2 flex justify-between items-center cursor-move"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-sm font-semibold">Game Debug Monitor</h3>
          <div className="flex space-x-2">
            <div className="text-xs">
              FPS: <span className={fps < 30 ? 'text-red-400' : 'text-green-400'}>{fps}</span>
            </div>
            <button 
              className="text-xs bg-red-700 px-2 rounded"
              onClick={() => setVisible(false)}
            >
              X
            </button>
          </div>
        </div>
        
        <div className="p-2">
          <KeyboardDebugPanel />
          
          <div className="text-xs mt-4 opacity-60">
            Press F3 to toggle | Drag title to move
          </div>
        </div>
      </div>
    </>
  );
};