import { times } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { View } from 'react-primitives';
import { useTimeout } from '../../hooks';
import { colors } from '../../styles';
import TokenFamilyHeader from './TokenFamilyHeader';

export const TokenFamilyWrapPaddingTop = 6;

const transition = (
  <Transition.In
    durationMs={75}
    interpolation="easeIn"
    propagation="top"
    type="fade"
  />
);

const TokenFamilyWrap = ({
  childrenAmount,
  highlight,
  isFirst,
  isHeader,
  isOpen,
  item,
  onToggle,
  renderItem,
  title,
  ...props
}) => {
  const [areChildrenVisible, setAreChildrenVisible] = useState(false);
  const [startTimeout, stopTimeout] = useTimeout();
  const transitionRef = useRef();

  const showChildren = useCallback(() => {
    if (!areChildrenVisible) {
      setAreChildrenVisible(true);
      if (transitionRef.current) {
        transitionRef.current.animateNextTransition();
      }
    }
  }, [areChildrenVisible]);

  useEffect(() => {
    stopTimeout();
    if (areChildrenVisible && !isOpen) {
      setAreChildrenVisible(false);
    } else if (!areChildrenVisible && isOpen) {
      startTimeout(showChildren, TokenFamilyHeader.animationDuration);
    }
  }, [areChildrenVisible, isOpen, showChildren, startTimeout, stopTimeout]);

  return (
    <View
      backgroundColor={colors.white}
      overflow="hidden"
      paddingTop={isFirst ? TokenFamilyWrapPaddingTop : 0}
    >
      {isHeader ? (
        <TokenFamilyHeader
          {...props}
          childrenAmount={childrenAmount}
          highlight={highlight}
          isOpen={isOpen}
          onPress={onToggle}
          title={title}
        />
      ) : null}
      {/*
          XXX 👇️👇️👇️👇️ not sure if this Transitioning.View should have a `key` defined for performance or not
      */}
      <Transitioning.View
        paddingTop={areChildrenVisible ? TokenFamilyWrapPaddingTop : 0}
        ref={transitionRef}
        transition={transition}
      >
        {areChildrenVisible ? times(item.length, renderItem) : null}
      </Transitioning.View>
    </View>
  );
};

TokenFamilyWrap.propTypes = {
  childrenAmount: PropTypes.number,
  highlight: PropTypes.bool,
  isFirst: PropTypes.bool,
  isOpen: PropTypes.bool,
  item: PropTypes.array,
  onToggle: PropTypes.func,
  renderItem: PropTypes.func,
  title: PropTypes.string,
};

export default TokenFamilyWrap;
