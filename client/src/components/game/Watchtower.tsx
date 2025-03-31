import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

interface WatchtowerProps {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

export default function Watchtower({ 
  position, 
  scale = [2.5, 2.5, 2.5], 
  rotation = [0, 0, 0] 
}: WatchtowerProps) {
  // Load the watchtower model
  const { scene: watchtowerModel } = useGLTF('/models/stone_watchtower.glb') as GLTF & {
    scene: THREE.Group
  };
  
  // Track loading state
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = useRef<THREE.Group>(null);
  
  // Update loading state
  useEffect(() => {
    if (watchtowerModel) {
      setModelLoaded(true);
      console.log("Watchtower model loaded successfully");
    }
  }, [watchtowerModel]);
  
  // Preload the model
  useGLTF.preload('/models/stone_watchtower.glb');
  
  // Animate subtle swaying/movement of the tower for visual interest
  useFrame((_, delta) => {
    if (modelRef.current && modelLoaded) {
      // Add very subtle movement to make the tower feel more alive
      modelRef.current.rotation.y += delta * 0.01; // Very slow rotation
    }
  });
  
  return (
    <group 
      position={position}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
      ref={modelRef}
    >
      {modelLoaded && watchtowerModel ? (
        <Suspense fallback={
          <mesh castShadow>
            <cylinderGeometry args={[1, 1.5, 4, 8]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        }>
          <primitive 
            object={watchtowerModel.clone()} 
            castShadow 
            receiveShadow
          />
        </Suspense>
      ) : (
        <mesh castShadow>
          <cylinderGeometry args={[1, 1.5, 4, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      )}
    </group>
  );
}