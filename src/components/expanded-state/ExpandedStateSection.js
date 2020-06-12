import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';

const ExpandedStateSection = ({ children, title, ...props }) => (
  <ColumnWithMargins
    margin={12}
    paddingBottom={24}
    paddingHorizontal={19}
    paddingTop={19}
    {...props}
  >
    <Text letterSpacing="roundedTight" size="larger" weight="bold">
      {title}
    </Text>
    {typeof children === 'string' ? (
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="paragraphSmall"
        size="lmedium"
      >
        {children}
      </Text>
    ) : (
      children
    )}
  </ColumnWithMargins>
);

ExpandedStateSection.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
};

export default ExpandedStateSection;
