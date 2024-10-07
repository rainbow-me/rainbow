import React, { useCallback, useEffect } from 'react';
import { FlatList, InteractionManager, View } from 'react-native';

import deviceUtils from '@/utils/deviceUtils';
import { Row } from '@/components/layout';
import { useDiscoverScreenContext } from '../DiscoverScreenContext';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { useAccountSettings, useHardwareBackOnFocus } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { ethereumUtils } from '@/utils';
import { getPoapAndOpenSheetWithQRHash, getPoapAndOpenSheetWithSecretWord } from '@/utils/poaps';
import { navigateToMintCollection } from '@/resources/reservoir/mints';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { ChainId } from '@/chains/types';
import { chainsIdByName } from '@/chains';
import {
  getFormattedTestId,
  getItemLayout,
  TokenToBuyListItem,
  TokenToBuySectionHeader,
} from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuyList';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ContactRow } from '@/components/contacts';

export const SearchContainer = styled(Row)({
  height: '100%',
});

export default function DiscoverSearch() {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();

  const { isSearching, setIsSearching, cancelSearch, setSearchQuery, searchQuery, searchInputRef, sections, flatListRef } =
    useDiscoverScreenContext();

  const profilesEnabled = useExperimentalFlag(PROFILES);
  const marginBottom = TAB_BAR_HEIGHT;

  useHardwareBackOnFocus(() => {
    cancelSearch();
    // prevent other back handlers from firing
    return true;
  });

  useEffect(() => {
    const checkAndHandlePoaps = async (secretWordOrHash: string) => {
      await getPoapAndOpenSheetWithSecretWord(secretWordOrHash);
      await getPoapAndOpenSheetWithQRHash(secretWordOrHash);
    };
    checkAndHandlePoaps(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    // probably dont need this entry point but seems worth keeping?
    // could do the same with zora, etc
    const checkAndHandleMint = async (seachQueryForMint: string) => {
      if (seachQueryForMint.includes('mint.fun')) {
        const mintdotfunURL = seachQueryForMint.split('https://mint.fun/');
        const query = mintdotfunURL[1];
        const [networkName] = query.split('/');
        let chainId = chainsIdByName[networkName];
        if (!chainId) {
          switch (networkName) {
            case 'op':
              chainId = ChainId.optimism;
              break;
            case 'ethereum':
              chainId = ChainId.mainnet;
              break;
            case 'zora':
              chainId = ChainId.zora;
              break;
            case 'base':
              chainId = ChainId.base;
              break;
          }
        }
        const contractAddress = query.split('/')[1];
        navigateToMintCollection(contractAddress, undefined, chainId);
        setSearchQuery('');
      }
    };
    checkAndHandleMint(searchQuery);
  }, [accountAddress, navigate, searchQuery, setSearchQuery]);

  const handlePress = useCallback(
    (item: TokenToBuyListItem) => {
      if (item.listItemType === 'profileRow') {
        // navigate to Showcase sheet
        searchInputRef?.current?.blur();
        InteractionManager.runAfterInteractions(() => {
          navigate(profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET, {
            address: item.nickname,
            fromRoute: 'DiscoverSearch',
            setIsSearchModeEnabled: setIsSearching,
          });
          if (profilesEnabled) {
            analytics.track('Viewed ENS profile', {
              category: 'profiles',
              ens: item.nickname,
              from: 'Discover search',
            });
          }
        });
      } else if (item.listItemType === 'coinRow') {
        const asset = ethereumUtils.getAccountAsset(item.uniqueId);

        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: asset || item,
          fromDiscover: true,
          type: 'token',
        });
      }
    },
    [navigate, profilesEnabled, searchInputRef, setIsSearching]
  );

  useEffect(() => {
    if (!flatListRef.current?.props.data?.length) {
      return;
    }

    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  }, [flatListRef, isSearching]);

  return (
    <View style={{ height: deviceUtils.dimensions.height - 140 - marginBottom }}>
      <SearchContainer>
        <FlatList
          ref={flatListRef}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingBottom: 16 }}
          data={sections}
          getItemLayout={getItemLayout}
          keyExtractor={item => {
            let id;
            if (item.listItemType === 'header') {
              id = item.id;
            } else if (item.listItemType === 'coinRow' || item.listItemType === 'profileRow') {
              id = item.uniqueId;
            }
            return `${item.listItemType}-${id}`;
          }}
          renderItem={({ item }) => {
            if (item.listItemType === 'header') {
              return <TokenToBuySectionHeader section={{ data: item.data, id: item.id }} />;
            } else if (item.listItemType === 'profileRow') {
              return (
                <ContactRow
                  accountType="contact"
                  address={item.address}
                  color={item.color}
                  nickname={item.nickname}
                  onPress={() => handlePress(item)}
                  showcaseItem={item}
                  testID={`ens-${item.uniqueId}`}
                />
              );
            } else {
              return (
                <CoinRow
                  testID={getFormattedTestId(item.name, item.chainId)}
                  address={item.address}
                  chainId={item.chainId}
                  colors={item.colors}
                  icon_url={item.icon_url}
                  // @ts-expect-error item.favorite does not exist - it does for favorites, need to fix the type
                  isFavorite={item.favorite}
                  mainnetAddress={item.mainnetAddress}
                  name={item.name}
                  onPress={() => handlePress(item)}
                  output
                  symbol={item.symbol}
                  uniqueId={item.uniqueId}
                />
              );
            }
          }}
          style={{ height: '100%' }}
        />
      </SearchContainer>
    </View>
  );
}
