import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import TokenFamilyHeader, { TokenFamilyHeaderAnimationDuration } from './TokenFamilyHeader';
import { times } from '@/helpers/utilities';
import { useTimeout } from '@/hooks';
import { ThemeContextProps } from '@/theme';

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
  const transitionRef = useRef<any | null>(null);

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
      <View
        style={{
          paddingTop: areChildrenVisible ? TokenFamilyWrapPaddingTop : 0,
        }}
      >
        {/* @ts-expect-error times fn returns unknown[] type which is not acceptable by React 18 */}
        {areChildrenVisible ? times(item.length, renderItem) : null}
      </View>
    </View>
  );
});
