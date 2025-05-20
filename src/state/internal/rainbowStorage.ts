import { MMKV } from 'react-native-mmkv';

/**
 * @internal
 *
 * #### `rainbowStorage`
 *
 * MMKV instance that holds persisted state for all Zustand stores created with `createRainbowStore`.
 *
 * ---
 * **🚨 Do not write to this instance directly. 🚨**
 *
 * Instead, use `createRainbowStore` or `createQueryStore`.
 */
export const rainbowStorage = new MMKV({ id: 'rainbow-storage' });
