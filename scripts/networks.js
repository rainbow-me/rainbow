/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const fs = require('fs-extra');

/**
 * Fetches data from the GraphQL API and saves it to a JSON file.
 */
async function fetchData() {
  const graphqlQuery = `
  query getNetworks($device: Device!, $includeTestnets: Boolean!) {
    networks(device: $device, includeTestnets: $includeTestnets) {
      id
      name
      label
      icons {
        badgeURL
      }
      testnet
      internal
      opStack
      defaultExplorer {
        url
        label
        transactionURL
        tokenURL
      }
      defaultRPC {
        enabledDevices
        url
      }
      gasUnits {
        basic {
          approval
          swap
          swapPermit
          eoaTransfer
          tokenTransfer
        }
        wrapped {
          wrap
          unwrap
        }
      }
      nativeAsset {
        address
        name
        symbol
        decimals
        iconURL
        colors {
          primary
          fallback
          shadow
        }
      }
      nativeWrappedAsset {
          address
          name
          symbol
          decimals
          iconURL
          colors {
          primary
          fallback
          shadow
        }
      }
      enabledServices {
        meteorology {
          enabled
        }
        swap {
          enabled
        }
        addys {
          approvals
          transactions
          assets
          positions
        }
        tokenSearch {
          enabled
        }
        nftProxy {
          enabled
        }
      }
    }
  }
`;

  const response = await fetch('https://metadata.p.rainbow.me/v1/graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { device: 'APP', includeTestnets: true },
    }),
  });

  const { data } = await response.json();
  const filePath = path.join(__dirname, '../src/references/networks.json');

  await fs.ensureFile(filePath);
  await fs.writeJson(filePath, data);
}

async function main() {
  try {
    console.log('Fetching networks ...');
    await fetchData();
    console.log('Networks data fetched and available.');
    process.exit(0);
  } catch (error) {
    console.error('Error fetching networks data:', error);
    process.exit(1);
  }
}

main();
