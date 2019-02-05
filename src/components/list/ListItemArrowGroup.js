import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';

const ListItemArrowGroup = ({ children }) => (
  <Row align="center" justify="end" style={{ opacity: 0.6 }}>
    <Text color="blueGreyDark" size="bmedium" style={{ marginRight: 6 }}>
      {children}
    </Text>
    <Icon
      color={colors.blueGreyDark}
      name="caretThin"
      style={{ width: 11 }}
    />
  </Row>
);

ListItemArrowGroup.propTypes = {
  children: PropTypes.node,
};

export default pure(ListItemArrowGroup);
