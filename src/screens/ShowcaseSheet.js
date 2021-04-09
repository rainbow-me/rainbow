import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AssetList } from '../components/asset-list';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { PREFS_ENDPOINT } from '../model/preferences';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
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
      setUserData({ ...userData, address: someRandomAddress });
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
    <Wrapper>
      <ShowcaseContext.Provider value={userData}>
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
      </ShowcaseContext.Provider>
    </Wrapper>
  );
}
