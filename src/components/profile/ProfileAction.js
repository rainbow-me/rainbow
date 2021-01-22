import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import { colors_NOT_REACTIVE, position } from '@rainbow-me/styles';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  justify: 'start',
  margin: 6,
})`
  background-color: ${({ theme: { colors } }) => colors.transparent};
  height: 34;
  padding-bottom: 2;
`;

const ProfileActionIcon = styled(Icon).attrs({
  color: colors_NOT_REACTIVE.appleBlue,
})`
  ${({ iconSize }) => position.size(iconSize)};
  margin-top: 0.5;
`;

const ProfileAction = ({ icon, iconSize = 16, onPress, text, ...props }) => (
  <ButtonPressAnimation
    onPress={onPress}
    overflowMargin={5}
    radiusAndroid={24}
    {...props}
  >
    <Container>
      <ProfileActionIcon iconSize={iconSize} name={icon} />
      <Text
        color="appleBlue"
        letterSpacing="roundedMedium"
        lineHeight={19}
        size="lmedium"
        weight="semibold"
      >
        {text}
      </Text>
    </Container>
  </ButtonPressAnimation>
);

export default React.memo(ProfileAction);
