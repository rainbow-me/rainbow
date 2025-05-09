import { MMKV } from 'react-native-mmkv';

/**
 * @internal
 *
 * #### `rainbowStorage`
 *
 * MMKV instance that holds persisted state for:
 * - All Zustand stores created with `createRainbowStore`.
 * - All Jotai atoms created with `persistAtom`, under keys prefixed with `'jotai-'`.
 *
 * ---
 * **🚨 Do not write to this instance directly. 🚨**
 *
 * Instead, use `createRainbowStore` or `persistAtom` to create a persisted store or atom.
 */
export const rainbowStorage = new MMKV({ id: 'rainbow-storage' });
