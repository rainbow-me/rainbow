import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { View } from 'react-native';
import { fonts, colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  padding: 10px 7.5px;
`;

const IconWrapper = styled.View`
  height: 30px
  width: 30px;
  border-radius: 14px;
  background-color: ${colors.skeleton};
  justify-content: center;
  align-items: center;
  margin-left: 8;
  margin-right: 9px;
`;

const Nickname = styled.Text`
  font-family: ${fonts.family.SFProText};
  font-weight: ${fonts.weight.medium};
  font-size: ${fonts.size.smedium};
  color: ${colors.dark};
`;

const ProfileOption = ({ icon, isInitializationOver, label, onPress }) =>
  isInitializationOver ? (
    <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
      <Container>
        <IconWrapper>
          <Icon
            color={colors.blueGreyMedium}
            height={15}
            width={15}
            name={icon}
          />
        </IconWrapper>
        <View>
          <Nickname>{label}</Nickname>
        </View>
      </Container>
    </ButtonPressAnimation>
  ) : (
    <Container>
      <IconWrapper>
        <Icon
          color={colors.blueGreyMedium}
          height={15}
          width={15}
          name={icon}
        />
      </IconWrapper>
      <View>
        <Nickname>{label}</Nickname>
      </View>
    </Container>
  );

ProfileOption.propTypes = {
  icon: PropTypes.string,
  isInitializationOver: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default ProfileOption;
