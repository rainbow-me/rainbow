import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssetList } from '../components/asset-list';
import { SlackSheet } from '../components/sheet';
import { PREFS_ENDPOINT } from '../model/preferences';
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

export default function ShowcaseScreen() {
  const someRandomAddress = '0x7a3d05c70581bd345fe117c06e45f9669205384f';
  // eslint-disable-next-line no-unused-vars
  const [userData, setUserData] = useState();
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

  const sections = useMemo(
    () => [
      {
        collectibles: true,
        data: buildUniqueTokenList(uniqueTokensShowcase, []),
        header: {
          title: '',
          totalItems: uniqueTokensShowcase.length,
          totalValue: '',
        },
        name: 'collectibles',
        renderItem: tokenFamilyItem,
        type: 'big',
      },
    ],
    [uniqueTokensShowcase]
  );

  //console.log(JSON.stringify(sections));

  return (
    <SlackSheet {...(ios && { height: '100%' })}>
      <AssetList
        fetchData={() => {}}
        hideHeader
        isEmpty={false}
        isWalletEthZero={false}
        network={network}
        openFamilies
        sections={sections}
      />
    </SlackSheet>
  );
}
