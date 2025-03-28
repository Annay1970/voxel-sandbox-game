import React from 'react';

interface CrosshairProps {
  size?: number;
  color?: string;
  thickness?: number;
  gap?: number;
}

export function Crosshair({ 
  size = 20, 
  color = 'white', 
  thickness = 2,
  gap = 4
}: CrosshairProps) {
  // Create CSS for the crosshair lines
  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: color,
  };
  
  // Create center dot style
  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    width: thickness,
    height: thickness,
    backgroundColor: color,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
  };
  
  // Horizontal line style
  const horizontalStyle: React.CSSProperties = {
    ...lineStyle,
    width: size,
    height: thickness,
    left: `calc(50% - ${size / 2}px)`,
    top: '50%',
    transform: 'translateY(-50%)',
  };
  
  // Break the horizontal line into two parts with a gap
  const leftHorizontalStyle: React.CSSProperties = {
    ...horizontalStyle,
    width: (size - gap) / 2,
  };
  
  const rightHorizontalStyle: React.CSSProperties = {
    ...horizontalStyle,
    width: (size - gap) / 2,
    left: `calc(50% + ${gap / 2}px)`,
  };
  
  // Vertical line style
  const verticalStyle: React.CSSProperties = {
    ...lineStyle,
    width: thickness,
    height: size,
    top: `calc(50% - ${size / 2}px)`,
    left: '50%',
    transform: 'translateX(-50%)',
  };
  
  // Break the vertical line into two parts with a gap
  const topVerticalStyle: React.CSSProperties = {
    ...verticalStyle,
    height: (size - gap) / 2,
  };
  
  const bottomVerticalStyle: React.CSSProperties = {
    ...verticalStyle,
    height: (size - gap) / 2,
    top: `calc(50% + ${gap / 2}px)`,
  };
  
  return (
    <div style={{ 
      position: 'absolute', 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      {/* Render the horizontal and vertical lines with gaps */}
      <div style={leftHorizontalStyle} />
      <div style={rightHorizontalStyle} />
      <div style={topVerticalStyle} />
      <div style={bottomVerticalStyle} />
      
      {/* Center dot */}
      <div style={dotStyle} />
    </div>
  );
}

export default Crosshair;