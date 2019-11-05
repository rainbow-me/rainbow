import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { Icon } from '../icons';
import { ShadowStack } from '../shadow-stack';
import { ButtonPressAnimation } from '../animations';
import { deviceUtils } from '../../utils';

const buttonWidth = (deviceUtils.dimensions.width - 45) / 2;

const Container = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 15px 15px 0px;
  background-color: #fff;
`;

const Button = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: ${({ backgroundColor }) => backgroundColor};
  height: 52px;
`;

const ButtonText = styled.Text`
  color: ${colors.white};
  font-weight: ${fonts.weight.semibold};
  font-size: ${fonts.size.lmedium};
  line-height: 16;
  padding-left: 6px;
`;

const FabShadow = [
  [0, 2, 5, colors.dark, 0.2],
  [0, 6, 10, colors.dark, 0.14],
  [0, 1, 18, colors.dark, 0.12],
];

const BottomSendButtons = ({
  onPressSend,
  onPressSwap,
}) => (
  <Container>
    <ButtonPressAnimation
      onPress={onPressSwap}
    >
      <ShadowStack
        height={52}
        borderRadius={26}
        width={buttonWidth}
        shadows={FabShadow}
        shadowProps={{ opacity: 1 }}
      >
        <Button
          backgroundColor={colors.dodgerBlue}
        >
          <Icon
            height={22}
            marginBottom={4}
            name="swap"
            width={23}
          />
          <ButtonText>
            Swap
          </ButtonText>
        </Button>
      </ShadowStack>
    </ButtonPressAnimation>

    <ButtonPressAnimation
      onPress={onPressSend}
    >
      <ShadowStack
        height={52}
        borderRadius={26}
        width={buttonWidth}
        shadows={FabShadow}
        shadowProps={{ opacity: 1 }}
      >
        <Button
          backgroundColor={colors.paleBlue}
        >
          <Icon
            height={22}
            marginBottom={4}
            name="send"
            width={23}
          />
          <ButtonText>
            Send
          </ButtonText>
        </Button>
      </ShadowStack>
    </ButtonPressAnimation>
  </Container>
);

BottomSendButtons.propTypes = {
  onPressSend: PropTypes.func,
  onPressSwap: PropTypes.func,
};

export default BottomSendButtons;
