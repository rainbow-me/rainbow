import React, {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';
import flattenChildren from 'react-flatten-children';
import { Space } from '../../layout/space';
import { Box } from '../Box/Box';

const alignHorizontalToFlexAlign = {
  center: 'center',
  left: 'flex-start',
  right: 'flex-end',
  stretch: 'stretch',
} as const;
type AlignHorizontal = keyof typeof alignHorizontalToFlexAlign;

export type StackProps = {
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
} & (
  | { space?: never; divider: ReactElement }
  | {
      space: Space;
      divider?: ReactElement;
    }
);

export const Stack = ({
  children,
  alignHorizontal,
  divider,
  space,
}: StackProps) => {
  if (__DEV__ && divider && !isValidElement(divider)) {
    throw new Error(`Stack: The 'divider' prop must be a React element`);
  }

  return (
    <Box
      alignItems={
        alignHorizontal
          ? alignHorizontalToFlexAlign[alignHorizontal]
          : undefined
      }
    >
      {Children.map(flattenChildren(children), (child, index) => (
        <>
          {divider && index > 0 ? (
            <Box
              alignItems={
                alignHorizontal
                  ? alignHorizontalToFlexAlign[alignHorizontal]
                  : undefined
              }
              paddingTop={space}
              width="full"
            >
              {divider}
            </Box>
          ) : null}
          {space && index > 0 ? <Box paddingTop={space}>{child}</Box> : child}
        </>
      ))}
    </Box>
  );
};
