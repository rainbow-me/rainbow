import { AppState, type AppStateStatus } from 'react-native';

import { createBaseStore } from '@storesjs/stores';

/**
 * The native application state, observed for the lifetime of the app.
 */
export const useAppStateStore = createBaseStore<AppStateStatus>(() => AppState.currentState);

AppState.addEventListener('change', status => useAppStateStore.setState(status));
