import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/store';

// Network node positions in 3D space
const generateNodePositions = (count: number): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  const radius = 8;
  
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const phi = Math.acos((i / count) * 2 - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi) - 2;
    positions.push(new THREE.Vector3(x, y, z));
  }
  
  return positions;
};

// Generate connections between nearby nodes
const generateConnections = (positions: THREE.Vector3[], maxDistance: number = 6): [number, number][] => {
  const connections: [number, number][] = [];
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const distance = positions[i].distanceTo(positions[j]);
      if (distance < maxDistance && Math.random() > 0.7) {
        connections.push([i, j]);
      }
    }
  }
  
  return connections;
};

function BlockchainNodes({ nodeCount = 80 }: { nodeCount?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { hoveredNode, selectedNode, emissiveIntensity } = useSceneStore();
  
  const positions = useMemo(() => generateNodePositions(nodeCount), [nodeCount]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    positions.forEach((pos, i) => {
      const isHovered = hoveredNode === i;
      const isSelected = selectedNode === i;
      const baseScale = 0.15;
      const scale = isHovered ? baseScale * 1.5 : isSelected ? baseScale * 1.3 : baseScale;
      
      dummy.position.copy(pos);
      dummy.position.y += Math.sin(time * 0.5 + i * 0.1) * 0.1;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Update colors
      const color = new THREE.Color();
      if (isSelected) {
        color.setHSL(0.1, 0.92, 0.5); // Warm amber
      } else if (isHovered) {
        color.setHSL(0.52, 0.94, 0.67); // Bright cyan
      } else {
        color.setHSL(0.52, 0.94, 0.57); // Electric cyan
      }
      
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodeCount]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        emissive="#00d9ff"
        emissiveIntensity={emissiveIntensity}
        metalness={0.8}
        roughness={0.2}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function ConnectionLines({ nodeCount = 80 }: { nodeCount?: number }) {
  const positions = useMemo(() => generateNodePositions(nodeCount), [nodeCount]);
  const connections = useMemo(() => generateConnections(positions), [positions]);
  const { linkSpeed } = useSceneStore();
  
  const linesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!linesRef.current) return;
    
    linesRef.current.children.forEach((line, i) => {
      const material = (line as THREE.Line).material as THREE.LineBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime() * linkSpeed + i * 0.5) * 0.2;
    });
  });
  
  return (
    <group ref={linesRef}>
      {connections.map(([start, end], i) => {
        const points = [positions[start], positions[end]];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: '#00d9ff',
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(geometry, material);
        
        return <primitive key={i} object={line} />;
      })}
    </group>
  );
}

function Scene({ mouseTracking = false }: { mouseTracking?: boolean }) {
  const { camera } = useThree();
  const { cameraTarget, reducedMotion } = useSceneStore();
  const targetRef = useRef(new THREE.Vector3(...cameraTarget));
  const mouseRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    targetRef.current.set(...cameraTarget);
  }, [cameraTarget]);
  
  useEffect(() => {
    if (!mouseTracking) return;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseTracking]);
  
  useFrame((state) => {
    if (reducedMotion) return;
    
    // Smooth camera target lerp
    const currentTarget = new THREE.Vector3();
    camera.getWorldDirection(currentTarget);
    currentTarget.multiplyScalar(10).add(camera.position);
    currentTarget.lerp(targetRef.current, 0.05);
    
    camera.lookAt(currentTarget);
    
    // Mouse parallax or auto-rotation
    if (mouseTracking && !cameraTarget.some(v => v !== 0)) {
      camera.position.x = 0 + mouseRef.current.x * 2;
      camera.position.y = 0 + mouseRef.current.y * 2;
    } else if (!cameraTarget.some(v => v !== 0)) {
      camera.position.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.5;
      camera.position.y = Math.cos(state.clock.getElapsedTime() * 0.15) * 0.3;
    }
  });
  
  const isMobile = window.innerWidth < 768;
  const nodeCount = isMobile ? 40 : 80;
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={60} near={0.1} far={200} />
      
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#00d9ff" />
      
      <BlockchainNodes nodeCount={nodeCount} />
      <ConnectionLines nodeCount={nodeCount} />
      
      {/* Fog plane for depth */}
      <mesh position={[0, 0, -10]} rotation={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial
          color="#0a0e27"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        enabled={false}
      />
    </>
  );
}

export default function Canvas3D({ mouseTracking = false }: { mouseTracking?: boolean }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    useSceneStore.getState().setReducedMotion(mediaQuery.matches);
    
    const handleChange = () => {
      useSceneStore.getState().setReducedMotion(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <div ref={canvasRef} className="absolute inset-0 w-full h-full">
      <Canvas
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
      >
        <Scene mouseTracking={mouseTracking} />
      </Canvas>
    </div>
  );
}
