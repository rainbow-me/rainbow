import { createDerivedStore } from '@storesjs/stores';

import { createListData } from '@/components/asset-list/RecyclerAssetList2/core/createListData';
import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { useNftsEnabled } from '@/features/nfts/data/nftsEnabledStore';
import { useWalletNftRows } from '@/features/nfts/data/walletNftRowsStore';

import { useEditTokensStore } from '../base/editStateStore';
import { useClaimablesSection } from '../sections/useClaimablesSection';
import { useHeaderSection } from '../sections/useHeaderSection';
import { usePerpsSection } from '../sections/usePerpsSection';
import { usePolymarketSection } from '../sections/usePolymarketSection';
import { usePositionsSection } from '../sections/usePositionsSection';
import { useRnbwFeatureCardSection } from '../sections/useRnbwFeatureCardSection';
import { useTokensSection } from '../sections/useTokensSection';

const EMPTY_ROWS: CellTypes[] = [];

const TOKENS_HEADER_SECTION: CellTypes[] = [
  { type: CellType.SPACER, uid: 'tokens-header-spacer-after', height: 10 },
  { type: CellType.TOKENS_HEADER, uid: 'tokens-header' },
];

export const useWalletSectionsData = createDerivedStore(
  $ => {
    // ========== Section Data ==========
    const headerSection = $(useHeaderSection, s => s);
    const featureCardSection = $(useRnbwFeatureCardSection, s => s);
    const perpsSection = $(usePerpsSection, s => s);
    const polymarketSection = $(usePolymarketSection, s => s);
    const tokensSection = $(useTokensSection, s => s);
    const claimablesSection = $(useClaimablesSection, s => s);
    const positionsSection = $(usePositionsSection, s => s);
    const nftsSection = $(useWalletNftRows, s => s);

    // ========== List State ==========
    const isCoinListEdited = $(useEditTokensStore, s => s.isCoinListEdited);
    const nftsEnabled = $(useNftsEnabled, s => s);

    const briefSectionsData = buildWalletSections({
      headerSection,
      featureCardSection,
      perpsSection,
      polymarketSection,
      tokensSection,
      claimablesSection,
      positionsSection,
      nftsSection: isCoinListEdited ? EMPTY_ROWS : nftsSection,
    });

    return createListData(briefSectionsData, isCoinListEdited, nftsEnabled);
  },
  { lockDependencies: true }
);

function containsTokenContent(section: CellTypes[]): boolean {
  return section.some(row => row.type === CellType.COIN || row.type === CellType.COIN_DIVIDER || row.type === CellType.LOADING_ASSETS);
}

function buildWalletSections({
  headerSection,
  featureCardSection,
  perpsSection,
  polymarketSection,
  tokensSection,
  claimablesSection,
  positionsSection,
  nftsSection,
}: {
  headerSection: CellTypes[];
  featureCardSection: CellTypes[];
  perpsSection: ReturnType<typeof usePerpsSection.getState>;
  polymarketSection: ReturnType<typeof usePolymarketSection.getState>;
  tokensSection: CellTypes[];
  claimablesSection: CellTypes[];
  positionsSection: CellTypes[];
  nftsSection: CellTypes[];
}): CellTypes[] {
  const sections = [headerSection, featureCardSection];

  if (perpsSection.hasContent) {
    sections.push(perpsSection.section);
    if (polymarketSection.hasContent) sections.push(polymarketSection.section);
    if (containsTokenContent(tokensSection)) sections.push(TOKENS_HEADER_SECTION);
    sections.push(tokensSection);
    if (!polymarketSection.hasContent) sections.push(polymarketSection.section);
  } else {
    sections.push(tokensSection, perpsSection.section, polymarketSection.section);
  }

  sections.push(claimablesSection, positionsSection, nftsSection);

  let rowCount = 0;
  for (const section of sections) rowCount += section.length;

  const rows = new Array<CellTypes>(rowCount);
  let index = 0;
  for (const section of sections) {
    for (const row of section) {
      rows[index] = row;
      index += 1;
    }
  }
  return rows;
}
