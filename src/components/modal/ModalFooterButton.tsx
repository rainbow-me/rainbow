import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const ButtonIcon = styled(Icon)`
  ${position.maxSize('100%')};
  margin-right: 9;
`;

const Container = styled(Centered)`
  flex: 1;
  height: 56;
  padding-bottom: 7;
`;

const IconContainer = styled(Centered).attrs({
  grow: 0,
  shrink: 0,
})`
  ${position.size(18)};
`;

const ModalFooterButton = ({ icon, label, onPress }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container as={BorderlessButton} onPress={onPress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <IconContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonIcon color={colors.appleBlue} name={icon} />
      </IconContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text color="appleBlue" size="large" weight="semibold">
        {label}
      </Text>
    </Container>
  );
};

export default React.memo(ModalFooterButton);
