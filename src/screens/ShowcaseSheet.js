import { useRoute } from '@react-navigation/native';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ActivityIndicator from '../components/ActivityIndicator';
import { AssetList } from '../components/asset-list';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { PREFS_ENDPOINT } from '../model/preferences';
import { rainbowFetch } from '../rainbow-fetch';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { resolveNameOrAddress } from '@rainbow-me/handlers/web3';
import { buildUniqueTokenList } from '@rainbow-me/helpers/assets';
import { tokenFamilyItem } from '@rainbow-me/helpers/buildWalletSections';
import { useAccountSettings, useWallets } from '@rainbow-me/hooks';
import { fetchUniqueTokens } from '@rainbow-me/redux/uniqueTokens';
import styled from '@rainbow-me/styled-components';

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
  const {
    params: { address: addressOrDomain, setIsSearchModeEnabled } = {},
  } = useRoute();

  const [userData, setUserData] = useState(null);
  const [accountAddress, setAcccountAddress] = useState(null);
  const dispatch = useDispatch();
  const { isReadOnlyWallet } = useWallets();

  useEffect(() => {
    const init = async () => {
      const address = await resolveNameOrAddress(addressOrDomain);
      setAcccountAddress(address?.toLowerCase());
    };
    init();
  }, [addressOrDomain]);

  useEffect(() => {
    accountAddress && dispatch(fetchUniqueTokens(accountAddress));
  }, [dispatch, accountAddress]);

  useEffect(() => {
    async function fetchShowcase() {
      const userData = await fetchShowcaseForAddress(accountAddress);
      setUserData(userData);
    }
    accountAddress && fetchShowcase();
  }, [accountAddress]);

  const { network } = useAccountSettings();

  const uniqueTokensShowcase = useSelector(
    state => state.uniqueTokens.uniqueTokensShowcase
  );

  const uniqueTokensShowcaseLoading = useSelector(
    state => state.uniqueTokens.fetchingUniqueTokensShowcase
  );

  const { layout } = useContext(ModalContext) || {};

  const sections = useMemo(
    () => [
      {
        collectibles: true,
        data: buildUniqueTokenList(
          uniqueTokensShowcase,
          userData?.data?.showcase?.ids ?? []
        ),
        header: {
          title: '',
          totalItems: uniqueTokensShowcase.length,
          totalValue: '',
        },
        name: 'collectibles',
        renderItem: item =>
          tokenFamilyItem({ ...item, external: true, showcase: true }),
        type: 'big',
      },
    ],
    [uniqueTokensShowcase, userData?.data?.showcase?.ids]
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

  const loading = userData === null || uniqueTokensShowcaseLoading;

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
