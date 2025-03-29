import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

interface RockProps {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  variant?: number; // For different rock appearances
}

// Preload the model to improve performance
useGLTF.preload('/models/rock.glb');

export default function Rock({ 
  position, 
  scale = [2.5, 2.5, 2.5], 
  rotation = [0, 0, 0],
  variant = 0 
}: RockProps) {
  const modelRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Load rock model
  const { scene: rockModel } = useGLTF('/models/rock.glb') as GLTF & {
    scene: THREE.Group
  };
  
  // Update loading state
  useEffect(() => {
    if (rockModel) {
      setModelLoaded(true);
      console.log("Rock model loaded successfully");
    }
  }, [rockModel]);
  
  // Add slight rotation variation based on variant
  useEffect(() => {
    if (modelRef.current) {
      // Add subtle rotation differences based on variant number
      const variantRotation = [
        rotation[0], 
        rotation[1] + (variant * Math.PI / 6), // Rotate different variants differently
        rotation[2]
      ];
      
      modelRef.current.rotation.set(
        variantRotation[0], 
        variantRotation[1], 
        variantRotation[2]
      );
    }
  }, [variant, rotation, modelRef.current]);
  
  return (
    <group ref={modelRef} position={position} scale={scale}>
      {modelLoaded && rockModel ? (
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#777777" />
          </mesh>
        }>
          <primitive 
            object={rockModel.clone()} 
            castShadow 
            receiveShadow
          />
        </Suspense>
      ) : (
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#777777" />
        </mesh>
      )}
    </group>
  );
}