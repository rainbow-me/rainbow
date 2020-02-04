import { times } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { View } from 'react-primitives';
import { compose } from 'recompact';
import { useDispatch, useSelector } from 'react-redux';
import { withFabSendAction } from '../../hoc';
import { colors } from '../../styles';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyHeader from './TokenFamilyHeader';
import { setOpenFamilyTabs } from '../../redux/openStateSettings';

export const TokenFamilyWrapPaddingTop = 6;

const getHeight = openFamilyTab =>
  openFamilyTab ? UniqueTokenRow.height + 100 : 100;

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
  familyId,
  highlight,
  item,
  paddingTop,
  renderItem,
  title,
  ...props
}) => {
  const dispatch = useDispatch();
  const transitionRef = useRef();

  const [areChildrenVisible, setAreChildrenVisible] = useState(false);
  const isFamilyOpen = useSelector(
    ({ openStateSettings }) => openStateSettings.openFamilyTabs[familyId]
  );

  const timeoutHandle = useRef();
  const clearHandle = useCallback(
    () => timeoutHandle.current && clearTimeout(timeoutHandle.current),
    []
  );

  const handleHeaderPress = useCallback(
    () =>
      dispatch(setOpenFamilyTabs({ index: familyId, state: !isFamilyOpen })),
    [dispatch, familyId, isFamilyOpen]
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
    if (areChildrenVisible && !isFamilyOpen) {
      setAreChildrenVisible(false);
    } else if (!areChildrenVisible && isFamilyOpen) {
      timeoutHandle.current = setTimeout(
        showChildren,
        TokenFamilyHeader.animationDuration
      );
    }
    return () => clearHandle();
  }, [areChildrenVisible, clearHandle, isFamilyOpen, showChildren]);

  return (
    <View
      backgroundColor={colors.white}
      overflow="hidden"
      paddingTop={paddingTop}
    >
      <TokenFamilyHeader
        {...props}
        childrenAmount={childrenAmount}
        highlight={highlight}
        isOpen={isFamilyOpen}
        onPress={handleHeaderPress}
        title={title}
      />
      <Transitioning.View
        key={`tokenFamily_${familyId}_fadeIn`}
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
  familyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  highlight: PropTypes.bool,
  item: PropTypes.array,
  paddingTop: PropTypes.number,
  renderItem: PropTypes.func,
  title: PropTypes.string,
};

TokenFamilyWrap.getHeight = getHeight;

export default compose(withFabSendAction)(TokenFamilyWrap);
