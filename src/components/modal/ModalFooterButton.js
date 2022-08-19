import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { position } from '@/styles';

const ButtonIcon = styled(Icon)({
  ...position.maxSizeAsObject('100%'),
  marginRight: 9,
});

const Container = styled(Centered)({
  flex: 1,
  height: 56,
  paddingBottom: 7,
});

const IconContainer = styled(Centered).attrs({
  grow: 0,
  shrink: 0,
})(position.sizeAsObject(18));

const ModalFooterButton = ({ icon, label, onPress }) => {
  const { colors } = useTheme();
  return (
    <Container as={BorderlessButton} onPress={onPress}>
      <IconContainer>
        <ButtonIcon color={colors.appleBlue} name={icon} />
      </IconContainer>
      <Text color="appleBlue" size="large" weight="semibold">
        {label}
      </Text>
    </Container>
  );
};

export default React.memo(ModalFooterButton);
