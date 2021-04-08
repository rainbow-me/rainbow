import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssetList } from '../components/asset-list';
import { PREFS_ENDPOINT } from '../model/preferences';
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

  return (
    <AssetList
      hideHeader={false}
      isEmpty={userData === null || uniqueTokensShowcaseLoading}
      isWalletEthZero={false}
      network={network}
      openFamilies
      renderAheadOffset={
        uniqueTokensShowcase.length * deviceUtils.dimensions.height
      }
      sections={sections}
    />
  );
}
