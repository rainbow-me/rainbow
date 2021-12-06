import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text as UnstyledText } from '../text';

const BackArrow = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  direction: 'left',
  name: 'caret',
}))`
  height: 16;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? 6 : 0};
`;

const Container = styled(Row).attrs(({ side }) => ({
  align: 'center',
  justify: side === 'left' ? 'start' : 'end',
}))`
  ${({ side }) => (side === 'left' ? 'left: 0;' : 'right: 0;')}
  background-color: ${({ theme: { colors } }) => colors.transparent};
  bottom: 0;
  padding-left: ${({ side }) => (side === 'left' ? 15 : 48)};
  padding-right: ${({ side }) => (side === 'left' ? 48 : 15)};
  z-index: 2;
`;

const Text = styled(UnstyledText).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.appleBlue,
  size: 'large',
  weight: 'medium',
}))`
  margin-left: ${({ side }) => (side === 'left' ? 4 : 0)};
`;

const ModalHeaderButton = ({ label, onPress, side }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Container as={ios ? BorderlessButton : Button} onPress={onPress} side={side}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Row>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {side === 'left' && <BackArrow />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text side={side}>{label}</Text>
    </Row>
  </Container>
);

export default React.memo(ModalHeaderButton);
