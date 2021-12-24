import React, { useCallback } from 'react';
import Icon from '../icons/Icon';
import { ListItem } from '../list';
import styled from 'rainbowed-components';

const CheckmarkIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  name: 'checkmarkCircled',
}))({
  // TODO terru
  // box-shadow: 0px 4px 6px
  // ${({ theme: { colors, isDarkMode } }) =>
  // colors.alpha(isDarkMode ? colors.shadow : colors.appleBlue, 0.4)};
  marginBottom: 1,
  position: 'absolute',
  right: 0,
});

const RadioListItem = ({ disabled, selected, ...props }) => {
  const onPress = useCallback(() => {
    if (props.onPress && !props.disabled) {
      props.onPress(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, props.onPress, disabled]);
  return (
    <ListItem onPress={onPress} opacity={disabled ? 0.42 : 1} {...props}>
      {selected && <CheckmarkIcon />}
    </ListItem>
  );
};

export default RadioListItem;
