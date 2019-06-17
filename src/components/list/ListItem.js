import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  onlyUpdateForPropTypes,
  setStatic,
  withHandlers,
} from 'recompact';
import styled from 'styled-components';
import { fonts, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Icon from '../icons/Icon';
import {
  Centered,
  FlexItem,
  Row,
  RowWithMargins,
} from '../layout';
import { TruncatedText } from '../text';

const ListItemHeight = 54;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 16, 2)};
  height: ${ListItemHeight};
`;

const Label = styled(TruncatedText).attrs({
  size: 'bmedium',
})`
  flex: 1;
  padding-right: ${fonts.size.bmedium};
`;

const renderListItemIcon = icon => (
  isString(icon)
    ? <Icon name={icon} style={position.sizeAsObject('100%')} />
    : icon
);

const ListItem = ({
  activeOpacity,
  children,
  icon,
  iconMargin,
  label,
  onPress,
  ...props
}) => (
  <ButtonPressAnimation
    activeOpacity={activeOpacity}
    enableHapticFeedback={false}
    onPress={onPress}
    scaleTo={1}
  >
    <Container {...props}>
      <RowWithMargins align="center" flex={1} margin={iconMargin}>
        {icon && (
          <Centered>
            {renderListItemIcon(icon)}
          </Centered>
        )}
        <Label>{label}</Label>
      </RowWithMargins>
      {children && (
        <Centered component={FlexItem} shrink={0}>
          {children}
        </Centered>
      )}
    </Container>
  </ButtonPressAnimation>
);

ListItem.propTypes = {
  activeOpacity: PropTypes.number,
  children: PropTypes.node,
  icon: PropTypes.oneOfType([Icon.propTypes.name, PropTypes.node]),
  iconMargin: PropTypes.number,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

ListItem.defaultProps = {
  activeOpacity: 0.3,
  iconMargin: 9,
};

export default compose(
  setStatic({ height: ListItemHeight }),
  withHandlers({
    onPress: ({ onPress, value }) => () => {
      if (onPress) {
        onPress(value);
      }
    },
  }),
  onlyUpdateForPropTypes,
)(ListItem);
