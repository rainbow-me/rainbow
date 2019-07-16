import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/primitives';
import { withNeverRerender } from '../../../hoc';
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

const AssetPanelIcon = styled(Icon)`
  ${position.maxSize('100%')};
  ${position.minSize(21)};
`;

const AssetPanelIconContainer = styled(Centered)`
  flex-grow: 0;
  flex-shrink: 0;
  height: 100%;
  padding-bottom: 4;
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
      <TruncatedText
        color={color}
        size="large"
        style={{ marginBottom: 4 }}
        weight="semibold"
      >
        {label}
      </TruncatedText>
    </FlexItem>
    <AssetPanelIconContainer>
      <AssetPanelIcon
        color={color}
        name={icon}
      />
    </AssetPanelIconContainer>
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

export default withNeverRerender(AssetPanelAction);
