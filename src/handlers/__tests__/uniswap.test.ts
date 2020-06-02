import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ChainId, JSBI, Pair, Token, TokenAmount, Trade } from '@uniswap/sdk2';
import { UNISWAP2_ALL_PAIRS, UNISWAP2_ALL_TOKENS } from '../../apollo/queries';
import 'cross-fetch/polyfill';

const uniswap2Client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-local',
  }),
});

it('works', async () => {
  const addrs1 = '0x23b608675a2b2fb1890d3abbd85c5775c51691d5'; // SOCKS
  const addrs2 = '0x960b236a07cf122663c4303350609a66a7b288c0'; // ANTx
  const token1 = await Token.fetchData(ChainId.MAINNET, addrs1);
  const token2 = await Token.fetchData(ChainId.MAINNET, addrs2);
  const pair = await Pair.fetchData(token1, token2);
  console.log(token1, token2, pair);
  expect(false).toBeFalsy();
});

it('works2', async () => {
  const addrs1 = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'; // MKR
  const addrs2 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC
  const token1 = await Token.fetchData(ChainId.MAINNET, addrs1);
  const token2 = await Token.fetchData(ChainId.MAINNET, addrs2);
  const pair = await Pair.fetchData(token1, token2);
  console.log(token1, token2, pair);
  expect(false).toBeFalsy();
});

it('fetches pair', async () => {
  const tokens = (
    await uniswap2Client.query({
      query: UNISWAP2_ALL_TOKENS,
    })
  )?.data.tokens.map(
    ({ id, name, symbol, decimals }) =>
      new Token(ChainId.MAINNET, id, decimals, symbol, name)
  );

  const result = await uniswap2Client.query({
    query: UNISWAP2_ALL_PAIRS,
  });
  const { pairs } = result.data.pairs.reduce((acc, pair) => {
    const token0 = tokens[pair.token0.id];
    const token1 = tokens[pair.token1.id];

    // TODO
    const res0 = JSBI.BigInt(Math.round(10 ** token0.decimals * pair.reserve0));
    const res1 = JSBI.BigInt(Math.round(10 ** token1.decimals * pair.reserve1));

    const amount0 = new TokenAmount(token0, res0);
    const amount1 = new TokenAmount(token1, res1);
    const newPair = new Pair(amount0, amount1);
    return {
      [pair.id]: newPair,
      ...acc,
    };
  }, {});

  const addrs0 = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'; // DAI
  const addrs1 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // DGX

  const WBTC = tokens[addrs0];
  const USDC = tokens[addrs1];

  console.log(WBTC);
  console.log(USDC);

  const amountIn = new TokenAmount(WBTC, JSBI.BigInt(100000));

  const p = Pair.getAddress(WBTC, USDC);
  console.log(p, pairs[p]);
  const trade = Trade.bestTradeExactIn(Object.values(pairs), amountIn, USDC, {
    maxHops: 1000,
  });
  console.log(
    amountIn.toExact(),
    amountIn.token.symbol,
    trade[0]?.outputAmount.toExact(),
    trade[0]?.outputAmount.token.symbol
  );
  expect(false).toBeFalsy();
});

it('ethethmny', async () => {
  const eth = await Token.fetchData(
    ChainId.MAINNET,
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  );
  const ethmny = await Token.fetchData(
    ChainId.MAINNET,
    '0xbf4a2ddaa16148a9d0fa2093ffac450adb7cd4aa'
  );

  const ethethmny = Pair.getAddress(eth, ethmny);

  expect(ethethmny).toEqual('0x17eE04ec364577937855D2e9a7adD8d2a957E4Fa');
});
