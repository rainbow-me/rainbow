import { ColumnWithMargins } from '../layout';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const TokenInfoSection = styled(ColumnWithMargins).attrs({
  margin: 15,
})(({ isNft }) => ({
  ...(ios ? padding.object(isNft ? 0 : 24, isNft ? 5 : 0, isNft ? 24 : 5) : {}),
  width: '100%',
}));

export default TokenInfoSection;
