import { ETH_ADDRESS, Quote } from '@rainbow-me/swaps';
import lang from 'i18n-js';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { SwapModalField } from '@/redux/swap';
import {
  WETH_ADDRESS,
  WDEGEN_DEGEN_CHAIN_ADDRESS,
  WMATIC_POLYGON_ADDRESS,
  WBNB_BSC_ADDRESS,
  WETH_ARBITRUM_ADDRESS,
  WETH_ZORA_ADDRESS,
} from '@/references';
import { fromWei, updatePrecisionToDisplay } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { computeSlippageAdjustedAmounts, Field } from '@/handlers/swap';

export default function useSwapAdjustedAmounts(tradeDetails: Quote) {
  const inputCurrency = useSelector((state: AppState) => state.swap.inputCurrency);
  const outputCurrency = useSelector((state: AppState) => state.swap.outputCurrency);
  const inputAsExact = useSelector((state: AppState) => state.swap.independentField !== SwapModalField.output);
  const slippageInBips = useSelector((state: AppState) => state.swap.slippageInBips);
  const receivedSoldLabel = inputAsExact
    ? lang.t('expanded_state.swap_details.minimum_received')
    : lang.t('expanded_state.swap_details.maximum_sold');
  const adjustedAmounts = computeSlippageAdjustedAmounts(tradeDetails, slippageInBips);
  let amountReceivedSold = inputAsExact ? adjustedAmounts[Field.OUTPUT] : adjustedAmounts[Field.INPUT];
  const address = inputAsExact
    ? outputCurrency.mainnet_address || outputCurrency.address
    : inputCurrency.mainnet_address || inputCurrency.address;

  const priceValue = ethereumUtils.getAssetPrice(address);

  // ETH_ADDRESS is a misleading name– this address is used to represent any network's native asset
  if (
    // eth <-> weth swap
    (tradeDetails.buyTokenAddress === ETH_ADDRESS && tradeDetails.sellTokenAddress === WETH_ADDRESS) ||
    (tradeDetails.sellTokenAddress === ETH_ADDRESS && tradeDetails.buyTokenAddress === WETH_ADDRESS) ||
    // matic <-> wmatic swap
    (tradeDetails.buyTokenAddress === ETH_ADDRESS && tradeDetails.sellTokenAddress === WMATIC_POLYGON_ADDRESS) ||
    (tradeDetails.sellTokenAddress === ETH_ADDRESS && tradeDetails.buyTokenAddress === WMATIC_POLYGON_ADDRESS) ||
    // bnb <-> wbnb swap
    (tradeDetails.buyTokenAddress === ETH_ADDRESS && tradeDetails.sellTokenAddress === WBNB_BSC_ADDRESS) ||
    (tradeDetails.sellTokenAddress === ETH_ADDRESS && tradeDetails.buyTokenAddress === WBNB_BSC_ADDRESS) ||
    // arb one <-> weth arb one swap
    (tradeDetails.buyTokenAddress === ETH_ADDRESS && tradeDetails.sellTokenAddress === WETH_ARBITRUM_ADDRESS) ||
    (tradeDetails.sellTokenAddress === ETH_ADDRESS && tradeDetails.buyTokenAddress === WETH_ARBITRUM_ADDRESS) ||
    // zora eth <-> weth swap
    (tradeDetails.buyTokenAddress === ETH_ADDRESS && tradeDetails.sellTokenAddress === WETH_ZORA_ADDRESS) ||
    (tradeDetails.sellTokenAddress === ETH_ADDRESS && tradeDetails.buyTokenAddress === WETH_ZORA_ADDRESS) ||
    // degen <-> wdegen swap
    (tradeDetails.buyTokenAddress === ETH_ADDRESS && tradeDetails.sellTokenAddress === WDEGEN_DEGEN_CHAIN_ADDRESS) ||
    (tradeDetails.sellTokenAddress === ETH_ADDRESS && tradeDetails.buyTokenAddress === WDEGEN_DEGEN_CHAIN_ADDRESS)
  ) {
    amountReceivedSold = fromWei(amountReceivedSold.toString());
  }

  const amountReceivedSoldDisplay = updatePrecisionToDisplay(
    // @ts-ignore
    amountReceivedSold,
    priceValue,
    !inputAsExact
  );

  return {
    amountReceivedSold: amountReceivedSoldDisplay,
    receivedSoldLabel,
  };
}
