import { create } from 'zustand';

export type AppMode = 'home' | 'handrail' | 'floorplan';

export interface HandrailConfig {
  id: string;
  type: 'straight' | 'L-shaped' | 'vertical';
  length: number; // cm
  height: number; // cm from floor
  diameter: number; // mm
  color: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  name: string;
  visible: boolean;
}

export interface WallSegment {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  height: number;
  sourceImage?: string;
}

export interface FloorPlanData {
  walls: WallSegment[];
  width: number;
  height: number;
  scale: number; // pixels per meter
}

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Handrail mode
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  handrails: HandrailConfig[];
  addHandrail: (config: HandrailConfig) => void;
  updateHandrail: (index: number, config: Partial<HandrailConfig>) => void;
  removeHandrail: (index: number) => void;

  // Floor plan mode
  floorPlanImages: string[];
  addFloorPlanImage: (image: string) => void;
  removeFloorPlanImage: (index: number) => void;
  floorPlan: FloorPlanData | null;
  setFloorPlan: (data: FloorPlanData | null) => void;
  detectedWalls: WallSegment[];
  setDetectedWalls: (walls: WallSegment[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'home',
  setMode: (mode) => set({ mode }),

  uploadedImage: null,
  setUploadedImage: (image) => set({ uploadedImage: image }),
  handrails: [],
  addHandrail: (config) => set((s) => ({ handrails: [...s.handrails, config] })),
  updateHandrail: (index, config) =>
    set((s) => ({
      handrails: s.handrails.map((h, i) => (i === index ? { ...h, ...config } : h)),
    })),
  removeHandrail: (index) =>
    set((s) => ({ handrails: s.handrails.filter((_, i) => i !== index) })),

  floorPlanImages: [],
  addFloorPlanImage: (image) =>
    set((s) => ({ floorPlanImages: [...s.floorPlanImages, image] })),
  removeFloorPlanImage: (index) =>
    set((s) => ({ floorPlanImages: s.floorPlanImages.filter((_, i) => i !== index) })),
  floorPlan: null,
  setFloorPlan: (data) => set({ floorPlan: data }),
  detectedWalls: [],
  setDetectedWalls: (walls) => set({ detectedWalls: walls }),
}));
