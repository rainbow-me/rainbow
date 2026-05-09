import format from 'date-fns/format';

import { defaultConfig, defaultConfigValues, LOG_PUSH, type ExperimentalConfigKey } from '@/config/experimental';
import { IS_PROD, IS_STORE_INSTALL } from '@/env';
import { consoleTransport, logger, LogLevel } from '@/logger';
import { push } from '@/logger/logDump';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ExperimentalConfigState = {
  config: Record<ExperimentalConfigKey, boolean>;
  getFlag: (key: ExperimentalConfigKey) => boolean;
  toggleFlag: (key: ExperimentalConfigKey) => void;
};

export const useExperimentalConfigStore = createRainbowStore<ExperimentalConfigState>(
  (set, get) => ({
    config: defaultConfigValues,

    getFlag: key => {
      if (IS_STORE_INSTALL) return defaultConfig[key].value;
      return get().config[key] ?? defaultConfig[key].value;
    },

    toggleFlag: key => {
      set(state => ({ config: { ...state.config, [key]: !state.config[key] } }));
    },
  }),

  { storageKey: 'experimentalConfig' }
);

export function getExperimentalFlag(key: ExperimentalConfigKey): boolean {
  return useExperimentalConfigStore.getState().getFlag(key);
}

/**
 * A developer setting that pushes log lines to an array in-memory so that
 * they can be "dumped" or copied out of the app and analyzed.
 */
if (getExperimentalFlag(LOG_PUSH)) {
  logger.addTransport((level, message, metadata) => {
    push({ timestamp: format(new Date(), 'HH:mm:ss'), level, message, metadata });
  });
  if (IS_PROD) {
    logger.addTransport(consoleTransport);
    logger.level = LogLevel.Debug;
  }
}
