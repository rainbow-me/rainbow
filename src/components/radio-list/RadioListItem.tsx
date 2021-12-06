import React, { useCallback } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../icons/Icon' was resolved to '/Users/nic... Remove this comment to see the full error message
import Icon from '../icons/Icon';
import { ListItem } from '../list';

const CheckmarkIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  name: 'checkmarkCircled',
}))`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.appleBlue, 0.4)};
  margin-bottom: 1px;
  position: absolute;
  right: 0;
`;

const RadioListItem = ({ disabled, selected, ...props }: any) => {
  const onPress = useCallback(() => {
    if (props.onPress && !props.disabled) {
      props.onPress(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, props.onPress, disabled]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ListItem onPress={onPress} opacity={disabled ? 0.42 : 1} {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {selected && <CheckmarkIcon />}
    </ListItem>
  );
};

export default RadioListItem;
