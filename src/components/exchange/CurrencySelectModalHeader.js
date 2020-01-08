import PropTypes from 'prop-types';
import React from 'react';
import { hoistStatics, onlyUpdateForKeys, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { borders, colors, padding } from '../../styles';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';

const BackButtonWrapper = styled(Centered)`
  bottom: 0;
  left: 0;
  position: absolute;
  top: 3;
`;

const HeaderHeight = 59;
const HeaderContainer = styled(Centered).attrs({ flex: 0 })`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: ${HeaderHeight};
  width: 100%;
`;

const HeaderTitle = withProps({
  align: 'center',
  height: 21,
  letterSpacing: 'tighter',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})(TruncatedText);

const CurrencySelectModalHeader = ({ onPressBack, title }) => (
  <HeaderContainer>
    <BackButtonWrapper>
      <BackButton
        direction="left"
        height={HeaderHeight}
        onPress={onPressBack}
      />
    </BackButtonWrapper>
    <HeaderTitle css={padding(1, 0, 0)}>{title}</HeaderTitle>
  </HeaderContainer>
);

CurrencySelectModalHeader.propTypes = {
  onPressBack: PropTypes.func,
  title: PropTypes.string,
};

CurrencySelectModalHeader.height = HeaderHeight;

export default hoistStatics(onlyUpdateForKeys(['title']))(
  CurrencySelectModalHeader
);
