import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const ListItemArrowGroup = ({ children }) => (
  <RowWithMargins
    align="center"
    flex={0}
    justify="end"
    margin={6}
    opacity={0.6}
  >
    {typeof children === 'string'
      ? <Text color="blueGreyDark" size="bmedium">{children}</Text>
      : children
    }
    <Icon
      color={colors.blueGreyDark}
      name="caretThin"
      style={{ width: 11 }}
    />
  </RowWithMargins>
);

ListItemArrowGroup.propTypes = {
  children: PropTypes.node,
};

export default pure(ListItemArrowGroup);
