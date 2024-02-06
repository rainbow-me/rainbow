import { useRoute } from '@react-navigation/native';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import ActivityIndicator from '../components/ActivityIndicator';
import { AssetList } from '../components/asset-list';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { CollectibleTokenFamily } from '../components/token-family';
import { PREFS_ENDPOINT } from '../model/preferences';
import { rainbowFetch } from '../rainbow-fetch';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { resolveNameOrAddress } from '@/handlers/web3';
import { buildUniqueTokenList } from '@/helpers/assets';
import { useAccountSettings, useWallets } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { useLegacyNFTs } from '@/resources/nfts';

const tokenFamilyItem = item => <CollectibleTokenFamily {...item} uniqueId={item.uniqueId} />;

async function fetchShowcaseForAddress(address) {
  const response = await rainbowFetch(`${PREFS_ENDPOINT}/address`, {
    method: 'get',
    params: {
      address,
    },
  });
  return response.data;
}

const Wrapper = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  borderTopLeftRadius: 15,
  borderTopRightRadius: 15,
  height: '100%',
  overflow: 'hidden',
});

const LoadingWrapper = styled.View({
  alignItems: 'center',
  height: '100%',
  justifyContent: 'center',
  width: '100%',
});

export default function ShowcaseScreen() {
  const { params: { address: addressOrDomain, setIsSearchModeEnabled } = {} } = useRoute();

  const theme = useTheme();

  const [userData, setUserData] = useState(null);
  const [accountAddress, setAcccountAddress] = useState(null);
  const { isReadOnlyWallet } = useWallets();

  useEffect(() => {
    const init = async () => {
      const address = await resolveNameOrAddress(addressOrDomain);
      setAcccountAddress(address?.toLowerCase());
    };
    init();
  }, [addressOrDomain]);

  useEffect(() => {
    async function fetchShowcase() {
      const userData = await fetchShowcaseForAddress(accountAddress);
      setUserData(userData);
    }
    accountAddress && fetchShowcase();
  }, [accountAddress]);

  const { network } = useAccountSettings();

  const {
    data: { nfts: uniqueTokens },
    isInitialLoading,
  } = useLegacyNFTs({
    address: accountAddress ?? '',
  });

  const { layout } = useContext(ModalContext) || {};

  const sections = useMemo(
    () => [
      {
        collectibles: true,
        data: buildUniqueTokenList(uniqueTokens, userData?.data?.showcase?.ids ?? []),
        header: {
          title: '',
          totalItems: uniqueTokens?.length,
          totalValue: '',
        },
        name: 'collectibles',
        renderItem: item => tokenFamilyItem({ ...item, external: true, showcase: true, theme }),
        type: 'big',
      },
    ],
    [uniqueTokens, userData?.data?.showcase?.ids, theme]
  );

  const contextValue = useMemo(
    () => ({
      ...userData,
      address: accountAddress,
      addressOrDomain,
      setIsSearchModeEnabled,
    }),
    [userData, accountAddress, addressOrDomain, setIsSearchModeEnabled]
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
