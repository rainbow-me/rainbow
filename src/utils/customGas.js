import { ETHERSCAN_API_KEY } from 'react-native-dotenv';

export function formatEstimatedTime(totalSeconds, moreThan, lessThanMin) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (!minutes && !seconds) {
    return '...';
  }

  let symbol = '~';
  if (moreThan) {
    symbol = '< ';
  } else if (lessThanMin) {
    symbol = '> ';
  }

  const readableMin = `${minutes ? `${minutes} min` : ''}`;
  const readableSec = `${seconds ? `${seconds} sec` : ''}`;
  const readableTime =
    readableMin && readableSec
      ? `${symbol}${readableMin} ${readableSec}`
      : symbol + (readableMin || readableSec);

  return readableTime;
}

export const getEstimatedTimeForGasPrice = async (
  gasPrice,
  minGasPrice,
  maxGasPrice
) => {
  const url = `https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=${gasPrice}&apikey=${ETHERSCAN_API_KEY}`;
  const response = await fetch(url);
  const r = await response.json();
  const estimateInSeconds = Number(r.result);

  const estimateTime = formatEstimatedTime(
    estimateInSeconds,
    gasPrice > maxGasPrice,
    gasPrice < minGasPrice
  );

  return estimateTime;
};
