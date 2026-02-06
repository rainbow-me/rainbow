import { useTextStyle } from '@/design-system/components/Text/useTextStyle';
import MaskedView from '@react-native-masked-view/masked-view';
import React, { memo, useMemo } from 'react';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

interface GradientTextProps extends LinearGradientProps {
  bleed?: number;
  children: React.ReactElement<any>;
}

const GradientText = memo(function GradientText({
  children,
  bleed = 0,
  start = { x: 0, y: 0.5 },
  end = { x: 1, y: 0.5 },
  ...linearGradientProps
}: GradientTextProps) {
  let textStyle = useTextStyle({
    align: children.props.align,
    color: children.props.color,
    size: children.props.size,
    tabularNumbers: children.props.tabularNumbers,
    uppercase: children.props.uppercase,
    weight: children.props.weight,
  });

  textStyle = {
    ...textStyle,
    marginTop: 0,
    marginBottom: 0,
  };

  const invisibleChild = useMemo(() => {
    return React.cloneElement(children, {
      style: [textStyle, children.props.style, { opacity: 0 }],
    });
  }, [children, textStyle]);

  const visibleChild = useMemo(() => {
    return React.cloneElement(children, {
      style: [textStyle, children.props.style],
    });
  }, [children, textStyle]);

  return (
    <MaskedView style={{ marginTop: textStyle.marginTop, marginBottom: textStyle.marginBottom }} maskElement={visibleChild}>
      <LinearGradient
        start={start}
        end={end}
        pointerEvents="none"
        style={{ margin: -bleed }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...linearGradientProps}
      >
        {invisibleChild}
      </LinearGradient>
    </MaskedView>
  );
});

export default GradientText;
