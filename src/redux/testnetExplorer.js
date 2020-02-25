import { addressAssetsReceived } from './data';
import { web3Provider } from '../handlers/web3';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import { ethers } from 'ethers';

const BALANCE_CHECKER_CONTRACT_ADDRESS =
  '0xc55386617db7b4021d87750daaed485eb3ab0154';
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

const ALL_ASSETS = {
  rinkeby: [
    {
      asset: {
        asset_code: 'eth',
        coingecko_id: 'ethereum',
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/ETH.png',
        name: 'Ether',
        price: {
          changed_at: 1582568575,
          relative_change_24h: -4.586615622469276,
          value: 259.2,
        },
        symbol: 'ETH',
      },
      quantity: 0,
    },
    {
      asset: {
        asset_code: '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
        coingecko_id: 'dai',
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/DAI_mcd.png',
        name: 'Dai',
        price: {
          changed_at: 1582562452,
          relative_change_24h: 0.8470466197462612,
          value: 1,
        },
        symbol: 'DAI',
      },
      quantity: 0,
    },
    {
      asset: {
        asset_code: '0xF22e3F33768354c9805d046af3C0926f27741B43',
        coingecko_id: '0x',
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/ZRX.png',
        name: '0x',
        price: {
          changed_at: 1582569109,
          relative_change_24h: -4.0050062578222825,
          value: 0.26834262,
        },
        symbol: 'ZRX',
      },
      quantity: 0,
    },
    {
      asset: {
        asset_code: '0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B',
        coingecko_id: 'basic-attention-token',
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/BAT.png',
        name: 'Basic Attention Token',
        price: {
          changed_at: 1582568524,
          relative_change_24h: -4.586615622469282,
          value: 0.25059455999999997,
        },
        symbol: 'BAT',
      },
      quantity: 0,
    },
    {
      asset: {
        asset_code: '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85',
        coingecko_id: 'maker',
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/MKR.png',
        name: 'Maker',
        price: {
          changed_at: 1582568524,
          relative_change_24h: -4.58661562246928,
          value: 622.0799999999999,
        },
        symbol: 'MKR',
      },
      quantity: 0,
    },
  ],
};

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

const fetchAssetBalances = async (tokens, address) => {
  const balanceCheckerContract = new ethers.Contract(
    BALANCE_CHECKER_CONTRACT_ADDRESS,
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
  const formattedNativeCurrency = nativeCurrency.toLowerCase();
  const fetchAssetsBalancesAndPrices = async () => {
    const assets = ALL_ASSETS[network];

    //for (let i = 0; i < assets.length; i++) {
    // console.log('DEALING WITH ASSET ', assets[i].asset.symbol);
    const prices = await fetchAssetPrices(
      assets.map(({ asset: { coingecko_id } }) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (
            assets[i].asset.coingecko_id.toLowerCase() === key.toLowerCase()
          ) {
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
      accountAddress
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

export const testnetExplorerClearState = () => () => {
  clearTimeout(tesnetExplorerHandler);
};
