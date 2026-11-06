import { type ChainId } from '@/features/network/types/backendNetworks';

import { useCustomGasStore } from '../data/gasSettingsStore';

export const useCustomGasSettings = (chainId: ChainId) => useCustomGasStore(s => s[chainId]);
