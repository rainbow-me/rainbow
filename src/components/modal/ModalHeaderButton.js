import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text as UnstyledText } from '../text';
import styled from '@/styled-thing';

const BackArrow = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  direction: 'left',
  name: 'caret',
}))({
  height: 16,
  marginTop: android ? 6 : 0,
});

const Container = styled(Row).attrs(({ side }) => ({
  align: 'center',
  justify: side === 'left' ? 'start' : 'end',
}))(({ side, theme: { colors } }) => ({
  ...(side === 'left' ? { left: 0 } : { right: 0 }),
  backgroundColor: colors.transparent,
  bottom: 0,
  paddingLeft: side === 'left' ? 15 : 48,
  paddingRight: side === 'left' ? 48 : 15,
  zIndex: 2,
}));

const Text = styled(UnstyledText).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.appleBlue,
  size: 'large',
  weight: 'medium',
}))({
  marginLeft: ({ side }) => (side === 'left' ? 4 : 0),
});

const ModalHeaderButton = ({ label, onPress, side }) => (
  <Container as={ios ? BorderlessButton : Button} onPress={onPress} side={side}>
    <Row>
      {side === 'left' && <BackArrow />}
      <Text side={side}>{label}</Text>
    </Row>
  </Container>
);

export default React.memo(ModalHeaderButton);
