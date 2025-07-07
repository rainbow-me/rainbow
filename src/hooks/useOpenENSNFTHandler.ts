import { useRoute } from '@react-navigation/native';
import useENSUniqueToken from './useENSUniqueToken';
import { UniqueAsset } from '@/entities';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

/** @description Returns a press handler to open an ENS NFT in an expanded state sheet. */
export default function useOpenENSNFTHandler({ uniqueTokens, value }: { uniqueTokens?: UniqueAsset[]; value?: string }) {
  const { name } = useRoute();
  const uniqueToken = useENSUniqueToken({
    uniqueTokens,
    value,
  });
  const onPress = uniqueToken
    ? () => {
        if (name === Routes.EXPANDED_ASSET_SHEET) Navigation.goBack();
        Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
          asset: uniqueToken,
          backgroundOpacity: 1,
          cornerRadius: 'device',
          external: true,
          springDamping: 1,
          topOffset: 0,
          transitionDuration: 0.25,
          type: 'unique_token',
        });
      }
    : undefined;
  return {
    onPress,
  };
}
