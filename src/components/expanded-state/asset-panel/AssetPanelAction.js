import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../../styles';
import { Icon } from '../../icons';
import { Centered, FlexItem, Row } from '../../layout';
import { TruncatedText } from '../../text';
import FloatingPanel from '../FloatingPanel';

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, FloatingPanel.padding.x)};
  height: 60;
  width: 100%;
`;

const IconContainer = styled(Centered)`
  flex-grow: 0;
  flex-shrink: 0;
  height: 100%;
  width: 24;
`;

const AssetPanelAction = ({
  color,
  icon,
  label,
  onPress,
}) => (
  <Container
    activeOpacity={0.5}
    component={TouchableOpacity}
    onPress={onPress}
  >
    <FlexItem>
      <TruncatedText color={color} size="bmedium" weight="semibold">
        {label}
      </TruncatedText>
    </FlexItem>
    <IconContainer>
      <Icon
        color={color}
        name={icon}
        style={position.maxSizeAsObject('100%')}
      />
    </IconContainer>
  </Container>
);

AssetPanelAction.propTypes = {
  color: PropTypes.string,
  icon: Icon.propTypes.name,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

AssetPanelAction.defaultProps = {
  color: colors.sendScreen.brightBlue,
};

export default pure(AssetPanelAction);
