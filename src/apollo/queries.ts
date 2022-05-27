import gql from 'graphql-tag';

export const UNISWAP_PAIR_DATA_QUERY_VOLUME = (
  pairAddress: string,
  block: number
) => {
  const queryString = `
    fragment PairFields on Pair {
      volumeUSD
  }
  query pairs {
    pairs(${
      block ? `block: {number: ${block}}` : ``
    } where: { id: "${pairAddress}"} ) {
      ...PairFields
    }
  }`;
  return gql`
    ${queryString}
  `;
};

export const COMPOUND_ACCOUNT_AND_MARKET_QUERY = gql`
  query account($id: ID!) {
    markets {
      exchangeRate
      id
      name
      supplyRate
      symbol
      underlyingAddress
      underlyingName
      underlyingSymbol
      underlyingDecimals
      underlyingPrice
    }
    account(id: $id) {
      id
      tokens(where: { cTokenBalance_gt: 0 }) {
        cTokenBalance
        id
        lifetimeSupplyInterestAccrued
        supplyBalanceUnderlying
        symbol
        totalUnderlyingSupplied
      }
    }
  }
`;

export const UNISWAP_24HOUR_PRICE_QUERY = (
  tokenAddress: string,
  block: number
) => {
  const queryString = `
    query tokens {
      tokens(${
        block ? `block : {number: ${block}}` : ``
      } where: {id:"${tokenAddress}"}) {
        id
        derivedETH
      }
    }
  `;
  return gql(queryString);
};

export const UNISWAP_PRICES_QUERY = gql`
  query tokens($addresses: [String]!) {
    tokens(where: { id_in: $addresses, derivedETH_gt: 0 }) {
      id
      derivedETH
      symbol
      name
      decimals
    }
  }
`;

export const UNISWAP_ADDITIONAL_POOL_DATA = gql`
  query pairs($address: String!) {
    pairs(where: { id: $address }) {
      volumeUSD
      reserveUSD
      trackedReserveETH
    }
  }
`;

export const GET_BLOCKS_QUERY = (timestamps: any) => {
  let queryString = 'query blocks {';
  queryString += timestamps.map((timestamp: any) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
        number
      }`;
  });
  queryString += '}';
  return gql`
    ${queryString}
  `;
};

export const USER_POSITIONS = gql`
  query liquidityPositions($user: Bytes!) {
    liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: 0 }) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          decimals
          id
          name
          symbol
          derivedETH
        }
        token1 {
          decimals
          id
          name
          symbol
          derivedETH
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`;

export const USER_MINTS_BURNS_PER_PAIR = gql`
  query events($user: Bytes!, $pair: Bytes!) {
    mints(where: { to: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
    burns(where: { sender: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`;

export const USER_HISTORY = gql`
  query snapshots($user: Bytes!, $skip: Int!) {
    liquidityPositionSnapshots(
      first: 1000
      skip: $skip
      where: { user: $user }
    ) {
      timestamp
      reserveUSD
      liquidityTokenBalance
      liquidityTokenTotalSupply
      reserve0
      reserve1
      token0PriceUSD
      token1PriceUSD
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`;

export const ENS_SUGGESTIONS = gql`
  query lookup($name: String!, $amount: Int!) {
    domains(
      first: $amount
      where: { name_starts_with: $name, resolvedAddress_not: null }
      orderBy: labelName
      orderDirection: asc
    ) {
      name
      resolver {
        texts
        addr {
          id
        }
      }
      owner {
        id
      }
    }
  }
`;

export const ENS_SEARCH = gql`
  query lookup($name: String!, $amount: Int!) {
    domains(first: $amount, where: { name: $name }) {
      name
      resolver {
        addr {
          id
        }
      }
    }
  }
`;

export const ENS_DOMAINS = gql`
  query lookup($name: String!) {
    domains(where: { name: $name }) {
      name
      labelhash
      resolver {
        addr {
          id
        }
      }
    }
  }
`;

export const ENS_REGISTRATIONS = gql`
  query lookup($labelHash: String!) {
    registrations(first: 1, where: { id: $labelHash }) {
      id
      registrationDate
      expiryDate
    }
  }
`;

export type EnsAccountRegistratonsData = {
  account: {
    registrations: {
      domain: {
        name: string;
        labelhash: string;
        owner: {
          id: string;
        };
      };
    }[];
  };
};

export const ENS_ALL_ACCOUNT_REGISTRATIONS = gql`
  query getAccountRegistrations($address: String!) {
    account(id: $address) {
      registrations(orderBy: registrationDate) {
        domain {
          name
          owner {
            id
          }
        }
      }
    }
  }
`;

export const ENS_ACCOUNT_REGISTRATIONS = gql`
  query getAccountRegistrations(
    $address: String!
    $registrationDate_gt: BigInt = "0"
  ) {
    account(id: $address) {
      registrations(
        first: 99
        orderBy: registrationDate
        orderDirection: desc
        where: { registrationDate_gt: $registrationDate_gt }
      ) {
        domain {
          name
          labelhash
          owner {
            id
          }
        }
      }
    }
  }
`;

export type EnsGetRegistrationData = {
  registration: {
    id: string;
    registrationDate: number;
    expiryDate: number;
    registrant: {
      id: string;
    };
  };
};

export const ENS_GET_REGISTRATION = gql`
  query getRegistration($id: ID!) {
    registration(id: $id) {
      id
      registrationDate
      expiryDate
      registrant {
        id
      }
    }
  }
`;

export type EnsGetRecordsData = {
  domains: {
    resolver: {
      texts: string[];
    };
  }[];
};

export const ENS_GET_RECORDS = gql`
  query lookup($name: String!) {
    domains(first: 1, where: { name: $name }) {
      resolver {
        texts
      }
    }
  }
`;

export type EnsGetCoinTypesData = {
  domains: {
    resolver: {
      coinTypes: number[];
    };
  }[];
};

export const ENS_GET_COIN_TYPES = gql`
  query lookup($name: String!) {
    domains(first: 1, where: { name: $name }) {
      resolver {
        coinTypes
      }
    }
  }
`;

export const CONTRACT_FUNCTION = gql`
  query contractFunction($chainID: Int!, $hex: String!) {
    contractFunction(chainID: $chainID, hex: $hex) {
      text
    }
  }
`;

export type EnsGetNameFromLabelhash = {
  domains: {
    labelName: string;
  }[];
};

export const ENS_GET_NAME_FROM_LABELHASH = gql`
  query lookup($labelhash: String!) {
    domains(first: 1, where: { labelhash: $labelhash }) {
      labelName
    }
  }
`;
