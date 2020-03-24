import { times } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { View } from 'react-primitives';
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
  isOpen,
  item,
  onToggle,
  renderItem,
  title,
  ...props
}) => {
  const transitionRef = useRef();
  const [areChildrenVisible, setAreChildrenVisible] = useState(false);

  const timeoutHandle = useRef();
  const clearHandle = useCallback(
    () => timeoutHandle.current && clearTimeout(timeoutHandle.current),
    []
  );

  const showChildren = useCallback(() => {
    if (!areChildrenVisible) {
      setAreChildrenVisible(true);
      if (transitionRef.current) {
        transitionRef.current.animateNextTransition();
      }
    }
  }, [areChildrenVisible]);

  useEffect(() => {
    clearHandle();
    if (areChildrenVisible && !isOpen) {
      setAreChildrenVisible(false);
    } else if (!areChildrenVisible && isOpen) {
      timeoutHandle.current = setTimeout(
        showChildren,
        TokenFamilyHeader.animationDuration
      );
    }
    return () => clearHandle();
  }, [areChildrenVisible, clearHandle, isOpen, showChildren]);

  return (
    <View
      backgroundColor={colors.white}
      overflow="hidden"
      paddingTop={isFirst ? TokenFamilyWrapPaddingTop : 0}
    >
      <TokenFamilyHeader
        {...props}
        childrenAmount={childrenAmount}
        highlight={highlight}
        isOpen={isOpen}
        onPress={onToggle}
        title={title}
      />
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
