import { useRoute } from '@react-navigation/native';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/ActivityIndicator' was resol... Remove this comment to see the full error message
import ActivityIndicator from '../components/ActivityIndicator';
import { AssetList } from '../components/asset-list';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/showcase/ShowcaseHeader' was... Remove this comment to see the full error message
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { PREFS_ENDPOINT } from '../model/preferences';
import { rainbowFetch } from '../rainbow-fetch';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../react-native-cool-modals/NativeStackVie... Remove this comment to see the full error message
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { resolveNameOrAddress } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assets' or... Remove this comment to see the full error message
import { buildUniqueTokenList } from '@rainbow-me/helpers/assets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/buildWalle... Remove this comment to see the full error message
import { tokenFamilyItem } from '@rainbow-me/helpers/buildWalletSections';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/openStateSet... Remove this comment to see the full error message
import { removeShowcase } from '@rainbow-me/redux/openStateSettings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/uniqueTokens... Remove this comment to see the full error message
import { fetchUniqueTokens } from '@rainbow-me/redux/uniqueTokens';

async function fetchShowcaseForAddress(address: any) {
  const response = await rainbowFetch(`${PREFS_ENDPOINT}/address`, {
    method: 'get',
    params: {
      address,
    },
  });
  return response.data;
}

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Wrapper = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.white};
  border-top-left-radius: 15;
  border-top-right-radius: 15;
  height: 100%;
  overflow: hidden;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const LoadingWrapper = styled.View`
  align-items: center;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

export default function ShowcaseScreen() {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type '{}'.
  const { params: { address: addressOrDomain } = {} } = useRoute();

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
    dispatch(removeShowcase);
  }, [dispatch]);

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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniqueTokens' does not exist on type 'De... Remove this comment to see the full error message
    state => state.uniqueTokens.uniqueTokensShowcase
  );

  const uniqueTokensShowcaseLoading = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniqueTokens' does not exist on type 'De... Remove this comment to see the full error message
    state => state.uniqueTokens.fetchingUniqueTokensShowcase
  );

  const { layout } = useContext(ModalContext) || {};

  const sections = useMemo(
    () => [
      {
        collectibles: true,
        data: buildUniqueTokenList(
          uniqueTokensShowcase,
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'never'.
          userData?.data?.showcase?.ids ?? []
        ),
        header: {
          title: '',
          totalItems: uniqueTokensShowcase.length,
          totalValue: '',
        },
        name: 'collectibles',
        renderItem: (item: any) =>
          tokenFamilyItem({ ...item, external: true, showcase: true }),
        type: 'big',
      },
    ],
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'never'.
    [uniqueTokensShowcase, userData?.data?.showcase?.ids]
  );

  const contextValue = useMemo(
    () => ({
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...userData,
      address: accountAddress,
      addressOrDomain,
    }),
    [addressOrDomain, accountAddress, userData]
  );

  const loading = userData === null || uniqueTokensShowcaseLoading;

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout, sections, loading]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper testID="showcase-sheet">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ShowcaseContext.Provider value={contextValue}>
        {loading ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <LoadingWrapper>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ActivityIndicator />
          </LoadingWrapper>
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
