import { ethers } from 'ethers';
import { toLower } from 'lodash';
import { web3Provider } from '../handlers/web3';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import testnetAssets from '../references/testnet-assets.json';
import { addressAssetsReceived } from './data';

const BALANCE_CHECKER_CONTRACT_ADDRESS = {
  goerli: '0xf3352813b612a2d198e437691557069316b84ebe',
  kovan: '0xf3352813b612a2d198e437691557069316b84ebe',
  rinkeby: '0xc55386617db7b4021d87750daaed485eb3ab0154',
  ropsten: '0xf17adbb5094639142ca1c2add4ce0a0ef146c3f9',
};

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

let tesnetExplorerHandler = null;

const fetchAssetPrices = async (coingecko_ids, nativeCurrency) => {
  try {
    const priceRequest = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingecko_ids.join(
        ','
      )}&vs_currencies=${nativeCurrency}&include_24hr_change=true&include_last_updated_at=true`
    );
    return priceRequest.json();
  } catch (e) {
    console.log(`Error trying to fetch ${coingecko_ids} prices`, e);
  }
};

const fetchAssetBalances = async (tokens, address, network) => {
  const balanceCheckerContract = new ethers.Contract(
    BALANCE_CHECKER_CONTRACT_ADDRESS[network],
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
    console.log('Error fetching balances from balanceCheckerContract', e);
    return null;
  }
};

export const testnetExplorerInit = () => async (dispatch, getState) => {
  const { accountAddress, nativeCurrency, network } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);
  const fetchAssetsBalancesAndPrices = async () => {
    const assets = testnetAssets[network];

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

    tesnetExplorerHandler = setTimeout(fetchAssetsBalancesAndPrices, 5000);
  };

  fetchAssetsBalancesAndPrices();
};

export const testnetExplorerClearState = () => {
  clearTimeout(tesnetExplorerHandler);
};
