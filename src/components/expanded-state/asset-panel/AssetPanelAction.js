import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { withNeverRerender } from '../../../hoc';
import { colors, position } from '../../../styles';
import { Icon } from '../../icons';
import { Centered, FlexItem } from '../../layout';
import { TruncatedText } from '../../text';
import FloatingPanel from '../FloatingPanel';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    paddingHorizontal: FloatingPanel.padding.x,
    width: '100%',
  },
  icon: {
    ...position.maxSizeAsObject('100%'),
    ...position.minSizeAsObject(21),
  },
  iconContainer: {
    flexGrow: 0,
    flexShrink: 0,
    height: '100%',
    paddingBottom: 4,
    width: 24,
  },
  label: {
    marginBottom: 4,
  },
});

const AssetPanelAction = ({ color, icon, label, onPress }) => (
  <TouchableOpacity activeOpacity={0.5} onPress={onPress} style={sx.container}>
    <FlexItem flex={1}>
      <TruncatedText
        color={color}
        size="large"
        style={sx.label}
        weight="semibold"
      >
        {label}
      </TruncatedText>
    </FlexItem>
    <Centered style={sx.iconContainer}>
      <Icon color={color} name={icon} style={sx.icon} />
    </Centered>
  </TouchableOpacity>
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
