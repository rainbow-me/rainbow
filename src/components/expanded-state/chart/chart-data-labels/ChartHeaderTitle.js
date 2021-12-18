import { TruncatedText } from '../../../text';
import styled from 'styled-components';

const ChartHeaderTitle = styled(TruncatedText).attrs({
  letterSpacing: 'roundedTight',
  size: 'big',
  weight: 'bold',
})({});

export default ChartHeaderTitle;
