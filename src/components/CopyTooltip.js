import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard } from 'react-native';
import ToolTip from 'react-native-tooltip';
import { withHandlers } from 'recompose';
import { colors } from '../styles';

const CopyTooltip = ({ onCopy, underlayColor, ...props }) => (
  <ToolTip
    {...props}
    actions={[{ onPress: onCopy, text: 'Copy' }]}
    underlayColor={colors.transparent}
  />
);

CopyTooltip.propTypes = {
  onCopy: PropTypes.func,
  textToCopy: PropTypes.string,
  underlayColor: PropTypes.string,
};

CopyTooltip.defaultProps = {
  underlayColor: colors.transparent,
};

export default withHandlers({
  onCopy: ({ textToCopy }) => () => Clipboard.setString(textToCopy),
})(CopyTooltip);
