import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const TokenInfoSection = styled(ColumnWithMargins).attrs({
  margin: 15,
})`
  ${({ isNft }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    ios && padding(isNft ? 0 : 24, isNft ? 5 : 0, isNft ? 24 : 5)};
  width: 100%;
`;

export default TokenInfoSection;
