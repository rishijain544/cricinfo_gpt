import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Text, Stars, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

function CricketBall() {
  const mesh = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y += 0.01;
    mesh.current.rotation.x += 0.005;
    mesh.current.position.y = Math.sin(t) * 0.2 + 2;
  });

  return (
    <group ref={mesh}>
      {/* Red Leather Texture sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#c0392b" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Seam line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.505, 0.02, 16, 100]} />
        <meshStandardMaterial color="#f1f1f1" />
      </mesh>
    </group>
  );
}

function Stadium() {
  const crowdCount = 700;
  const crowd = useMemo(() => {
    const temp = [];
    for (let i = 0; i < crowdCount; i++) {
      const angle = (i / crowdCount) * Math.PI * 2;
      const dist = 18 + Math.random() * 5;
      temp.push([
        Math.cos(angle) * dist,
        0.5 + Math.random() * 2,
        Math.sin(angle) * dist,
        ['#c0392b', '#f39c12', '#27ae60', '#3498db'][Math.floor(Math.random() * 4)]
      ]);
    }
    return temp;
  }, []);

  return (
    <group>
      {/* Outfield / Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[25, 64]} />
        <meshStandardMaterial color="#27ae60" />
      </mesh>

      {/* Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[3, 15]} />
        <meshStandardMaterial color="#d2b48c" />
      </mesh>
      
      {/* Crease Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 6]}>
        <planeGeometry args={[3, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -6]}>
        <planeGeometry args={[3, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Stumps & Bails */}
      {[6, -6].map((z, idx) => (
        <group key={idx} position={[0, 0, z]}>
          {[-0.2, 0, 0.2].map((x, i) => (
            <mesh key={i} position={[x, 0.35, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.7]} />
              <meshStandardMaterial color="#f1c40f" />
            </mesh>
          ))}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.03]} />
            <meshStandardMaterial color="#c0391b" />
          </mesh>
        </group>
      ))}

      {/* Boundary Rope */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[17, 0.1, 16, 100]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Crowd dots */}
      {crowd.map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={pos[3]} />
        </mesh>
      ))}

      {/* Floodlights */}
      {[[-20, 20], [20, 20], [-20, -20], [20, -20]].map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[0.2, 0.4, 20]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 20, 0]}>
            <boxGeometry args={[2, 1, 1]} />
            <meshStandardMaterial color="#555" />
            <pointLight intensity={2} color="white" distance={50} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const Scene3D = () => {
  return (
    <div className="scene-container">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 20]} fov={50} />
        
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />

        <Stadium />
        <CricketBall />
        
        <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000" />
        
        <fog attach="fog" args={['#87ceeb', 10, 60]} />
      </Canvas>
      <div className="scene-overlay"></div>
    </div>
  );
};

export default Scene3D;
