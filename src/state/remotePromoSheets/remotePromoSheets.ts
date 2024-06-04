import { GetPromoSheetCollectionQuery, PromoSheet } from '@/graphql/__generated__/arc';
import { RainbowError, logger } from '@/logger';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type OmittedPromoSheet = Omit<
  PromoSheet,
  | 'accentColor'
  | 'backgroundColor'
  | 'backgroundImage'
  | 'contentfulMetadata'
  | 'header'
  | 'headerImage'
  | 'linkedFrom'
  | 'primaryButtonProps'
  | 'secondaryButtonProps'
  | 'sheetHandleColor'
  | 'subHeader'
  | 'sys'
> & {
  sys: {
    id: string;
  };
  hasBeenShown: boolean;
};

export interface RemotePromoSheetsState {
  sheetsById: Set<string>;
  sheets: Map<string, OmittedPromoSheet>;

  lastShownTimestamp: number;
  isShown: boolean;

  showSheet: (id: string) => void;

  setSheet: (id: string, sheet: OmittedPromoSheet) => void;
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

    setSheet: (id: string, sheet: OmittedPromoSheet) => {
      const newSheets = new Map<string, OmittedPromoSheet>(get().sheets);

      const existingSheet = get().sheets.get(id);
      if (existingSheet) {
        newSheets.set(id, { ...existingSheet, ...sheet });
      } else {
        newSheets.set(id, sheet);
      }

      set({ sheets: newSheets });
    },

    setSheets: (data: GetPromoSheetCollectionQuery) => {
      const sheets = (data.promoSheetCollection?.items ?? []) as OmittedPromoSheet[];

      const sheetsData = new Map<string, OmittedPromoSheet>();
      sheets.forEach(sheet => {
        const existingSheet = get().sheets.get(sheet.sys.id);
        if (existingSheet) {
          sheetsData.set(sheet.sys.id, { ...existingSheet, ...sheet });
        } else {
          sheetsData.set(sheet.sys.id, sheet);
        }
      });

      set({
        sheets: sheetsData,
        sheetsById: new Set(sheets.map(sheet => sheet.sys.id)),
      });
    },

    showSheet: (id: string) => {
      const sheet = get().sheets.get(id);
      if (!sheet) return;

      const newSheets = new Map<string, OmittedPromoSheet>(get().sheets);
      newSheets.set(id, { ...sheet, hasBeenShown: true });

      set({
        isShown: true,
        lastShownTimestamp: Date.now(),
        sheets: newSheets,
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
