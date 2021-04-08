import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AssetList } from '../components/asset-list';
import { SlackSheet } from '../components/sheet';
import { PREFS_ENDPOINT } from '../model/preferences';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import deviceUtils from '../utils/deviceUtils';
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

const HeaderWrapper = styled.View`
  width: 100%;
  height: 400;
  background-color: blue;
`;

export function Header() {
  return <HeaderWrapper />;
}
export default function ShowcaseScreen() {
  const someRandomAddress = '0x7a3d05c70581bd345fe117c06e45f9669205384f';
  // eslint-disable-next-line no-unused-vars
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

  //console.log(JSON.stringify(sections));

  return (
    <AssetList
      disableStickyHeaders
      hideHeader={false}
      isEmpty={userData === null || uniqueTokensShowcaseLoading}
      isWalletEthZero={false}
      network={network}
      openFamilies
      sections={sections}
      showcase
    />
  );
}
