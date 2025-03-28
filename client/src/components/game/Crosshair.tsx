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
  const halfSize = size / 2;
  const halfThickness = thickness / 2;
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Horizontal line */}
      <div 
        className="absolute bg-current"
        style={{
          width: halfSize - gap,
          height: thickness,
          right: `calc(50% + ${gap/2}px)`,
          backgroundColor: color
        }}
      />
      <div 
        className="absolute bg-current"
        style={{
          width: halfSize - gap,
          height: thickness,
          left: `calc(50% + ${gap/2}px)`,
          backgroundColor: color
        }}
      />
      
      {/* Vertical line */}
      <div 
        className="absolute bg-current"
        style={{
          width: thickness,
          height: halfSize - gap,
          bottom: `calc(50% + ${gap/2}px)`,
          backgroundColor: color
        }}
      />
      <div 
        className="absolute bg-current"
        style={{
          width: thickness,
          height: halfSize - gap,
          top: `calc(50% + ${gap/2}px)`,
          backgroundColor: color
        }}
      />
      
      {/* Center dot (optional) */}
      <div 
        className="absolute rounded-full bg-current"
        style={{
          width: thickness * 1.5,
          height: thickness * 1.5,
          backgroundColor: color
        }}
      />
    </div>
  );
}

export default Crosshair;