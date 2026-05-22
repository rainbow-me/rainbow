import { type Placement, type PlacementItem } from '@/features/placements/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { QueryStatuses } from '@/state/internal/queryStore/types';

import { usePlacementsStore } from '../placementsStore';
import { createPlacementStore } from './createPlacementStore';

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => 'app'),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getFirestore: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

type ResolvedToken = {
  id: string;
  label: string;
};

type HydratedPlacementItem = PlacementItem & {
  token: ResolvedToken;
};

const TOKEN_PLACEMENT_ID = 'tokens_top';

const useEnabledStateStore = createRainbowStore(() => ({
  enabled: true,
}));

const useResolverStateStore = createRainbowStore(() => ({
  isLoading: false,
  tokensById: {} as Record<string, ResolvedToken>,
}));

const useEnabledStore = createDerivedStore($ => $(useEnabledStateStore, state => state.enabled), { fastMode: true });

const useTestPlacementStore = createPlacementStore({
  placementId: TOKEN_PLACEMENT_ID,
  source: 'rainbow',
  enabled: useEnabledStore,
  select: ($, placementItems) => {
    const { isLoading, tokensById } = $(useResolverStateStore);
    const items: HydratedPlacementItem[] = [];

    for (const item of placementItems) {
      const token = tokensById[item.id];
      if (token) items.push({ ...item, token });
    }

    return {
      isLoading,
      items,
    };
  },
});

describe('createPlacementStore', () => {
  afterEach(() => {
    useEnabledStateStore.setState({ enabled: true });
    useResolverStateStore.setState({ isLoading: false, tokensById: {} });
    usePlacementsStore.setState({
      placementsById: {},
      status: QueryStatuses.Idle,
    });
    usePlacementsStore.getState().reset(true);
  });

  it('returns an empty result when the feature gate is off', () => {
    useEnabledStateStore.setState({ enabled: false });
    usePlacementsStore.setState({ placementsById: { [TOKEN_PLACEMENT_ID]: createTokenPlacement() } });
    useResolverStateStore.setState({ tokensById: { tokenA: createToken('tokenA') } });

    expect(useTestPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });

  it('keeps resolver dependencies subscribed while the feature gate is off', async () => {
    useEnabledStateStore.setState({ enabled: false });
    usePlacementsStore.setState({ placementsById: { [TOKEN_PLACEMENT_ID]: createTokenPlacement() } });

    const select = jest.fn(($, placementItems: PlacementItem[]) => {
      const { tokensById } = $(useResolverStateStore);
      const items: HydratedPlacementItem[] = [];

      for (const item of placementItems) {
        const token = tokensById[item.id];
        if (token) items.push({ ...item, token });
      }

      return {
        isLoading: false,
        items,
      };
    });

    const useDisabledPlacementStore = createPlacementStore({
      placementId: TOKEN_PLACEMENT_ID,
      source: 'rainbow',
      enabled: useEnabledStore,
      select,
    });

    const unsubscribe = useDisabledPlacementStore.subscribe(() => undefined);
    await flushMicrotasks();
    select.mockClear();

    useResolverStateStore.setState({ tokensById: { tokenA: createToken('tokenA') } });
    await flushMicrotasks();

    expect(select).toHaveBeenCalledTimes(1);
    expect(useDisabledPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });

    unsubscribe();
  });

  it('hides the placement until at least one placement item hydrates', () => {
    usePlacementsStore.setState({ placementsById: { [TOKEN_PLACEMENT_ID]: createTokenPlacement() } });

    expect(useTestPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });

  it('shows loading while placements have not started fetching', () => {
    usePlacementsStore.setState({
      placementsById: {},
      status: QueryStatuses.Idle,
    });

    expect(useTestPlacementStore.getState()).toEqual({
      isLoading: true,
      items: [],
      placement: undefined,
    });
  });

  it('composes loading state from placements and the resolver', () => {
    usePlacementsStore.setState({
      placementsById: { [TOKEN_PLACEMENT_ID]: createTokenPlacement() },
      status: QueryStatuses.Loading,
    });

    expect(useTestPlacementStore.getState().isLoading).toBe(true);

    usePlacementsStore.setState({ status: QueryStatuses.Idle });
    useResolverStateStore.setState({ isLoading: true });

    expect(useTestPlacementStore.getState().isLoading).toBe(true);

    useResolverStateStore.setState({
      isLoading: true,
      tokensById: { tokenA: createToken('tokenA') },
    });

    expect(useTestPlacementStore.getState()).toMatchObject({
      isLoading: false,
      placement: expect.objectContaining({ id: TOKEN_PLACEMENT_ID }),
    });
  });

  it('uses stable equality for equivalent hydrated placement results', async () => {
    usePlacementsStore.setState({ placementsById: { [TOKEN_PLACEMENT_ID]: createTokenPlacement() } });
    useResolverStateStore.setState({ tokensById: { tokenA: createToken('tokenA') } });

    const watcher = jest.fn();
    const unsubscribe = useTestPlacementStore.subscribe(watcher);
    await flushMicrotasks();

    useResolverStateStore.setState(state => ({
      tokensById: {
        ...state.tokensById,
      },
    }));
    await flushMicrotasks();

    expect(watcher).toHaveBeenCalledTimes(0);

    useResolverStateStore.setState({ tokensById: { tokenA: createToken('tokenA', 'Token A+') } });
    await flushMicrotasks();

    expect(watcher).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

function createTokenPlacement(): Placement {
  return {
    id: TOKEN_PLACEMENT_ID,
    source: 'rainbow',
    type: 'token',
    version: 2,
    updatedAt: '2026-05-15T00:00:00.000Z',
    items: [{ id: 'tokenA' }],
  };
}

function createToken(id: string, label = 'Token A'): ResolvedToken {
  return { id, label };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}
