import React from 'react';
import styled from 'styled-components/primitives';
import Toast from './Toast';
import { useInvalidPaste } from '@rainbow-me/hooks';

const StyledToast = styled(Toast)`
  position: absolute;
  bottom: 15;
`;

export default function InvalidPasteToast(props) {
  const { isInvalidPaste } = useInvalidPaste();

  return (
    <StyledToast
      isVisible={isInvalidPaste}
      text="􀉾 You can't paste that here"
      {...props}
    />
  );
}
