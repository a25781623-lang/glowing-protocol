import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/store';

// --- Constants ---
const NODE_COUNT = 80; 

// --- CHANGE 1: Make the bounding box wider (X) than it is tall (Y) or deep (Z) ---
const BOUNDING_BOX_X = 22; // Was 15. This makes it much wider.
const BOUNDING_BOX_Y = 15; // Stays the same.
const BOUNDING_BOX_Z = 8;  // Stays the same.

const CONNECTION_DISTANCE_THRESHOLD = 5; 
const MOUSE_ROTATION_STRENGTH = 1.0; 
const LERP_FACTOR = 0.05;

// --- Node Generation (Memoized) ---
const useBlockchainData = () => {
  return useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const connections: [number, number][] = [];
    const basePositions = new Float32Array(NODE_COUNT * 3);

    // --- CHANGE 2: Use the new X, Y, Z constants for generation ---
    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * BOUNDING_BOX_X;
      const y = (Math.random() - 0.5) * BOUNDING_BOX_Y;
      const z = (Math.random() - 0.5) * BOUNDING_BOX_Z;
      const vec = new THREE.Vector3(x, y, z);
      positions.push(vec);
      vec.toArray(basePositions, i * 3);
    }

    // 2. Generate connections based on distance
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const posA = positions[i];
        const posB = positions[j];
        const dist = posA.distanceTo(posB);

        if (dist < CONNECTION_DISTANCE_THRESHOLD) {
          connections.push([i, j]);
        }
      }
    }

    // 3. Prepare BufferGeometry for LineSegments
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(connections.length * 2 * 3);

    connections.forEach(([start, end], i) => {
      basePositions.subarray(start * 3, start * 3 + 3).forEach((v, j) => {
        linePositions[i * 6 + j] = v;
      });
      basePositions.subarray(end * 3, end * 3 + 3).forEach((v, j) => {
        linePositions[i * 6 + 3 + j] = v;
      });
    });

    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3),
    );

    return { basePositions, lineGeometry, connections };
  }, []);
};

// This hook is our "Single Source of Truth" for node positions
const useNodePositions = (basePositions: Float32Array) => {
  const nodePositionsRef = useRef<THREE.Vector3[]>([]);
  
  if (nodePositionsRef.current.length === 0) {
    for (let i = 0; i < NODE_COUNT; i++) {
      nodePositionsRef.current.push(
        new THREE.Vector3().fromArray(basePositions, i * 3)
      );
    }
  }

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < NODE_COUNT; i++) {
      if (basePositions[i*3+2] !== undefined) {
         const zBob = Math.sin(time * 0.5 + i * 0.1) * 0.1;
         nodePositionsRef.current[i].set(
           basePositions[i * 3],
           basePositions[i * 3 + 1],
           basePositions[i * 3 + 2] + zBob
         );
      }
    }
  });

  return nodePositionsRef.current;
};

// --- Component for Nodes (Instanced) ---
function BlockchainNodes({ nodePositions }: { nodePositions: THREE.Vector3[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { emissiveIntensity, hoveredNode, selectedNode } = useSceneStore();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  useFrame(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < NODE_COUNT; i++) {
      const isHovered = hoveredNode === i;
      const isSelected = selectedNode === i;
      const baseScale = 0.15;
      const scale = isHovered
        ? baseScale * 1.5
        : isSelected
        ? baseScale * 1.3
        : baseScale;

      dummy.position.copy(nodePositions[i]);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      if (isSelected) {
        tempColor.setHSL(0.1, 0.92, 0.5);
      } else if (isHovered) {
        tempColor.setHSL(0.52, 0.94, 0.67);
      } else {
        tempColor.setHSL(0.52, 0.94, 0.57);
      }
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, NODE_COUNT]}
      frustumCulled={false}
    >
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

// --- Component for Lines (Performant) ---
function ConnectionLines({
  lineGeometry,
  connections,
  nodePositions,
}: {
  lineGeometry: THREE.BufferGeometry;
  connections: [number, number][];
  nodePositions: THREE.Vector3[];
}) {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const { linkSpeed } = useSceneStore();
  const linePositionsAttr = useMemo(
    () => lineGeometry.attributes.position as THREE.BufferAttribute,
    [lineGeometry],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.opacity =
        0.3 + Math.sin(state.clock.getElapsedTime() * linkSpeed + 0.5) * 0.2;
    }

    for (let i = 0; i < connections.length; i++) {
      const [start, end] = connections[i];
      const startPos = nodePositions[start];
      const endPos = nodePositions[end];

      linePositionsAttr.setXYZ(i * 2, startPos.x, startPos.y, startPos.z);
      linePositionsAttr.setXYZ(i * 2 + 1, endPos.x, endPos.y, endPos.z);
    }
    linePositionsAttr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={lineGeometry} frustumCulled={false}>
      <lineBasicMaterial
        ref={materialRef}
        color="#00d9ff"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// --- Main Scene Component ---
function Scene({ mouseTracking = false }: { mouseTracking?: boolean }) {
  const { camera } = useThree();
  const { cameraTarget, reducedMotion, meshScale } = useSceneStore();
  const sceneGroupRef = useRef<THREE.Group>(null);

  const targetScale = useRef(1.0);
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));

  const { basePositions, lineGeometry, connections } = useBlockchainData();
  const nodePositions = useNodePositions(basePositions);

  useEffect(() => {
    targetScale.current = meshScale;
  }, [meshScale]);

  useEffect(() => {
    targetLookAt.current.set(...cameraTarget);
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

  useFrame((state, delta) => {
    if (reducedMotion || !sceneGroupRef.current) return;

    const lerpFactor = 1.0 - Math.exp(-LERP_FACTOR * 60 * delta);

    // 1. Animate global mesh scale
    sceneGroupRef.current.scale.lerp(
      new THREE.Vector3(
        targetScale.current,
        targetScale.current,
        targetScale.current,
      ),
      lerpFactor,
    );

    // 2. Animate Camera and Scene Rotation
    const isHeroSection = cameraTarget.every((v) => v === 0);
    // --- CHANGE 3: "Zoom out" camera to see the new wider mesh ---
    const cameraZ = 22; // Was 18

    if (mouseTracking && isHeroSection) {
      targetRotation.current.x = mouseRef.current.y * MOUSE_ROTATION_STRENGTH;
      targetRotation.current.y = mouseRef.current.x * MOUSE_ROTATION_STRENGTH;

      sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        sceneGroupRef.current.rotation.x,
        targetRotation.current.x,
        lerpFactor
      );
      sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        sceneGroupRef.current.rotation.y,
        targetRotation.current.y,
        lerpFactor
      );
      
      camera.position.lerp(new THREE.Vector3(0, 0, cameraZ), lerpFactor);
      camera.lookAt(targetLookAt.current);
    } else {
      camera.position.lerp(new THREE.Vector3(0, 0, cameraZ), lerpFactor);
      sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        sceneGroupRef.current.rotation.x,
        0, 
        lerpFactor
      );
      sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        sceneGroupRef.current.rotation.y,
        0, 
        lerpFactor
      );
      camera.lookAt(targetLookAt.current);
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        // --- CHANGE 4: Update camera default position ---
        position={[0, 0, 22]} 
        fov={60}
        near={0.1}
        far={200}
      />

      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#00d9ff" />

      <group ref={sceneGroupRef}>
        <BlockchainNodes nodePositions={nodePositions} />
        <ConnectionLines
          lineGeometry={lineGeometry}
          connections={connections}
          nodePositions={nodePositions}
        />
      </group>

      <mesh position={[0, 0, -10]} rotation={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial
          color="#0a0e27"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// --- Default Export (Canvas Setup) ---
export default function Canvas3D({
  mouseTracking = false,
}: {
  mouseTracking?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
