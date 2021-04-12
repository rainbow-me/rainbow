import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import ActivityIndicator from '../components/ActivityIndicator';
import { AssetList } from '../components/asset-list';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { PREFS_ENDPOINT } from '../model/preferences';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { buildUniqueTokenList } from '@rainbow-me/helpers/assets';
import { tokenFamilyItem } from '@rainbow-me/helpers/buildWalletSections';
import { useAccountSettings } from '@rainbow-me/hooks';
import { fetchUniqueTokens } from '@rainbow-me/redux/uniqueTokens';

async function fetchShowcaseForAddress(address) {
  const response = await axios({
    method: 'get',
    params: {
      address,
    },
    url: `${PREFS_ENDPOINT}/address`,
  });
  return response.data;
}

const Wrapper = styled.View`
  border-top-left-radius: 15;
  background-color: red;
  overflow: hidden;
  border-top-right-radius: 15;
  height: 100%;
  background-color: ${({ theme: { colors } }) => colors.white};
`;

const LoadingWrapper = styled.View`
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export default function ShowcaseScreen() {
  const { params: { address: accountAddress } = {} } = useRoute();

  const [userData, setUserData] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUniqueTokens(accountAddress));
  }, [dispatch, accountAddress]);

  useEffect(() => {
    async function fetchShowcase() {
      const userData = await fetchShowcaseForAddress(accountAddress);
      setUserData(userData);
    }
    fetchShowcase();
  }, [accountAddress]);

  const { network } = useAccountSettings();

  const uniqueTokensShowcase = useSelector(
    state => state.uniqueTokens.uniqueTokensShowcase
  );

  const uniqueTokensShowcaseLoading = useSelector(
    state => state.uniqueTokens.fetchingUniqueTokensShowcase
  );

  const [ensName, setEnsName] = useState();
  const [ensNameLoading, setEnsNameLoading] = useState(true);

  useEffect(() => {
    async function resolve() {
      if (accountAddress) {
        const ensName = await web3Provider.lookupAddress(accountAddress);
        setEnsName(ensName);
        setEnsNameLoading(false);
      }
    }
    resolve();
  }, [accountAddress]);

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
        renderItem: item => tokenFamilyItem({ ...item, forceOpen: true }),
        type: 'big',
      },
    ],
    [uniqueTokensShowcase, userData?.data?.showcase?.ids]
  );

  const contextValue = useMemo(
    () => ({
      ...userData,
      address: accountAddress,
      ensName,
    }),
    [accountAddress, ensName, userData]
  );

  const loading =
    ensNameLoading || userData === null || uniqueTokensShowcaseLoading;

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout, sections, loading]);

  return (
    <Wrapper>
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
