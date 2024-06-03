import { GetPromoSheetCollectionQuery, PromoSheet } from '@/graphql/__generated__/arc';
import { RainbowError, logger } from '@/logger';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type OmittedPromoSheet = Omit<PromoSheet, 'contentfulMetadata' | 'sys'> & {
  sys: {
    id: string;
  };
};

export interface RemotePromoSheetsState {
  sheetsById: Set<string>;
  sheets: Map<string, OmittedPromoSheet>;

  lastShownTimestamp: number;
  isShown: boolean;

  setSheets: (data: GetPromoSheetCollectionQuery) => void;
  getSheet: (id: string) => OmittedPromoSheet | undefined;
}

type RemotePromoSheetsStateWithTransforms = Omit<Partial<RemotePromoSheetsState>, 'sheets' | 'sheetsById'> & {
  sheetsById: Array<string>;
  sheets: Array<[string, OmittedPromoSheet]>;
};

function serializeState(state: Partial<RemotePromoSheetsState>, version?: number) {
  try {
    const transformedStateToPersist: RemotePromoSheetsStateWithTransforms = {
      ...state,
      sheetsById: state.sheetsById ? Array.from(state.sheetsById) : [],
      sheets: state.sheets ? Array.from(state.sheets.entries()) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for remote promo sheets storage'), { error });
    throw error;
  }
}

function deserializeState(serializedState: string) {
  let parsedState: { state: RemotePromoSheetsStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from remote promo sheets storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let sheetsByIdData = new Set<string>();
  try {
    if (state.sheetsById.length) {
      sheetsByIdData = new Set(state.sheetsById);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert sheetsById from remote promo sheets storage'), { error });
    throw error;
  }

  let sheetsData: Map<string, OmittedPromoSheet> = new Map();
  try {
    if (state.sheets.length) {
      sheetsData = new Map(state.sheets);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert sheets from remote promo sheets storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      sheetsById: sheetsByIdData,
      sheets: sheetsData,
    },
    version,
  };
}

export const remotePromoSheetsStore = createRainbowStore<RemotePromoSheetsState>(
  (set, get) => ({
    sheets: new Map<string, OmittedPromoSheet>(),
    sheetsById: new Set<string>(),

    lastShownTimestamp: 0,
    isShown: false,

    setSheets: (data: GetPromoSheetCollectionQuery) => {
      const sheets = (data.promoSheetCollection?.items ?? []) as OmittedPromoSheet[];

      const sheetsData = new Map<string, OmittedPromoSheet>();
      sheets.forEach(sheet => {
        if (sheet) {
          sheetsData.set(sheet.sys.id, sheet);
        }
      });

      set({
        sheets: sheetsData,
        sheetsById: new Set(sheets.map(sheet => sheet.sys.id)),
      });
    },

    getSheet: (id: string) => get().sheets.get(id),
  }),
  {
    storageKey: 'remotePromoSheetsStore',
    version: 1,
    serializer: serializeState,
    deserializer: deserializeState,
  }
);
