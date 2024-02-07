import { isString } from 'lodash';
import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import { padding, position } from '@/styles';

const ListItemHeight = 56;

const renderIcon = icon => (isString(icon) ? <Icon name={icon} style={position.sizeAsObject('100%')} /> : icon);

const rowStyle = padding.object(0, 18, 2, 19);

const ListItem = ({ activeOpacity, children, justify, icon, iconMargin, label, scaleTo = 0.975, testID, disabled, ...props }) => {
  const onPress = useCallback(() => {
    if (props.onPress) {
      props.onPress(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onPress, props.value]);
  const { colors } = useTheme();
  return (
    <ButtonPressAnimation
      activeOpacity={activeOpacity}
      disabled={disabled}
      enableHapticFeedback={false}
      onPress={onPress}
      scaleTo={scaleTo}
      testID={testID}
    >
      <Row align="center" height={ListItemHeight} justify="space-between" style={rowStyle} {...props}>
        <RowWithMargins align="center" flex={1} justify={justify} margin={iconMargin}>
          {icon && <Centered>{renderIcon(icon)}</Centered>}
          <TruncatedText color={colors.dark} flex={1} paddingRight={15} size="large">
            {label}
          </TruncatedText>
        </RowWithMargins>
        {children && <Centered flex={1}>{children}</Centered>}
      </Row>
    </ButtonPressAnimation>
  );
};

ListItem.height = ListItemHeight;

ListItem.defaultProps = {
  activeOpacity: 0.3,
  iconMargin: 9,
};

export default ListItem;
