import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { Flex, Row } from '../layout';
import { Text } from '../text';
import { colors, margin } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const searchInputWidth = deviceUtils.dimensions.width - 30;
export const searchInputHeight = 40;

const Container = styled(Row)`
  ${margin(19, 15)};
  background-color: ${colors.transparent};
  border-radius: ${searchInputHeight / 2};
  height: ${searchInputHeight};
  overflow: hidden;
`;

const BackgroundGradient = styled(RadialGradient).attrs({
  center: [searchInputWidth, searchInputWidth / 2],
  colors: ['#FCFDFE', '#F0F2F5'],
})`
  height: ${searchInputWidth};
  position: absolute;
  top: ${-(searchInputWidth - searchInputHeight) / 2};
  transform: scaleY(${searchInputHeight / searchInputWidth});
  width: ${searchInputWidth};
`;

const SearchIcon = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: 'large',
  weight: 'semibold',
})``;

const PlaceholderWrapper = styled(Row)`
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  margin-top: 3;
  width: 100%;
`;

const SearchIconWrapper = styled(Flex)`
  margin-top: 5;
`;

const PlaceholderText = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: 'large',
  weight: 'semibold',
})`
  margin-left: 3;
  padding-top: 5;
  text-align: center;
`;

export default function SearchHeader({ onPress }) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Container>
        <BackgroundGradient />
        <PlaceholderWrapper>
          <SearchIconWrapper>
            <SearchIcon>􀊫</SearchIcon>
          </SearchIconWrapper>
          <PlaceholderText size="medium" weight="bold">
            Search all of Ethereum
          </PlaceholderText>
        </PlaceholderWrapper>
      </Container>
    </TouchableWithoutFeedback>
  );
}
