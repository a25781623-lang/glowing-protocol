import { create } from 'zustand';

interface SceneState {
  hoveredNode: number | null;
  selectedNode: number | null;
  linkSpeed: number;
  emissiveIntensity: number;
  cameraTarget: [number, number, number];
  reducedMotion: boolean;
  setHoveredNode: (id: number | null) => void;
  setSelectedNode: (id: number | null) => void;
  setLinkSpeed: (speed: number) => void;
  setEmissiveIntensity: (intensity: number) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  hoveredNode: null,
  selectedNode: null,
  linkSpeed: 1.0,
  emissiveIntensity: 1.0,
  cameraTarget: [0, 0, 0],
  reducedMotion: false,
  setHoveredNode: (id) => set({ hoveredNode: id }),
  setSelectedNode: (id) => set({ selectedNode: id }),
  setLinkSpeed: (speed) => set({ linkSpeed: speed }),
  setEmissiveIntensity: (intensity) => set({ emissiveIntensity: intensity }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
}));
