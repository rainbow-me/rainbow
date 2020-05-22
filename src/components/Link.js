import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/primitives';
import { colors, padding } from '../styles';
import { magicMemo } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { RowWithMargins } from './layout';
import { Text } from './text';

const formatURLForDisplay = url => {
  const pretty = url.split('://')[1].replace('www.', '');
  return pretty.charAt(pretty.length - 1) === '/'
    ? pretty.substring(0, pretty.length - 1)
    : pretty;
};

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  ${padding(0, 15)};
`;

const Link = ({ url }) => {
  const handlePress = useCallback(() => Linking.openURL(url), [url]);

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={1.1}>
      <Container>
        <Icon color={colors.appleBlue} name="compass" />
        <Text color={colors.appleBlue} size="lmedium" weight="semibold">
          {formatURLForDisplay(url)}
        </Text>
      </Container>
    </ButtonPressAnimation>
  );
};

Link.propTypes = {
  url: PropTypes.string,
};

export default magicMemo(Link, 'url');
