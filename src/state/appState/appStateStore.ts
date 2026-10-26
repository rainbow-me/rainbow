import { AppState, type AppStateStatus } from 'react-native';

import { createBaseStore } from '@storesjs/stores';

/**
 * The app's current React Native lifecycle state.
 */
export const useAppStateStore = createBaseStore<AppStateStatus>(() => AppState.currentState);

AppState.addEventListener('change', status => useAppStateStore.setState(status));
