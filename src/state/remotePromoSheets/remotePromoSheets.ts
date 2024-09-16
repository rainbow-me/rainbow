import { GetPromoSheetCollectionQuery, PromoSheet } from '@/graphql/__generated__/arc';
import { RainbowError, logger } from '@/logger';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { Address } from 'viem';

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

  isShown: boolean;

  // TODO: FIXME use Address type instead of string
  shownSheetsForAddress: Map<Address | string, string[]>;
  lastShownTimestampForAddress: Map<Address | string, number>;

  showSheet: (id: string, accountAddress: Address | string) => void;

  hasSheetBeenShown: (id: string, accountAddress: Address | string) => boolean;

  setSheet: (id: string, sheet: OmittedPromoSheet) => void;
  setSheets: (data: GetPromoSheetCollectionQuery) => void;
  getSheet: (id: string) => OmittedPromoSheet | undefined;
}

type RemotePromoSheetsStateWithTransforms = Omit<
  Partial<RemotePromoSheetsState>,
  'sheets' | 'sheetsById' | 'shownSheetsForAddress' | 'lastShownTimestampForAddress'
> & {
  sheetsById: Array<string>;
  sheets: Array<[string, OmittedPromoSheet]>;
  shownSheetsForAddress: Array<[string, string[]]>;
  lastShownTimestampForAddress: Array<[string, number]>;
};

function serializeState(state: Partial<RemotePromoSheetsState>, version?: number) {
  try {
    const transformedStateToPersist: RemotePromoSheetsStateWithTransforms = {
      ...state,
      sheetsById: state.sheetsById ? Array.from(state.sheetsById) : [],
      sheets: state.sheets ? Array.from(state.sheets.entries()) : [],
      shownSheetsForAddress: state.shownSheetsForAddress ? Array.from(state.shownSheetsForAddress.entries()) : [],
      lastShownTimestampForAddress: state.lastShownTimestampForAddress ? Array.from(state.lastShownTimestampForAddress.entries()) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError(`[remotePromoSheetsStore]: Failed to serialize state for remote promo sheets storage`), { error });
    throw error;
  }
}

function deserializeState(serializedState: string) {
  let parsedState: { state: RemotePromoSheetsStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError(`[remotePromoSheetsStore]: Failed to parse serialized state from remote promo sheets storage`), {
      error,
    });
    throw error;
  }

  const { state, version } = parsedState;

  let sheetsByIdData = new Set<string>();
  try {
    if (state.sheetsById.length) {
      sheetsByIdData = new Set(state.sheetsById);
    }
  } catch (error) {
    logger.error(new RainbowError(`[remotePromoSheetsStore]: Failed to convert sheetsById from remote promo sheets storage`), { error });
    throw error;
  }

  let sheetsData: Map<string, OmittedPromoSheet> = new Map();
  try {
    if (state.sheets.length) {
      sheetsData = new Map(state.sheets);
    }
  } catch (error) {
    logger.error(new RainbowError(`[remotePromoSheetsStore]: Failed to convert sheets from remote promo sheets storage`), { error });
    throw error;
  }

  let shownSheetsForAddressData = new Map<Address | string, string[]>();
  try {
    if (state.shownSheetsForAddress.length) {
      shownSheetsForAddressData = new Map(state.shownSheetsForAddress);
    }
  } catch (error) {
    logger.error(new RainbowError(`[remotePromoSheetsStore]: Failed to convert shownSheetsForAddress from remote promo sheets storage`), {
      error,
    });
    throw error;
  }

  let lastShownTimestampForAddressData = new Map<Address | string, number>();
  try {
    if (state.lastShownTimestampForAddress.length) {
      lastShownTimestampForAddressData = new Map(state.lastShownTimestampForAddress);
    }
  } catch (error) {
    logger.error(
      new RainbowError(`[remotePromoSheetsStore]: Failed to convert lastShownTimestampForAddress from remote promo sheets storage`),
      { error }
    );
    throw error;
  }

  return {
    state: {
      ...state,
      sheetsById: sheetsByIdData,
      sheets: sheetsData,
      shownSheetsForAddress: shownSheetsForAddressData,
      lastShownTimestampForAddress: lastShownTimestampForAddressData,
    },
    version,
  };
}

export const remotePromoSheetsStore = createRainbowStore<RemotePromoSheetsState>(
  (set, get) => ({
    sheets: new Map<string, OmittedPromoSheet>(),
    sheetsById: new Set<string>(),

    shownSheetsForAddress: new Map<Address, string[]>(),
    lastShownTimestampForAddress: new Map<Address, number>(),

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
      logger.debug('[remotePromoSheetsStore]: Setting sheets', { count: data.promoSheetCollection?.items?.length });
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

    hasSheetBeenShown: (id: string, accountAddress: Address | string) => {
      const { shownSheetsForAddress } = get();
      const shownSheets = shownSheetsForAddress.get(accountAddress);
      return shownSheets?.some(sheet => sheet === id) ?? false;
    },

    showSheet: (id: string, accountAddress: Address | string) => {
      logger.debug(`[remotePromoSheetsStore]: Showing sheet ${id} for address ${accountAddress}`);
      const { sheets, hasSheetBeenShown, shownSheetsForAddress } = get();
      const sheet = sheets.get(id);
      if (!sheet) return;

      if (hasSheetBeenShown(id, accountAddress)) return;

      const shownSheets = new Map<Address | string, string[]>(get().shownSheetsForAddress);
      shownSheets.set(accountAddress, [...(shownSheetsForAddress.get(accountAddress) ?? []), id]);

      const lastShownTimestamp = new Map<Address | string, number>(get().lastShownTimestampForAddress);
      lastShownTimestamp.set(accountAddress, Date.now());

      set({ shownSheetsForAddress: shownSheets, lastShownTimestampForAddress: lastShownTimestamp, isShown: true });
    },

    getSheet: (id: string) => get().sheets.get(id),
  }),
  {
    storageKey: 'remotePromoSheetsStore',
    version: 1,
    serializer: serializeState,
    deserializer: deserializeState,
    partialize: state => ({
      sheetsById: state.sheetsById,
      sheets: state.sheets,
      lastShownTimestampForAddress: state.lastShownTimestampForAddress,
      shownSheetsForAddress: state.shownSheetsForAddress,
    }),
  }
);
