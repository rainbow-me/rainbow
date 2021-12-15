import { find } from 'lodash';
import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { add, convertAmountToNativeDisplay } from './utilities';

const sortedAssetsSelector = state => state.sortedAssets;
const hiddenCoinsSelector = state => state.hiddenCoins;
const isCoinListEditedSelector = state => state.isCoinListEdited;
const isLoadingAssetsSelector = state => state.isLoadingAssets;
const nativeCurrencySelector = state => state.nativeCurrency;
const pinnedCoinsSelector = state => state.pinnedCoins;
const savingsSelector = state => state.savings;
const showcaseTokensSelector = state => state.showcaseTokens;
const uniqueTokensSelector = state => state.uniqueTokens;
const uniswapSelector = state => state.uniswap;
const uniswapTotalSelector = state => state.uniswapTotal;

const buildBriefWalletSections = (
  balanceSection,
  savings,
  uniqueTokenFamiliesSection,
  uniswapSection
) => {
  const sections = [
    balanceSection,
    savings,
    uniswapSection,
    uniqueTokenFamiliesSection,
  ];

  const filteredSections = sections
    .filter(section => section.length !== 0)
    .flat(1);
  return filteredSections;
};

const withBriefUniswapSection = (uniswap, uniswapTotal, nativeCurrency) => {
  const pools = uniswap.map(pool => ({
    address: pool.address,
    type: 'UNISWAP_POOL',
    uid: 'pool-' + pool.address,
  }));

  if (pools.length > 0) {
    return [
      {
        type: 'POOLS_HEADER',
        uid: 'pools-header',
        value: convertAmountToNativeDisplay(uniswapTotal, nativeCurrency),
      },
      ...pools,
    ];
  }
  return [];
};

const withBriefBalanceSavingsSection = savings => {
  let totalUnderlyingNativeValue = '0';
  for (let saving of savings) {
    const { underlyingBalanceNativeValue } = saving;
    totalUnderlyingNativeValue = add(
      totalUnderlyingNativeValue,
      underlyingBalanceNativeValue || 0
    );
  }
  const addresses = savings?.map(asset => asset.cToken.address);
  return [
    {
      type: 'SAVINGS_HEADER_SPACE_BEFORE',
      uid: 'savings-header-space-before',
    },
    {
      type: 'SAVINGS_HEADER',
      uid: 'savings-header',
      value: totalUnderlyingNativeValue,
    },
    ...addresses.map(address => ({
      address,
      type: 'SAVINGS',
      uid: 'savings-' + address,
    })),
  ];
};

const withBriefBalanceSection = (
  sortedAssets,
  isLoadingAssets,
  nativeCurrency,
  isCoinListEdited,
  pinnedCoins,
  hiddenCoins,
  collectibles,
  savingsSection,
  uniswapTotal
) => {
  const { briefAssets, totalBalancesValue } = buildBriefCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins,
    true,
    !collectibles.length
  );

  const savingsTotalValue = find(
    savingsSection,
    item => item.uid === 'savings-header'
  );

  const totalBalanceWithSavingsValue = add(
    totalBalancesValue,
    savingsTotalValue?.value ?? 0
  );

  const totalBalanceWithAllSectionValues = add(
    totalBalanceWithSavingsValue,
    uniswapTotal
  );

  const totalValue = convertAmountToNativeDisplay(
    totalBalanceWithAllSectionValues,
    nativeCurrency
  );

  return [
    {
      type: 'ASSETS_HEADER',
      value: totalValue,
    },
    {
      type: 'ASSETS_HEADER_SPACE_AFTER',
      uid: 'assets-header-space-after',
    },
    ...(isLoadingAssets
      ? [{ type: 'LOADING_ASSETS', uid: 'loadings-asset' }]
      : briefAssets),
  ];
};

const briefUniqueTokenDataSelector = createSelector(
  [uniqueTokensSelector, showcaseTokensSelector],
  buildBriefUniqueTokenList
);

const briefBalanceSavingsSectionSelector = createSelector(
  [savingsSelector],
  withBriefBalanceSavingsSection
);

const briefUniswapSectionSelector = createSelector(
  [uniswapSelector, uniswapTotalSelector, nativeCurrencySelector],
  withBriefUniswapSection
);

const briefBalanceSectionSelector = createSelector(
  [
    sortedAssetsSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
    isCoinListEditedSelector,
    pinnedCoinsSelector,
    hiddenCoinsSelector,
    uniqueTokensSelector,
    briefBalanceSavingsSectionSelector,
    uniswapTotalSelector,
  ],
  withBriefBalanceSection
);

export const buildBriefWalletSectionsSelector = createSelector(
  [
    briefBalanceSectionSelector,
    briefBalanceSavingsSectionSelector,
    briefUniqueTokenDataSelector,
    briefUniswapSectionSelector,
  ],
  buildBriefWalletSections
);
