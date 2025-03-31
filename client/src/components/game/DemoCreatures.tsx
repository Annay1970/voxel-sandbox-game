import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Creature from './Creature';

export default function DemoCreatures() {
  const [creatureTypes] = useState([
    'zombie', 'skeleton', 'wraith', 'cow', 'sheep', 'pig', 'chicken'
  ]);
  
  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#87CEEB' }}>
      <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        
        {/* Display all creature types in a row */}
        {creatureTypes.map((type, index) => (
          <Creature
            key={type}
            type={type}
            position={{ x: (index - 3) * 3, y: 0, z: 0 }}
            rotation={{ y: 0 }}
            state="idle"
            mood="calm"
            animationState="idle"
            showHealth={false}
          />
        ))}
        
        <OrbitControls />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10
      }}>
        <h1>Creature Models Demo</h1>
        <p>Showing all creature types with updated Y-axis positions (-0.7)</p>
      </div>
    </div>
  );
}