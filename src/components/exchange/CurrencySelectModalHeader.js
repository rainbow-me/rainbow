import PropTypes from 'prop-types';
import React from 'react';
import { hoistStatics, onlyUpdateForKeys, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { borders, colors } from '../../styles';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';

const BackButtonWrapper = styled(Centered)`
  bottom: 0;
  left: 0;
  position: absolute;
  top: 0;
`;

const HeaderHeight = 60;
const HeaderContainer = styled(Centered).attrs({ flex: 0 })`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: ${HeaderHeight};
  width: 100%;
`;

const HeaderTitle = withProps({
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
        color={colors.dark}
        direction="left"
        height={HeaderHeight}
        onPress={onPressBack}
        paddingLeft={25}
        size="9"
      />
    </BackButtonWrapper>
    <HeaderTitle>{title}</HeaderTitle>
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
