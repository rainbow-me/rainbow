import PropTypes from 'prop-types';
import React, { Children, Component } from 'react';
import { Animated, Easing } from 'react-native';
import styled from 'styled-components';
import { deviceUtils } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AnimatedPagerItem' was resolved to '/Use... Remove this comment to see the full error message
import AnimatedPagerItem from './AnimatedPagerItem';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const buildPagerAnimation = (toValue: any) => ({
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
  isInteraction: false,
  toValue,
  useNativeDriver: true,
});

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  ${position.cover};
  overflow: hidden;
`;

export default class AnimatedPager extends Component {
  static propTypes = {
    children: PropTypes.node,
    isOpen: PropTypes.bool.isRequired,
    width: PropTypes.number,
  };

  static defaultProps = {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
    width: deviceUtils.dimensions.width - 31,
  };

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isOpen' does not exist on type 'Readonly... Remove this comment to see the full error message
  componentDidUpdate = () => this.onAnimatePages(this.props.isOpen);

  componentWillUnmount() {
    this.translateValues.page1.stopAnimation();
    this.translateValues.page2.stopAnimation();
  }

  translateValues = {
    page1: new Animated.Value(0),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type 'Readonly<... Remove this comment to see the full error message
    page2: new Animated.Value(this.props.width),
  };

  onAnimatePages = (isOpen: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const { width } = this.props;
    const { page1, page2 } = this.translateValues;

    const page1TargetValue = isOpen ? width * -1 : 0;
    const page2TargetValue = isOpen ? 0 : width;

    return Animated.parallel([
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'void' is not assignable to type 'CompositeAn... Remove this comment to see the full error message
      Animated.timing(page1, buildPagerAnimation(page1TargetValue)).start(),
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'void' is not assignable to type 'CompositeAn... Remove this comment to see the full error message
      Animated.timing(page2, buildPagerAnimation(page2TargetValue)).start(),
    ]);
  };

  render = () => {
    const { children, ...props } = this.props;
    const pages = Children.toArray(children).slice(0, 2);

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Container {...props}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AnimatedPagerItem translateX={this.translateValues.page1}>
          {pages[0]}
        </AnimatedPagerItem>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AnimatedPagerItem translateX={this.translateValues.page2}>
          {pages[1]}
        </AnimatedPagerItem>
      </Container>
    );
  };
}
