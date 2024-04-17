import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect } from 'react';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import { SheetHandle } from '../components/sheet';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { Box } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { useWalletSectionsData } from '@/hooks';

export default function SelectUniqueTokenSheet() {
  const { params } = useRoute<any>();
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
      />
    </Box>
  );
}
