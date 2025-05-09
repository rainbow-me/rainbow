import { RecyclerAssetListSection } from '@/components/asset-list/RecyclerAssetList';
import { resolveNameOrAddress } from '@/handlers/web3';
import { buildUniqueTokenList } from '@/helpers/assets';
import { useAccountSettings } from '@/hooks';
import { RootStackParamList } from '@/navigation/types';
import { useLegacyNFTs } from '@/resources/nfts';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import styled from '@/styled-thing';
import { ThemeContextProps, useTheme } from '@/theme';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { ComponentProps, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import ActivityIndicator from '../components/ActivityIndicator';
import { AssetList } from '../components/asset-list';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { CollectibleTokenFamily } from '../components/token-family';
import { AddressPreferencesData, getPreference } from '../model/preferences';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';

const tokenFamilyItem = (item: ComponentProps<typeof CollectibleTokenFamily>) => <CollectibleTokenFamily {...item} />;

const Wrapper = styled(View)({
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) => colors.white,
  borderTopLeftRadius: 15,
  borderTopRightRadius: 15,
  height: '100%',
  overflow: 'hidden',
});

const LoadingWrapper = styled(View)({
  alignItems: 'center',
  height: '100%',
  justifyContent: 'center',
  width: '100%',
});

export default function ShowcaseScreen() {
  const {
    params: { address: addressOrDomain },
  } = useRoute<RouteProp<RootStackParamList, 'ShowcaseSheet'>>();

  const theme = useTheme();

  const [userData, setUserData] = useState<AddressPreferencesData | null | undefined>();
  const [accountAddress, setAcccountAddress] = useState<string>();
  const isReadOnlyWallet = useIsReadOnlyWallet();

  useEffect(() => {
    const init = async () => {
      const address = await resolveNameOrAddress(addressOrDomain);
      if (address) {
        setAcccountAddress(address.toLowerCase());
      }
    };
    init();
  }, [addressOrDomain]);

  useEffect(() => {
    async function fetchShowcase() {
      if (!accountAddress) return;
      const userData = await getPreference('address', accountAddress);
      setUserData(userData);
    }
    accountAddress && fetchShowcase();
  }, [accountAddress]);

  const { network } = useAccountSettings();

  const {
    data: { nfts: uniqueTokens },
    isInitialLoading,
  } = useLegacyNFTs({
    config: {
      enabled: !!accountAddress,
    },
    address: accountAddress ?? '',
  });

  const { layout } = useContext(ModalContext) || {};

  const sections: RecyclerAssetListSection[] = useMemo(
    () => [
      {
        name: 'collectibles',
        data: buildUniqueTokenList(uniqueTokens, userData?.showcase?.ids ?? []),
        header: {
          totalItems: uniqueTokens?.length,
        },
        renderItem: (item: ComponentProps<typeof CollectibleTokenFamily>) =>
          tokenFamilyItem({ ...item, external: true, showcase: true, theme }),
        type: 'big',
      },
    ],
    [uniqueTokens, userData?.showcase?.ids, theme]
  );

  const contextValue = useMemo(
    () => ({
      ...userData,
      address: accountAddress,
      addressOrDomain,
    }),
    [userData, accountAddress, addressOrDomain]
  );

  const loading = userData === null || isInitialLoading;

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout, sections, loading]);

  return (
    <Wrapper testID="showcase-sheet">
      <ShowcaseContext.Provider value={contextValue}>
        {loading ? (
          <LoadingWrapper>
            <ActivityIndicator />
          </LoadingWrapper>
        ) : (
          <AssetList
            disableAutoScrolling
            disableRefreshControl
            disableStickyHeaders
            hideHeader={false}
            isReadOnlyWallet={isReadOnlyWallet}
            isWalletEthZero={false}
            network={network}
            openFamilies
            sections={sections}
            showcase
          />
        )}
      </ShowcaseContext.Provider>
    </Wrapper>
  );
}
