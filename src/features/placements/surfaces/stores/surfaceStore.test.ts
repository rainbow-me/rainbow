import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import { getSurfaceStore } from './surfaceStore';

jest.mock('@/env', () => ({
  ...jest.requireActual('@/env'),
  IS_DEV: true,
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => 'app'),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  doc: jest.fn(() => 'surfaceRef'),
  getDoc: jest.fn(),
  getFirestore: jest.fn(() => 'db'),
}));

describe('surfaceStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
    getSurfaceStore('discover').getState().reset(true);
    getSurfaceStore('other').getState().reset(true);
  });

  it('fetches a versioned surface document by id', async () => {
    const surface = {
      id: 'discover',
      version: 1,
      enabled: true,
      items: [],
    };
    (getDoc as jest.Mock).mockResolvedValueOnce({ data: () => surface });

    await getSurfaceStore('discover').getState().fetch(undefined, { force: true });

    expect(getFirestore).toHaveBeenCalledWith('app');
    expect(doc).toHaveBeenCalledWith('db', 'surfaces', 'discover');
    expect(getSurfaceStore('discover').getState().getData()).toEqual(surface);
  });

  it('falls back to the Discover fixture in dev when Firestore has no valid Discover surface', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ data: () => ({ id: 'discover', version: 2 }) });

    await getSurfaceStore('discover').getState().fetch(undefined, { force: true });

    expect(getSurfaceStore('discover').getState().getData()?.id).toBe('discover');
  });

  it('falls back to the Discover fixture in dev when Firestore rejects', async () => {
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error('permission-denied'));

    await getSurfaceStore('discover').getState().fetch(undefined, { force: true });

    expect(getSurfaceStore('discover').getState().getData()?.id).toBe('discover');
  });

  it('does not use the Discover fixture for other surface ids', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ data: () => undefined });

    await getSurfaceStore('other').getState().fetch(undefined, { force: true });

    expect(getSurfaceStore('other').getState().getData()).toBeNull();
  });

  it('rejects malformed surface documents', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      data: () => ({
        id: 'other',
        version: 1,
        enabled: true,
        items: [
          {
            id: 'bad_child',
            enabled: {},
            placement: 'predictions',
            display: 'prediction_tile.carousel',
            destination: ['predictions'],
          },
        ],
      }),
    });

    await getSurfaceStore('other').getState().fetch(undefined, { force: true });

    expect(getSurfaceStore('other').getState().getData()).toBeNull();
  });
});
