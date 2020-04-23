import { ethers } from 'ethers';
import { get, toLower } from 'lodash';
import { web3Provider } from '../handlers/web3';
import networkInfo from '../helpers/networkInfo';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import testnetAssets from '../references/testnet-assets.json';
import { logger } from '../utils';
import { addressAssetsReceived } from './data';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

let testnetExplorerHandle = null;

const fetchAssetPrices = async (coingecko_ids, nativeCurrency) => {
  try {
    const priceRequest = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingecko_ids.join(
        ','
      )}&vs_currencies=${nativeCurrency}&include_24hr_change=true&include_last_updated_at=true`
    );
    return priceRequest.json();
  } catch (e) {
    logger.log(`Error trying to fetch ${coingecko_ids} prices`, e);
  }
};

const fetchAssetBalances = async (tokens, address, network) => {
  const balanceCheckerContract = new ethers.Contract(
    get(networkInfo[network], 'balance_checker_contract_address'),
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([address], tokens);

    const balances = {};
    [address].forEach((addr, addrIdx) => {
      balances[addr] = {};
      tokens.forEach((tokenAddr, tokenIdx) => {
        const balance = values[addrIdx * tokens.length + tokenIdx];
        balances[addr][tokenAddr] = balance;
      });
    });
    return balances[address];
  } catch (e) {
    logger.log(
      'Error fetching balances from balanceCheckerContract',
      network,
      e
    );
    return null;
  }
};

export const testnetExplorerInit = () => async (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);
  const fetchAssetsBalancesAndPrices = async () => {
    const { network } = getState().settings;
    const assets = testnetAssets[network];
    if (!assets || !assets.length) {
      testnetExplorerHandle = setTimeout(fetchAssetsBalancesAndPrices, 5000);
      return;
    }
    const prices = await fetchAssetPrices(
      assets.map(({ asset: { coingecko_id } }) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (toLower(assets[i].asset.coingecko_id) === toLower(key)) {
            assets[i].asset.price = {
              changed_at: prices[key].last_updated_at,
              relative_change_24h:
                prices[key][`${formattedNativeCurrency}_24h_change`],
              value: prices[key][`${formattedNativeCurrency}`],
            };
            break;
          }
        }
      });
    }
    const balances = await fetchAssetBalances(
      assets.map(({ asset: { asset_code } }) =>
        asset_code === 'eth' ? ETH_ADDRESS : asset_code
      ),
      accountAddress,
      network
    );

    let total = ethers.utils.bigNumberify(0);

    if (balances) {
      Object.keys(balances).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (
            assets[i].asset.asset_code.toLowerCase() === key.toLowerCase() ||
            (assets[i].asset.asset_code === 'eth' && key === ETH_ADDRESS)
          ) {
            assets[i].quantity = balances[key];
            break;
          }
        }
        total = total.add(balances[key]);
      });
    }

    dispatch(
      addressAssetsReceived({
        meta: {
          address: accountAddress,
          currency: 'usd',
          status: 'ok',
        },
        payload: { assets },
      })
    );
    testnetExplorerHandle = setTimeout(fetchAssetsBalancesAndPrices, 5000);
  };
  fetchAssetsBalancesAndPrices();
};

export const testnetExplorerClearState = () => {
  clearTimeout(testnetExplorerHandle);
};
