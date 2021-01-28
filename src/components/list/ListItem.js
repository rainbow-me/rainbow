import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withThemeContext } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import { padding, position } from '@rainbow-me/styles';

const ListItemHeight = 56;

const renderIcon = icon =>
  isString(icon) ? (
    <Icon name={icon} style={position.sizeAsObject('100%')} />
  ) : (
    icon
  );

const propTypes = {
  activeOpacity: PropTypes.number,
  children: PropTypes.node,
  icon: PropTypes.node,
  iconMargin: PropTypes.number,
  justify: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

const enhance = compose(
  withThemeContext,
  onlyUpdateForKeys(Object.keys(propTypes)),
  withHandlers({
    onPress: ({ onPress, value }) => () => {
      if (onPress) {
        onPress(value);
      }
    },
  })
);

const ListItem = enhance(
  ({
    activeOpacity,
    colors,
    children,
    justify,
    icon,
    iconMargin,
    label,
    onPress,
    scaleTo = 0.975,
    testID,
    disabled,
    ...props
  }) => (
    <ButtonPressAnimation
      activeOpacity={activeOpacity}
      disabled={disabled}
      enableHapticFeedback={false}
      onPress={onPress}
      scaleTo={scaleTo}
      testID={testID}
    >
      <Row
        align="center"
        css={padding(0, 18, 2, 19)}
        height={ListItemHeight}
        justify="space-between"
        {...props}
      >
        <RowWithMargins
          align="center"
          flex={1}
          justify={justify}
          margin={iconMargin}
        >
          {icon && <Centered>{renderIcon(icon)}</Centered>}
          <TruncatedText
            color={colors.dark}
            flex={1}
            paddingRight={15}
            size="large"
          >
            {label}
          </TruncatedText>
        </RowWithMargins>
        {children && <Centered flex={1}>{children}</Centered>}
      </Row>
    </ButtonPressAnimation>
  )
);

ListItem.propTypes = propTypes;

ListItem.height = ListItemHeight;

ListItem.defaultProps = {
  activeOpacity: 0.3,
  iconMargin: 9,
};

export default ListItem;
