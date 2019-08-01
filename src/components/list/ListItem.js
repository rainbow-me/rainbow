import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { fonts, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import {
  Centered,
  FlexItem,
  Row,
  RowWithMargins,
} from '../layout';
import { TruncatedText } from '../text';

const ListItemHeight = 54;

const renderIcon = icon => (
  isString(icon)
    ? <Icon name={icon} style={position.sizeAsObject('100%')} />
    : icon
);

const propTypes = {
  activeOpacity: PropTypes.number,
  children: PropTypes.node,
  icon: PropTypes.oneOfType([Icon.propTypes.name, PropTypes.node]),
  iconMargin: PropTypes.number,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

const enhance = compose(
  onlyUpdateForKeys(Object.keys(propTypes)),
  withHandlers({
    onPress: ({ onPress, value }) => () => {
      if (onPress) {
        onPress(value);
      }
    },
  }),
);

const ListItem = enhance(({
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
    <Row
      align="center"
      css={padding(0, 16, 2)}
      height={ListItemHeight}
      justify="space-between"
      {...props}
    >
      <RowWithMargins align="center" flex={1} margin={iconMargin}>
        {icon && <Centered>{renderIcon(icon)}</Centered>}
        <TruncatedText
          flex={1}
          paddingRight={fonts.size.bmedium}
          size="bmedium"
        >
          {label}
        </TruncatedText>
      </RowWithMargins>
      {children && (
        <Centered component={FlexItem} shrink={0}>
          {children}
        </Centered>
      )}
    </Row>
  </ButtonPressAnimation>
));

ListItem.propTypes = propTypes;

ListItem.height = ListItemHeight;

ListItem.defaultProps = {
  activeOpacity: 0.3,
  iconMargin: 9,
};

export default ListItem;
