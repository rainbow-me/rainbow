import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../../styles';
import { Icon } from '../../icons';
import { Centered, Row } from '../../layout';
import { TruncatedText } from '../../text';
import FloatingPanel from '../FloatingPanel';

const ActionIcon = styled(Icon)`
  ${position.maxSize('100%')};
`;

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

const Label = styled(TruncatedText).attrs({
  family: 'SFProText',
  size: 'bmedium',
  weight: 'semibold',
})`
  flex: 1;
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
    <Label color={color}>
      {label}
    </Label>
    <IconContainer>
      <ActionIcon color={color} name={icon} />
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

export default AssetPanelAction;
