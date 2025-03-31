import React from 'react';

interface CrosshairProps {
  size?: number;
  color?: string;
  thickness?: number;
  gap?: number;
}

/**
 * Renders a simple crosshair in the center of the screen
 */
export default function Crosshair({ 
  size = 16, 
  color = "white", 
  thickness = 2,
  gap = 4
}: CrosshairProps) {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Horizontal line */}
        <div 
          className="absolute top-1/2"
          style={{ 
            backgroundColor: color,
            height: thickness,
            left: 0,
            right: 0,
            marginLeft: gap,
            marginRight: gap,
            transform: 'translateY(-50%)'
          }}
        />
        {/* Vertical line */}
        <div 
          className="absolute left-1/2"
          style={{ 
            backgroundColor: color,
            width: thickness,
            top: 0,
            bottom: 0,
            marginTop: gap,
            marginBottom: gap,
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    </div>
  );
}