import styled from 'styled-components/primitives';
import CoinDividerOpenButton from '../coin-divider/CoinDividerOpenButton';

const SendAssetListSmallBalancesHeader = styled(CoinDividerOpenButton).attrs(
  ({ openShitcoins }) => ({
    coinDividerHeight: 30,
    initialState: true,
    isSmallBalancesOpen: openShitcoins,
  })
)`
  margin-left: 16;
`;

export default SendAssetListSmallBalancesHeader;
