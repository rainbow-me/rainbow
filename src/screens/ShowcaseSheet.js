import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
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
  height: 100%;
  background-color: ${({ theme: { colors } }) => colors.white};
`;
export default function ShowcaseScreen() {
  const someRandomAddress = '0x7a3d05c70581bd345fe117c06e45f9669205384f';
  const [userData, setUserData] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUniqueTokens(someRandomAddress));
  }, [dispatch, someRandomAddress]);

  useEffect(() => {
    async function fetchShowcase() {
      const userData = await fetchShowcaseForAddress(someRandomAddress);
      setUserData(userData);
    }
    fetchShowcase();
  }, [someRandomAddress]);

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
      if (someRandomAddress) {
        const ensName = await web3Provider.lookupAddress(someRandomAddress);
        setEnsName(ensName);
        setEnsNameLoading(false);
      }
    }
    resolve();
  }, [someRandomAddress]);

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

  useEffect(() => {
    setTimeout(() => layout(), 300);
  }, [layout, sections]);

  const contextValue = useMemo(
    () => ({
      ...userData,
      address: someRandomAddress,
      ensName,
    }),
    [ensName, userData]
  );
  return (
    <Wrapper>
      <ShowcaseContext.Provider value={contextValue}>
        <AssetList
          disableAutoScrolling
          disableStickyHeaders
          hideHeader={false}
          isEmpty={
            ensNameLoading || userData === null || uniqueTokensShowcaseLoading
          }
          isWalletEthZero={false}
          network={network}
          openFamilies
          sections={sections}
          showcase
        />
      </ShowcaseContext.Provider>
    </Wrapper>
  );
}
