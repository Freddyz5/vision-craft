import { atom } from 'nanostores';

export type DesignViewMode = 'images' | 'canvases';

/**
 * Controls what is displayed in the ImagesTray sidebar.
 * - 'images': Show selected images from explore
 * - 'canvases': Show saved canvases
 */
export const designViewModeStore = atom<DesignViewMode>('images');

export function setDesignViewMode(mode: DesignViewMode): void {
  designViewModeStore.set(mode);
}

export function toggleDesignViewMode(): void {
  const current = designViewModeStore.get();
  const next = current === 'images' ? 'canvases' : 'images';
  designViewModeStore.set(next);
}
