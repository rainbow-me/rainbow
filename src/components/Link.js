import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../styles';
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

const Link = ({ url }) => (
  <ButtonPressAnimation scaleTo={1.1} transformOrigin={[0, 0.5]}>
    <RowWithMargins align="center" margin={5} paddingVertical={11}>
      <Icon color={colors.appleBlue} name="compass" size={16} />
      <Text
        color={colors.appleBlue}
        lineHeight={17}
        size="lmedium"
        weight="medium"
      >
        {formatURLForDisplay(url)}
      </Text>
    </RowWithMargins>
  </ButtonPressAnimation>
);

Link.propTypes = {
  url: PropTypes.string,
};

export default magicMemo(Link, 'url');
