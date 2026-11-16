import { DataProvider } from 'recyclerlistview';

import { getLayoutProvider } from './getLayoutProvider';
import { type CellTypes } from './ViewTypes';

const listDataProvider = new DataProvider((before: CellTypes, after: CellTypes) => before.uid !== after.uid || before.type !== after.type);

/** Rows and recycler providers shared by wallet, NFT-picker and external-profile lists. */
export type AssetListData = {
  briefSectionsData: CellTypes[];
  dataProvider: DataProvider;
  layoutProvider: ReturnType<typeof getLayoutProvider>;
};

/**
 * Builds providers for prepared rows. A new layout provider delivers current row data;
 * row comparison only needs to detect identity or layout-type changes.
 */
export function createListData(briefSectionsData: CellTypes[], isCoinListEdited: boolean, nftsEnabled: boolean): AssetListData {
  return {
    briefSectionsData,
    dataProvider: listDataProvider.cloneWithRows(briefSectionsData),
    layoutProvider: getLayoutProvider({ briefSectionsData, isCoinListEdited, nftsEnabled }),
  };
}
