import React, { useState, useEffect } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { useSkills } from '../../lib/stores/useSkills';

interface TouchButtonProps {
  id: string;
  position: 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'center';
  size?: number;
  icon: string;
  onTouch: () => void;
  onRelease?: () => void;
  color?: string;
  label?: string;
  visible?: boolean;
}

// Virtual joystick/dpad for movement
interface JoystickProps {
  onChange: (x: number, y: number) => void;
  size?: number;
  position: 'left' | 'right';
}

const Joystick: React.FC<JoystickProps> = ({ onChange, size = 120, position }) => {
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState({ x: 0, y: 0 });
  
  const handleStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setOrigin({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    setCurrent({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    setActive(true);
  };
  
  const handleMove = (e: React.TouchEvent) => {
    if (!active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setCurrent({ x, y });
    
    // Calculate joystick values (-1 to 1)
    const deltaX = (x - origin.x) / (size / 2);
    const deltaY = (y - origin.y) / (size / 2);
    
    // Clamp values to a circle
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normalizedX = length > 1 ? deltaX / length : deltaX;
    const normalizedY = length > 1 ? deltaY / length : deltaY;
    
    onChange(normalizedX, normalizedY);
  };
  
  const handleEnd = () => {
    setActive(false);
    onChange(0, 0);
  };
  
  const getKnobPosition = () => {
    if (!active) return { x: size / 2, y: size / 2 };
    
    // Calculate position, but clamp to joystick bounds
    const deltaX = current.x - origin.x;
    const deltaY = current.y - origin.y;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxLength = size / 2 - 20; // 20 = knob radius
    
    if (length > maxLength) {
      const normalizedX = deltaX / length;
      const normalizedY = deltaY / length;
      return {
        x: size / 2 + normalizedX * maxLength,
        y: size / 2 + normalizedY * maxLength
      };
    }
    
    return {
      x: size / 2 + deltaX,
      y: size / 2 + deltaY
    };
  };
  
  const knobPosition = getKnobPosition();
  
  return (
    <div
      className={`touch-joystick ${position === 'left' ? 'left' : 'right'}`}
      style={{
        position: 'absolute',
        bottom: '20px',
        [position]: '20px',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        touchAction: 'none'
      }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      <div
        className="joystick-knob"
        style={{
          position: 'absolute',
          left: `${knobPosition.x - 20}px`,
          top: `${knobPosition.y - 20}px`,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: active ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
          transition: active ? 'none' : 'all 0.2s ease-out'
        }}
      />
    </div>
  );
};

const TouchButton: React.FC<TouchButtonProps> = ({
  id,
  position,
  size = 70,
  icon,
  onTouch,
  onRelease,
  color = 'rgba(255, 255, 255, 0.3)',
  label,
  visible = true
}) => {
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onTouch();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (onRelease) onRelease();
  };
  
  if (!visible) return null;
  
  let positionStyle: React.CSSProperties = {};
  switch (position) {
    case 'left':
      positionStyle = { left: '20px', bottom: '160px' };
      break;
    case 'right':
      positionStyle = { right: '20px', bottom: '160px' };
      break;
    case 'bottom-left':
      positionStyle = { left: '160px', bottom: '20px' };
      break;
    case 'bottom-right':
      positionStyle = { right: '100px', bottom: '100px' };
      break;
    case 'center':
      positionStyle = { left: '50%', bottom: '20px', transform: 'translateX(-50%)' };
      break;
  }
  
  return (
    <div
      id={id}
      className={`touch-button ${position}`}
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid rgba(255, 255, 255, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        color: 'white',
        touchAction: 'none',
        userSelect: 'none',
        ...positionStyle
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {icon}
      {label && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const MobileControls: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [moveDirection, setMoveDirection] = useState({ x: 0, y: 0 });
  const [jumping, setJumping] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [sprinting, setSprinting] = useState(false);
  const [inventory, setShowInventory] = useState(false);
  
  // Access the game state
  const addXp = useSkills(state => state.addXp);
  const blocks = useVoxelGame(state => state.blocks);
  const placeBlock = useVoxelGame(state => state.placeBlock);
  const removeBlock = useVoxelGame(state => state.removeBlock);
  const selectedBlock = useVoxelGame(state => state.selectedBlock);
  const inventoryItems = useVoxelGame(state => state.inventory);
  const selectedInventorySlot = useVoxelGame(state => state.selectedInventorySlot);
  const setSelectedInventorySlot = useVoxelGame(state => state.setSelectedInventorySlot);
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
    };
    
    setIsMobile(checkMobile());
    
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create virtual key events
  useEffect(() => {
    if (!isMobile) return;
    
    // Forward/back keys based on joystick y
    const forwardKey = moveDirection.y < -0.3;
    const backKey = moveDirection.y > 0.3;
    
    // Left/right keys based on joystick x
    const leftKey = moveDirection.x < -0.3;
    const rightKey = moveDirection.x > 0.3;
    
    // Simulate key events
    const simulateKey = (key: string, pressed: boolean) => {
      const eventType = pressed ? 'keydown' : 'keyup';
      const event = new KeyboardEvent(eventType, { key });
      document.dispatchEvent(event);
    };
    
    // Apply movement keys
    simulateKey('w', forwardKey);
    simulateKey('s', backKey);
    simulateKey('a', leftKey);
    simulateKey('d', rightKey);
    simulateKey(' ', jumping); // Space for jump
    simulateKey('Shift', sprinting); // Shift for sprint
    
    // Handle attacking (break blocks)
    if (attacking && selectedBlock) {
      const [x, y, z] = selectedBlock;
      const blockKey = `${x},${y},${z}`;
      const blockType = blocks[blockKey];
      
      if (blockType && blockType !== 'air') {
        // Remove the block
        removeBlock(x, y, z);
        
        // Grant mining XP
        if (blockType === 'stone' || blockType === 'coal') {
          addXp('mining', 5);
        } else if (blockType === 'dirt' || blockType === 'grass' || blockType === 'sand') {
          addXp('farming', 2);
        } else if (blockType === 'wood' || blockType === 'log' || blockType === 'leaves') {
          addXp('woodcutting', 5);
        }
      }
    }
    
    // Handle placing blocks
    if (placing && selectedBlock) {
      const [x, y, z] = selectedBlock;
      
      // Get the block to place from inventory
      const inventoryItem = inventoryItems[selectedInventorySlot];
      
      if (inventoryItem && inventoryItem.count > 0) {
        // Find placement position
        const blockType = blocks[`${x},${y},${z}`];
        if (blockType !== 'air') {
          // Place on top of the selected block
          const placeX = x;
          const placeY = y + 1;
          const placeZ = z;
          
          // Check if the place position is already occupied
          if (blocks[`${placeX},${placeY},${placeZ}`] === 'air') {
            // Place the block
            placeBlock(placeX, placeY, placeZ, inventoryItem.type);
            // Grant building XP
            addXp('building', 2);
          }
        }
      }
    }
    
    return () => {
      // Make sure to release all keys when unmounting
      simulateKey('w', false);
      simulateKey('s', false);
      simulateKey('a', false);
      simulateKey('d', false);
      simulateKey(' ', false);
      simulateKey('Shift', false);
    };
  }, [
    isMobile, 
    moveDirection, 
    jumping, 
    attacking, 
    placing, 
    sprinting, 
    selectedBlock, 
    blocks, 
    inventoryItems, 
    selectedInventorySlot, 
    removeBlock, 
    placeBlock, 
    addXp
  ]);
  
  // Hide if not on mobile
  if (!isMobile) return null;
  
  return (
    <div className="mobile-controls">
      {/* Left joystick for movement */}
      <Joystick
        position="left"
        onChange={(x, y) => setMoveDirection({ x, y })}
      />
      
      {/* Action buttons */}
      <TouchButton
        id="jump-button"
        position="right"
        icon="↑"
        label="Jump"
        onTouch={() => setJumping(true)}
        onRelease={() => setJumping(false)}
        color="rgba(52, 152, 219, 0.7)"
      />
      
      <TouchButton
        id="attack-button"
        position="bottom-right"
        icon="⛏️"
        label="Break"
        size={80}
        onTouch={() => setAttacking(true)}
        onRelease={() => setAttacking(false)}
        color="rgba(231, 76, 60, 0.7)"
      />
      
      <TouchButton
        id="place-button"
        position="bottom-left"
        icon="📦"
        label="Place"
        size={80}
        onTouch={() => setPlacing(true)}
        onRelease={() => setPlacing(false)}
        color="rgba(46, 204, 113, 0.7)"
      />
      
      <TouchButton
        id="sprint-button"
        position="right"
        icon="⚡"
        label="Sprint"
        onTouch={() => setSprinting(true)}
        onRelease={() => setSprinting(false)}
        color="rgba(155, 89, 182, 0.7)"
        visible={true}
      />
      
      <TouchButton
        id="inventory-button"
        position="center"
        icon="🎒"
        label="Inventory"
        onTouch={() => setShowInventory(!inventory)}
        color="rgba(243, 156, 18, 0.7)"
      />
      
      {/* Inventory slot selector */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          borderRadius: '10px'
        }}
      >
        {inventoryItems.slice(0, 5).map((item, index) => (
          <div
            key={index}
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: selectedInventorySlot === index ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)',
              border: '2px solid white',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '20px',
              position: 'relative'
            }}
            onTouchStart={() => setSelectedInventorySlot(index)}
          >
            {item.type === 'grass' && '🟩'}
            {item.type === 'dirt' && '🟫'}
            {item.type === 'stone' && '⬜'}
            {item.type === 'wood' && '🟧'}
            {item.type === 'sand' && '🟨'}
            {item.type === 'leaves' && '🍃'}
            
            {item.count > 0 && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '5px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {item.count}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* In-game help for controls */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '200px',
          display: 'none' // Hidden by default, can be toggled via a button
        }}
      >
        <h3 style={{ margin: '0 0 5px 0' }}>Mobile Controls</h3>
        <ul style={{ margin: '0', paddingLeft: '15px' }}>
          <li>Left joystick: Move</li>
          <li>Blue button: Jump</li>
          <li>Red button: Break blocks</li>
          <li>Green button: Place blocks</li>
          <li>Purple button: Sprint</li>
          <li>Orange button: Inventory</li>
          <li>Tap inventory slots to select</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileControls;