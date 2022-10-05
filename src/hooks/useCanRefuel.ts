import { useSelector } from 'react-redux';
import { Network } from '@/helpers';
import { AppState } from '@/redux/store';

import { GasFee, LegacyGasFee, SelectedGasFee } from '@/entities';
import { isL2Network } from '@/handlers/web3';
import { ethereumUtils } from '@/utils';

const getGasFeeAmount = ({
  network,
  txFee,
}: {
  network: Network;
  txFee: LegacyGasFee | GasFee;
}) => {
  const isL2 = isL2Network(network);
  const txFeeValue = isL2
    ? (txFee as LegacyGasFee)?.estimatedFee
    : (txFee as GasFee)?.maxFee;

  const txFeeAmount = txFeeValue?.value?.amount;

  return txFeeAmount;
};

export default function useCanRefuel() {
  const gasData: {
    selectedGasFee: SelectedGasFee;
    txNetwork: Network;
  } = useSelector(({ gas: { selectedGasFee, txNetwork } }: AppState) => ({
    selectedGasFee,
    txNetwork,
  }));

  const txGasAmount = getGasFeeAmount({
    network: gasData?.txNetwork,
    txFee: gasData?.selectedGasFee?.gasFee,
  });

  const networkNativeAsset = ethereumUtils.getNetworkNativeAsset(
    gasData?.txNetwork
  );

  const nativeAssetBalance = networkNativeAsset?.balance?.amount || 0;
  console.log('from useCanRefuel', txGasAmount, '.....', nativeAssetBalance);
}
