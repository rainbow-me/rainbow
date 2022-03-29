import React from 'react';
import { Row } from '../../layout';
import { Text } from '@rainbow-me/design-system';

export const SwapDetailsLabel = ({ children, color = 'secondary50' }) => {
  return (
    <Text color={color} size="14px" weight="semibold">
      {children}
    </Text>
  );
};

export const SwapDetailsValue = ({ children, color = 'secondary' }) => {
  return (
    <Text color={color} size="14px" weight="bold">
      {children}
    </Text>
  );
};

export default function SwapDetailsRow({
  children,
  label,
  labelColor,
  ...props
}) {
  return (
    <Row justify="space-between" {...props}>
      <SwapDetailsLabel color={labelColor}>{label}</SwapDetailsLabel>
      <SwapDetailsValue>{children}</SwapDetailsValue>
    </Row>
  );
}
