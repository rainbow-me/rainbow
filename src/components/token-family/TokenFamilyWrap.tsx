import { times } from 'lodash';
import React, {
  LegacyRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import TokenFamilyHeader, {
  TokenFamilyHeaderAnimationDuration,
} from './TokenFamilyHeader';
import { useTimeout } from '@rainbow-me/hooks';
import { ThemeContextProps } from '@rainbow-me/theme';

type Props = {
  childrenAmount: number;
  isFirst?: boolean;
  isHeader?: boolean;
  isOpen?: boolean;
  item: any;
  familyImage: string;
  onToggle: () => void;
  renderItem: (i: number) => JSX.Element;
  theme: ThemeContextProps;
  title: string;
};

export const TokenFamilyWrapPaddingTop = 6;

const transition = (
  <Transition.In
    durationMs={75}
    interpolation="easeIn"
    propagation="top"
    type="fade"
  />
);

export default React.memo(function TokenFamilyWrap({
  childrenAmount,
  isFirst,
  isHeader,
  isOpen,
  item,
  onToggle,
  familyImage,
  renderItem,
  theme,
  title,
}: Props) {
  const [areChildrenVisible, setAreChildrenVisible] = useState(false);
  const [startTimeout, stopTimeout] = useTimeout();
  const transitionRef = useRef();

  const showChildren = useCallback(() => {
    if (!areChildrenVisible) {
      setAreChildrenVisible(true);
      transitionRef.current?.animateNextTransition();
    }
  }, [areChildrenVisible]);

  useEffect(() => {
    stopTimeout();
    if (areChildrenVisible && !isOpen) {
      setAreChildrenVisible(false);
    } else if (!areChildrenVisible && isOpen) {
      startTimeout(showChildren, TokenFamilyHeaderAnimationDuration);
    }
  }, [areChildrenVisible, isOpen, showChildren, startTimeout, stopTimeout]);

  return (
    <View
      style={{
        backgroundColor: theme.colors.white,
        overflow: 'hidden',
        paddingTop: isFirst ? TokenFamilyWrapPaddingTop : 0,
      }}
    >
      {isHeader ? (
        <TokenFamilyHeader
          childrenAmount={childrenAmount}
          familyImage={familyImage}
          isOpen={isOpen}
          onPress={onToggle}
          theme={theme}
          title={title}
        />
      ) : null}
      <Transitioning.View
        ref={transitionRef as LegacyRef<any>}
        style={{
          paddingTop: areChildrenVisible ? TokenFamilyWrapPaddingTop : 0,
        }}
        transition={transition}
      >
        {areChildrenVisible ? times(item.length, renderItem) : null}
      </Transitioning.View>
    </View>
  );
});
