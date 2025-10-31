import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/store';

// --- Constants ---
// --- CHANGE 1: Define our new mesh shape ---
const OUTER_NODES = 10;
const INNER_NODES = 5;
const OUTER_RADIUS = 11;
const INNER_RADIUS = 5;
const Z_JITTER = 1.5; // How much 3D depth to add

const NODE_COUNT = OUTER_NODES + INNER_NODES;
const MOUSE_TRACKING_STRENGTH = 4;
const LERP_FACTOR = 0.05;

// --- Node Generation (Memoized) ---
const useBlockchainData = () => {
  return useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const connections: [number, number][] = [];
    const basePositions = new Float32Array(NODE_COUNT * 3);
    const nodeIndices: { outer: number[]; inner: number[] } = {
      outer: [],
      inner: [],
    };

    let i = 0;

    // 1. Generate Outer Ring
    for (let j = 0; j < OUTER_NODES; j++) {
      const theta = (j / OUTER_NODES) * Math.PI * 2;
      const x = OUTER_RADIUS * Math.cos(theta);
      const y = OUTER_RADIUS * Math.sin(theta);
      const z = (Math.random() - 0.5) * Z_JITTER;
      const vec = new THREE.Vector3(x, y, z);
      positions.push(vec);
      vec.toArray(basePositions, i * 3);
      nodeIndices.outer.push(i);
      i++;
    }

    // 2. Generate Inner Ring
    const innerAngleOffset = Math.PI / INNER_NODES; // Stagger the inner ring
    for (let j = 0; j < INNER_NODES; j++) {
      const theta = (j / INNER_NODES) * Math.PI * 2 + innerAngleOffset;
      const x = INNER_RADIUS * Math.cos(theta);
      const y = INNER_RADIUS * Math.sin(theta);
      const z = (Math.random() - 0.5) * Z_JITTER;
      const vec = new THREE.Vector3(x, y, z);
      positions.push(vec);
      vec.toArray(basePositions, i * 3);
      nodeIndices.inner.push(i);
      i++;
    }

    // 3. Generate Connections
    // Connect outer ring
    for (let j = 0; j < nodeIndices.outer.length; j++) {
      connections.push([
        nodeIndices.outer[j],
        nodeIndices.outer[(j + 1) % nodeIndices.outer.length],
      ]);
    }
    // Connect inner ring
    for (let j = 0; j < nodeIndices.inner.length; j++) {
      connections.push([
        nodeIndices.inner[j],
        nodeIndices.inner[(j + 1) % nodeIndices.inner.length],
      ]);
    }
    // Connect outer to inner
    // This connects each outer node to the 2 nearest inner nodes
    nodeIndices.outer.forEach((outerIndex) => {
      const outerPos = positions[outerIndex];
      const sortedInner = nodeIndices.inner
        .map((innerIndex) => ({
          index: innerIndex,
          dist: positions[innerIndex].distanceTo(outerPos),
        }))
        .sort((a, b) => a.dist - b.dist);

      connections.push([outerIndex, sortedInner[0].index]);
      connections.push([outerIndex, sortedInner[1].index]);
    });

    // 4. Prepare BufferGeometry for LineSegments
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(connections.length * 2 * 3);

    connections.forEach(([start, end], i) => {
      positions[start].toArray(linePositions, i * 6);
      positions[end].toArray(linePositions, i * 6 + 3);
    });

    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3),
    );

    return { basePositions, lineGeometry };
  }, []); // Rerun only if node counts change (they don't)
};

// --- Component for Nodes (Instanced) ---
function BlockchainNodes({
  basePositions,
}: {
  basePositions: Float32Array;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { emissiveIntensity, hoveredNode, selectedNode } = useSceneStore();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const nodeCount = basePositions.length / 3;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < nodeCount; i++) {
      const isHovered = hoveredNode === i;
      const isSelected = selectedNode === i;
      const baseScale = 0.15;
      const scale = isHovered
        ? baseScale * 1.5
        : isSelected
        ? baseScale * 1.3
        : baseScale;

      // Set position with slight bobbing
      tempVec.fromArray(basePositions, i * 3);
      // Bobbing is now on Z axis for more 3D feel
      tempVec.z += Math.sin(time * 0.5 + i * 0.1) * 0.1;
      dummy.position.copy(tempVec);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Set color
      if (isSelected) {
        tempColor.setHSL(0.1, 0.92, 0.5); // Warm amber
      } else if (isHovered) {
        tempColor.setHSL(0.52, 0.94, 0.67); // Bright cyan
      } else {
        tempColor.setHSL(0.52, 0.94, 0.57); // Electric cyan
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
      args={[undefined, undefined, nodeCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        emissive="#00d9ff"
        emissiveIntensity={emissiveIntensity} // Driven by store
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
}: {
  lineGeometry: THREE.BufferGeometry;
}) {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const { linkSpeed } = useSceneStore();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.opacity =
        0.3 + Math.sin(state.clock.getElapsedTime() * linkSpeed + 0.5) * 0.2;
    }
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

  // Refs for smooth animation
  const targetScale = useRef(1.0);
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 15));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const mouseRef = useRef({ x: 0, y: 0 });

  // Get node data
  const { basePositions, lineGeometry } = useBlockchainData();

  // Update targets from store
  useEffect(() => {
    targetScale.current = meshScale;
  }, [meshScale]);

  useEffect(() => {
    targetLookAt.current.set(...cameraTarget);
  }, [cameraTarget]);

  // Handle mouse movement for tracking
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

    const lerpFactor = 1.0 - Math.exp(-LERP_FACTOR * 60 * delta); // Frame-delta independent lerp

    // 1. Animate global mesh scale (for hover/click)
    sceneGroupRef.current.scale.lerp(
      new THREE.Vector3(
        targetScale.current,
        targetScale.current,
        targetScale.current,
      ),
      lerpFactor,
    );

    // 2. Animate Camera
    const isHeroSection = cameraTarget.every((v) => v === 0);

    // --- CHANGE 4: Adjust camera Z position to make sure the new mesh fits ---
    const cameraZ = 20;

    if (mouseTracking && isHeroSection) {
      // Mouse tracking in Hero
      targetCameraPos.current.set(
        mouseRef.current.x * MOUSE_TRACKING_STRENGTH,
        mouseRef.current.y * MOUSE_TRACKING_STRENGTH,
        cameraZ,
      );
      camera.position.lerp(targetCameraPos.current, lerpFactor);
      camera.lookAt(targetLookAt.current); // Look at [0,0,0]
    } else {
      // Scroll-based camera movement in Narrative
      camera.position.lerp(new THREE.Vector3(0, 0, cameraZ), lerpFactor); // Reset camera position
      camera.lookAt(targetLookAt.current); // Animate lookAt to the target from the store
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        // --- CHANGE 5: Update default camera position ---
        position={[0, 0, 20]}
        fov={60}
        near={0.1}
        far={200}
      />

      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#00d9ff" />

      <group ref={sceneGroupRef}>
        <BlockchainNodes basePositions={basePositions} />
        <ConnectionLines lineGeometry={lineGeometry} />
      </group>

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
