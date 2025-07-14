import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect } from 'react';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import { SheetHandle } from '../components/sheet';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { Box } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { useNftsStore } from '@/state/nfts/nfts';
import { useWalletSectionsData } from '@/hooks';

export default function SelectUniqueTokenSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.SELECT_UNIQUE_TOKEN_SHEET>>();
  const { goBack } = useNavigation();
  const { layout } = useContext(ModalContext) || {};

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout]);

  const handlePressUniqueToken = useCallback(
    (asset: UniqueAsset) => {
      params.onSelect?.(asset);
      goBack();
    },
    [goBack, params]
  );
  const { briefSectionsData: walletBriefSectionsData } = useWalletSectionsData({
    type: 'select-nft',
  });

  return (
    <Box
      background="body (Deprecated)"
      height="full"
      paddingTop={android ? undefined : '34px (Deprecated)'}
      {...(android && { borderTopRadius: 30 })}
    >
      <Box alignItems="center" justifyContent="center" paddingVertical="10px">
        <SheetHandle />
      </Box>
      <RecyclerAssetList2
        disablePullDownToRefresh
        onPressUniqueToken={handlePressUniqueToken}
        type="select-nft"
        walletBriefSectionsData={walletBriefSectionsData}
        onEndReached={useNftsStore.getState().fetchNextNftCollectionPage}
      />
    </Box>
  );
}
