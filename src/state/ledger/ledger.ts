import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface LedgerState {
  isReady: boolean;
  readyForPolling: boolean;
  triggerPollerCleanup: boolean;
  deviceId?: string;
  
  setIsReady: (ready: boolean) => void;
  setReadyForPolling: (ready: boolean) => void;
  setTriggerPollerCleanup: (trigger: boolean) => void;
  setDeviceId: (deviceId: string) => void;
}

export const useLedgerStore = createRainbowStore<LedgerState>(
  set => ({
    isReady: false,
    readyForPolling: false,
    triggerPollerCleanup: false,
    deviceId: undefined,
    
    setIsReady: (ready: boolean) => set({ isReady: ready }),
    setReadyForPolling: (ready: boolean) => set({ readyForPolling: ready }),
    setTriggerPollerCleanup: (trigger: boolean) => set({ triggerPollerCleanup: trigger }),
    setDeviceId: (deviceId: string) => set({ deviceId }),
  })
);

export const getLedgerStore = () => useLedgerStore.getState();

// Static function exports for legacy compatibility
export const setLedgerReady = (ready: boolean) => getLedgerStore().setIsReady(ready);
export const setLedgerReadyForPolling = (ready: boolean) => getLedgerStore().setReadyForPolling(ready);
export const setLedgerTriggerPollerCleanup = (trigger: boolean) => getLedgerStore().setTriggerPollerCleanup(trigger);
export const setLedgerDeviceId = (deviceId: string) => getLedgerStore().setDeviceId(deviceId);