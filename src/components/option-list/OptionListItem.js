import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { colors, fonts, padding, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered, Row } from '../layout';
import { TruncatedText } from '../text';

const OptionListItemHeight = 54;

const CheckmarkSize = 20;
const Checkmark = styled(Icon).attrs({
  color: colors.appleBlue,
  name: 'checkmarkCircled',
})`
  ${position.size(CheckmarkSize)}
`;

const CheckmarkContainer = styled(Centered)`
  ${position.size(CheckmarkSize)}
  flex-shrink: 0;
`;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 16, 2)};
  height: ${OptionListItemHeight};
`;

const IconContainer = styled(Centered)`
  height: 100%;
  margin-right: 9;
  width: 23;
`;

const Label = styled(TruncatedText).attrs({ size: 'bmedium' })`
  flex: 1;
  padding-right: ${fonts.size.bmedium};
`;

const OptionListItem = ({
  icon,
  label,
  selected,
  ...props
}) => (
  <Container component={TouchableOpacity} {...props}>
    <Row align="center" flex={1}>
      {icon && (
        <IconContainer>
          {isString(icon)
            ? <Icon name={icon} style={position.sizeAsObject('100%')} />
            : icon
          }
        </IconContainer>
      )}
      <Label>{label}</Label>
    </Row>
    <CheckmarkContainer>
      {selected && <Checkmark />}
    </CheckmarkContainer>
  </Container>
);

OptionListItem.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.oneOfType([Icon.propTypes.name, PropTypes.node]),
  selected: PropTypes.bool,
};

OptionListItem.height = OptionListItemHeight;

export default OptionListItem;
