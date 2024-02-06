import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  justify: 'start',
  margin: 6,
})({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  height: 34,
  paddingBottom: 2,
});

const ProfileActionIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
}))(({ iconSize }) => ({
  ...position.sizeAsObject(iconSize),
  marginTop: 0.5,
}));

const ProfileAction = ({ icon, iconSize = 16, onPress, text, ...props }) => (
  <ButtonPressAnimation onPress={onPress} overflowMargin={5} radiusAndroid={24} {...props}>
    <Container>
      <ProfileActionIcon iconSize={iconSize} name={icon} />
      <Text color="appleBlue" letterSpacing="roundedMedium" lineHeight={19} size="lmedium" weight="semibold">
        {text}
      </Text>
    </Container>
  </ButtonPressAnimation>
);

export default React.memo(ProfileAction);
