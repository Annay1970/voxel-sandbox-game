import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import Creature from './Creature';

export default function DemoCreatures() {
  const [creatureTypes] = useState([
    'zombie', 'skeleton', 'wraith', 'cow', 'sheep', 'pig', 'chicken'
  ]);
  
  const [selectedCreature, setSelectedCreature] = useState('cow');
  
  // Automatically rotate through creatures
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedCreature(prev => {
        const currentIndex = creatureTypes.indexOf(prev);
        const nextIndex = (currentIndex + 1) % creatureTypes.length;
        return creatureTypes[nextIndex];
      });
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(interval);
  }, [creatureTypes]);
  
  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#1a2638' }}>
      <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
        <color attach="background" args={['#1a2638']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[0, 10, 0]} intensity={1} castShadow penumbra={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#3d6e70" />
        </mesh>
        
        {/* Circular platform */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[5, 32]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        
        {/* Showcase the selected creature in the center */}
        <group position={[0, 0, 0]}>
          <Creature
            key={`center-${selectedCreature}`}
            type={selectedCreature}
            position={{ x: 0, y: 0, z: 0 }}
            rotation={{ y: THREE.MathUtils.degToRad(Date.now() * 0.05) }}
            state="idle"
            mood="calm"
            animationState="idle"
            showHealth={true}
            health={8}
            maxHealth={10}
          />
          
          {/* Label for the currently displayed creature */}
          <Html position={[0, 3, 0]}>
            <div style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              {selectedCreature}
            </div>
          </Html>
        </group>
        
        {/* Display all creature types in a circle */}
        {creatureTypes.map((type, index) => {
          const angle = (index / creatureTypes.length) * Math.PI * 2;
          const radius = 4;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          
          // Skip the currently selected creature (it's in the center)
          if (type === selectedCreature) return null;
          
          return (
            <group key={type} position={[x, 0, z]}>
              <Creature
                type={type}
                position={{ x: 0, y: 0, z: 0 }}
                rotation={{ y: Math.atan2(x, z) + Math.PI }}
                state="idle"
                mood="calm"
                animationState="idle"
                showHealth={false}
              />
              
              {/* Small label for each creature */}
              <Html position={[0, 2, 0]}>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'translateX(-50%)',
                  fontSize: '14px'
                }}>
                  {type}
                </div>
              </Html>
            </group>
          );
        })}
        
        <OrbitControls />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: '0 0 10px 10px'
      }}>
        <h1>Creature Models Demo</h1>
        <p>Showcasing all creature types with spotlight on <span style={{fontWeight: 'bold', color: '#ffcc00'}}>{selectedCreature}</span></p>
        <p style={{fontSize: '14px', marginTop: '10px'}}>Click and drag to rotate | Scroll to zoom</p>
      </div>
      
      {/* Creature selection buttons */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        {creatureTypes.map(type => (
          <button 
            key={type}
            onClick={() => setSelectedCreature(type)}
            style={{
              background: selectedCreature === type ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: selectedCreature === type ? 'bold' : 'normal',
              transform: selectedCreature === type ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}