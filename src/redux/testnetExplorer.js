import { addressAssetsReceived } from './data';
import { web3Provider } from '../handlers/web3';
import erc20ABI from '../references/erc20-abi.json';
import { ethers } from 'ethers';

let tesnetExplorerHandler = null;

const fetchAssetPrice = async (coingecko_id, nativeCurrency) => {
  try {
    const formattedNativeCurrency = nativeCurrency.toLowerCase();
    const priceRequest = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingecko_id}&vs_currencies=${formattedNativeCurrency}&include_24hr_change=true&include_last_updated_at=true`
    );
    const priceResponse = await priceRequest.json();
    return {
      changed_at: priceResponse[coingecko_id].last_updated_at,
      relative_change_24h:
        priceResponse[coingecko_id][`${formattedNativeCurrency}_24h_change`],
      value: priceResponse[coingecko_id][`${formattedNativeCurrency}`],
    };
  } catch (e) {
    console.log(`Error trying to fetch ${coingecko_id} price`, e);
  }
};

const fetchAssetBalance = async (contractAddress, address) => {
  try {
    if (contractAddress === 'eth') {
      return web3Provider.getBalance(address, 'pending');
    } else {
      const tokenContract = new ethers.Contract(
        contractAddress,
        erc20ABI,
        web3Provider
      );
      return tokenContract.balanceOf(address);
    }
  } catch (e) {
    console.log(`Error trying to fetch ${contractAddress} balance`, e);
    return null;
  }
};

export const testnetExplorerInit = () => async (dispatch, getState) => {
  const { accountAddress, nativeCurrency, network } = getState().settings;

  const allAssets = {
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
    ],
  };

  const fetchAssetsBalancesAndPrices = async () => {
    console.log('fetching assets for network', network);
    const assets = allAssets[network];

    for (let i = 0; i < assets.length; i++) {
      const price = await fetchAssetPrice(
        assets[i].asset.coingecko_id || assets[i].asset.symbol.toLowerCase(),
        nativeCurrency
      );
      if (price) {
        assets[i].asset.price = price;
      }

      const balance = await fetchAssetBalance(
        assets[i].asset.asset_code,
        accountAddress
      );
      if (balance) {
        assets[i].quantity = balance;
      }
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

    tesnetExplorerHandler = setTimeout(fetchAssetsBalancesAndPrices, 15000);
  };

  fetchAssetsBalancesAndPrices();
};

export const testnetExplorerClearState = () => () => {
  clearTimeout(tesnetExplorerHandler);
};
