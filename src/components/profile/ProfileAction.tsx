import React from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  justify: 'start',
  margin: 6,
})`
  background-color: ${({ theme: { colors } }) => colors.transparent};
  height: 34;
  padding-bottom: 2;
`;

const ProfileActionIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
}))`
  ${({ iconSize }) => position.size(iconSize)};
  margin-top: 0.5;
`;

const ProfileAction = ({
  icon,
  iconSize = 16,
  onPress,
  text,
  ...props
}: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ButtonPressAnimation
    onPress={onPress}
    overflowMargin={5}
    radiusAndroid={24}
    {...props}
  >
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ProfileActionIcon iconSize={iconSize} name={icon} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
