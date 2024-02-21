/* eslint-disable @typescript-eslint/ban-types */
/*
Adapted from Radix's react-polymorphic package
https://github.com/radix-ui/primitives/tree/main/packages/react/polymorphic
Modified to remove DOM-specific types, otherwise <Box as="div"> is valid

---

MIT License

Copyright (c) 2020 Modulz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as React from 'react';

/* -------------------------------------------------------------------------------------------------
 * Utility types
 * -----------------------------------------------------------------------------------------------*/
type Merge<P1 = {}, P2 = {}> = Omit<P1, keyof P2> & P2;

/**
 * Infers the OwnProps if E is a ForwardRefExoticComponentWithAs
 */
type OwnProps<E> = E extends ForwardRefComponent<any, infer P> ? P : {};

/**
 * Infers the JSX.IntrinsicElement if E is a ForwardRefExoticComponentWithAs
 */
type IntrinsicElement<E> = E extends ForwardRefComponent<infer I, any> ? I : never;

type ForwardRefExoticComponent<E, OwnProps> = React.ForwardRefExoticComponent<
  Merge<E extends React.ElementType ? React.ComponentPropsWithRef<E> : never, OwnProps & { as?: E }>
>;

/* -------------------------------------------------------------------------------------------------
 * ForwardRefComponent
 * -----------------------------------------------------------------------------------------------*/

interface ForwardRefComponent<
  DefaultComponentType,
  OwnProps = {},
  /**
   * Extends original type to ensure built in React types play nice
   * with polymorphic components still e.g. `React.ElementRef` etc.
   */
> extends ForwardRefExoticComponent<DefaultComponentType, OwnProps> {
  /**
   * When `as` prop is passed, use this overload.
   * Merges original own props (without DOM props) and the inferred props
   * from `as` element with the own props taking precendence.
   *
   * We explicitly avoid `React.ElementType` and manually narrow the prop types
   * so that events are typed when using JSX.IntrinsicElements.
   */
  <As = DefaultComponentType>(
    props: As extends React.ComponentType<infer P> ? Merge<P, OwnProps & { as: As }> : never
  ): React.ReactElement | null;
}

export type { ForwardRefComponent, OwnProps, IntrinsicElement, Merge };
