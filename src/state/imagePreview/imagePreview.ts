import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface ImagePreviewState {
  id: string;
  aspectRatio?: number;
  backgroundMask?: string;
  borderRadius?: number;
  disableAnimations?: boolean;
  disableEnteringWithPinch?: boolean;
  hasShadow?: boolean;
  height?: number;
  hideStatusBar?: boolean;
  hostComponent?: any;
  imageUrl?: string;
  width?: number;
  xOffset?: number;
  yOffset?: number;
  zIndex?: number;
}

export interface ImagePreviewStoreState {
  ids: string[];
  previews: Record<string, ImagePreviewState>;
  
  addPreview: (id: string) => void;
  removePreview: (id: string) => void;
  updatePreview: (id: string, state: Partial<ImagePreviewState>) => void;
  getPreview: (id: string) => ImagePreviewState | undefined;
}

export const useImagePreviewStore = createRainbowStore<ImagePreviewStoreState>(
  (set, get) => ({
    ids: [],
    previews: {},
    
    addPreview: (id: string) => {
      const state = get();
      if (!state.ids.includes(id)) {
        set({
          ids: [...state.ids, id],
          previews: { 
            ...state.previews, 
            [id]: { id } 
          }
        });
      }
    },
    
    removePreview: (id: string) => {
      const state = get();
      const newIds = state.ids.filter(existingId => existingId !== id);
      const newPreviews = { ...state.previews };
      delete newPreviews[id];
      set({ ids: newIds, previews: newPreviews });
    },
    
    updatePreview: (id: string, newState: Partial<ImagePreviewState>) => {
      const state = get();
      const existing = state.previews[id];
      if (existing) {
        set({
          previews: {
            ...state.previews,
            [id]: { ...existing, ...newState }
          }
        });
      }
    },
    
    getPreview: (id: string) => get().previews[id],
  })
);

export const getImagePreviewStore = () => useImagePreviewStore.getState();

// Static function exports for legacy compatibility
export const addPreview = (id: string) => getImagePreviewStore().addPreview(id);
export const removePreview = (id: string) => getImagePreviewStore().removePreview(id);
export const updatePreview = (id: string, state: Partial<ImagePreviewState>) => getImagePreviewStore().updatePreview(id, state);
export const getPreview = (id: string) => getImagePreviewStore().getPreview(id);