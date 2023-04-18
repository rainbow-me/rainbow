import { useRoute } from '@react-navigation/native';
import useENSUniqueToken from './useENSUniqueToken';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { NFT } from '@/resources/nfts/types';

/** @description Returns a press handler to open an ENS NFT in an expanded state sheet. */
export default function useOpenENSNFTHandler({
  nfts,
  value,
}: {
  nfts?: NFT[];
  value?: string;
}) {
  const { name } = useRoute();
  const { goBack, navigate } = useNavigation();
  const nft = useENSUniqueToken({
    nfts,
    value,
  });
  const onPress = nft
    ? () => {
        if (name === Routes.EXPANDED_ASSET_SHEET) goBack();
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: nft,
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
