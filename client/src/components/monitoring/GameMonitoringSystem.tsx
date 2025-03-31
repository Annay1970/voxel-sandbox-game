import React, { useState } from 'react';
import { MonitoringPanel } from './MonitoringPanel';
import { FloatingMonitor } from './FloatingMonitor';

/**
 * A comprehensive game monitoring system that provides:
 * 1. Real-time performance metrics
 * 2. Error and warning logging
 * 3. Input detection and debugging
 * 4. Detailed monitoring panel (toggle with ~ key)
 * 5. Lightweight floating monitor (toggle with F3 key)
 */
export const GameMonitoringSystem: React.FC = () => {
  const [isFullMonitoringEnabled, setIsFullMonitoringEnabled] = useState(false);
  
  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Enable monitoring by default in development
  // But provide a way to enable it in production through localStorage or query param
  const isEnabled = () => {
    if (isDevelopment) return true;
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gameMonitoringEnabled') === 'true') return true;
      
      // Check URL param
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') === 'true') {
        // Store in localStorage to persist across refreshes
        localStorage.setItem('gameMonitoringEnabled', 'true');
        return true;
      }
    }
    
    return false;
  };
  
  if (!isEnabled()) {
    return null;
  }
  
  return (
    <>
      {/* Always render the floating monitor in dev mode */}
      <FloatingMonitor showByDefault={isDevelopment} />
      
      {/* Full monitoring panel toggled with ~ key */}
      <MonitoringPanel />
    </>
  );
};