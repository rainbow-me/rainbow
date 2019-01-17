import { upperCase, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  hoistStatics,
  onlyUpdateForPropTypes,
  withProps,
} from 'recompact';
import styled from 'styled-components/primitives';
import { Centered, Column } from './layout';
import { Text as TextElement } from './text';
import { colors, padding } from '../styles';

const TagBorderRadius = 7;

const Container = styled(Column)`
  ${padding(7, 10)};
  background-color: ${colors.white};
  border-radius: ${TagBorderRadius};
  text-align: left;
  z-index: 1;
`;

const OuterBorder = styled(Centered)`
  border-color: ${colors.alpha(colors.black, 0.06)};
  border-radius: ${TagBorderRadius};
  border-width: 1;
  flex: none;
  overflow: hidden;
  z-index: 2;
`;

const Text = styled(TextElement).attrs({
  color: colors.blueGreyLighter,
  size: 'medium',
  weight: 'medium',
})`
  letter-spacing: -0.18px;
  line-height: 18;
`;

const Title = styled(TextElement).attrs({
  color: colors.blueGreyLighter,
  size: 'tiny',
  weight: 'medium',
})`
  letter-spacing: 0.3px;
  line-height: 13;
  margin-bottom: 1;
  opacity: 0.7;
`;

const Tag = ({ text, title, ...props }) => (
  <OuterBorder {...props}>
    <Container>
      <Title>{title}</Title>
      <Text>{text}</Text>
    </Container>
  </OuterBorder>
);

Tag.propTypes = {
  text: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

const enhance = compose(
  withProps(({ text, title }) => ({
    text: upperFirst(text),
    title: upperCase(title),
  })),
  onlyUpdateForPropTypes,
);

export default hoistStatics(enhance)(Tag);
