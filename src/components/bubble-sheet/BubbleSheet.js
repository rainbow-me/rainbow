import React from 'react';
import { Column } from '../layout';
import { colors, shadow } from '@rainbow-me/styles';

const BubbleSheetBorderRadius = 30;

const BubbleSheet = props => (
  <Column
    css={`
      ${shadow.build(0, 10, 50, colors.black, 0.6)}
      background-color: ${colors.white};
      border-radius: ${BubbleSheetBorderRadius};
      flex-grow: 0;
      flex-shrink: 1;
      left: 0;
      position: absolute;
      right: 0;
      width: 100%;
    `}
    {...props}
  />
);

BubbleSheet.borderRadius = BubbleSheetBorderRadius;

export default BubbleSheet;
