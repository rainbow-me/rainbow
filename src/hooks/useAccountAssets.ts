import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assetSelec... Remove this comment to see the full error message
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';

export default function useAccountAssets() {
  const assets = useSelector(sortAssetsByNativeAmountSelector);
  const collectibles = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniqueTokens' does not exist on type 'De... Remove this comment to see the full error message
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  return {
    // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
    ...assets,
    collectibles,
  };
}
