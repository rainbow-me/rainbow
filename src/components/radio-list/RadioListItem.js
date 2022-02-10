import React, { useCallback } from 'react';
import Icon from '../icons/Icon';
import { ListItem } from '../list';
import styled from '@rainbow-me/styled-components';

const CheckmarkIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  name: 'checkmarkCircled',
}))({
  marginBottom: 1,
  position: 'absolute',
  right: 0,
  shadowColor: ({ theme: { colors, isDarkMode } }) =>
    colors.alpha(isDarkMode ? colors.shadow : colors.appleBlue, 0.4),
  shadowOffset: { height: 4, width: 0 },
  shadowRadius: 6,
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
