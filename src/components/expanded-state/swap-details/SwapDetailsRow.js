import React, { Fragment } from 'react';
import { ButtonPressAnimation } from '../../animations';
import { Row } from '../../layout';
import { Text } from '@/design-system';

export const SwapDetailsLabel = ({ children, color = 'secondary60 (Deprecated)' }) => {
  return (
    <Text color={color} size="14px / 19px (Deprecated)" weight="semibold">
      {children}
    </Text>
  );
};

export const SwapDetailsValue = ({ children, color = 'secondary80 (Deprecated)' }) => {
  return (
    <Text color={color} size="14px / 19px (Deprecated)" weight="bold">
      {children}
    </Text>
  );
};

export default function SwapDetailsRow({ children, label, labelColor, labelPress, valuePress, ...props }) {
  const LabelWrapper = labelPress ? ButtonPressAnimation : Fragment;
  const ValueWrapper = valuePress ? ButtonPressAnimation : Fragment;

  return (
    <Row justify="space-between" {...props}>
      <LabelWrapper onPress={labelPress}>
        <SwapDetailsLabel color={labelColor}>{label}</SwapDetailsLabel>
      </LabelWrapper>
      <ValueWrapper onPress={valuePress}>
        <SwapDetailsValue>{children}</SwapDetailsValue>
      </ValueWrapper>
    </Row>
  );
}
