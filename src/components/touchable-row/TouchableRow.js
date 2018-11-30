import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { fonts, padding, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered, FlexItem, Row } from '../layout';
import { TruncatedText } from '../text';

const TouchableRowHeight = 54;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 16, 2)};
  height: ${TouchableRowHeight};
`;

const Label = styled(TruncatedText).attrs({
  size: 'bmedium',
})`
  flex: 1;
  padding-right: ${fonts.size.bmedium};
`;

const renderTouchableRowIcon = icon => (
  isString(icon)
    ? (
      <Icon
        name={icon}
        style={position.sizeAsObject('100%')}
      />
    ) : icon
);

const TouchableRow = ({ children, icon, label, ...props }) => (
  <Container component={TouchableOpacity} {...props}>
    <Row align="center" flex={1}>
      {icon && (
        <Centered>
          {renderTouchableRowIcon(icon)}
        </Centered>
      )}
      <Label>{label}</Label>
    </Row>
    {children && (
      <Centered component={FlexItem} shrink={0}>
        {children}
      </Centered>
    )}
  </Container>
);

TouchableRow.propTypes = {
  icon: PropTypes.oneOfType([Icon.propTypes.name, PropTypes.node]),
  label: PropTypes.string.isRequired,
};

TouchableRow.height = TouchableRowHeight;

export default TouchableRow;
