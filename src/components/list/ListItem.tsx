import { isString } from 'lodash';
import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

const ListItemHeight = 56;

const renderIcon = (icon: any) =>
  isString(icon) ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Icon name={icon} style={position.sizeAsObject('100%')} />
  ) : (
    icon
  );

const ListItem = ({
  activeOpacity,
  children,
  justify,
  icon,
  iconMargin,
  label,
  scaleTo = 0.975,
  testID,
  disabled,
  ...props
}: any) => {
  const onPress = useCallback(() => {
    if (props.onPress) {
      props.onPress(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onPress, props.value]);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      activeOpacity={activeOpacity}
      disabled={disabled}
      enableHapticFeedback={false}
      onPress={onPress}
      scaleTo={scaleTo}
      testID={testID}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row
        align="center"
        css={padding(0, 18, 2, 19)}
        height={ListItemHeight}
        justify="space-between"
        {...props}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins
          align="center"
          flex={1}
          justify={justify}
          margin={iconMargin}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {icon && <Centered>{renderIcon(icon)}</Centered>}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TruncatedText
            color={colors.dark}
            flex={1}
            paddingRight={15}
            size="large"
          >
            {label}
          </TruncatedText>
        </RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
