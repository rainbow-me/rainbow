import { useRoute } from '@react-navigation/native';
import useENSUniqueToken from './useENSUniqueToken';
import { UniqueAsset } from '@/entities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

/** @description Returns a press handler to open an ENS NFT in an expanded state sheet. */
export default function useOpenENSNFTHandler({ uniqueTokens, value }: { uniqueTokens?: UniqueAsset[]; value?: string }) {
  const { name } = useRoute();
  const { goBack, navigate } = useNavigation();
  const uniqueToken = useENSUniqueToken({
    uniqueTokens,
    value,
  });
  const onPress = uniqueToken
    ? () => {
        if (name === Routes.EXPANDED_ASSET_SHEET) goBack();
        navigate(Routes.EXPANDED_ASSET_SHEET, {
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
