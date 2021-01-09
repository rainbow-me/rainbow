import styled from 'styled-components';
import { Text } from '../text';
import { fonts } from '@rainbow-me/styles';

const SheetTitle = styled(Text).attrs(
  ({ size = fonts.size.large, weight = fonts.weight.bold }) => ({
    align: 'center',
    letterSpacing: 'roundedMedium',
    size,
    weight,
  })
)``;

export default SheetTitle;
