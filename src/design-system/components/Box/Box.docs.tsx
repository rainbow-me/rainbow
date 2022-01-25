/* eslint-disable sort-keys-fix/sort-keys-fix */
import dedent from 'dedent';
import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import * as examples from './Box.examples';
import meta from './Box.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Renders an individual <Docs.Code>View</Docs.Code> element with quick
        access to the standard padding and negative margin scales, as well as
        other common layout properties. Ideally you&apos;re not supposed to need
        this component much unless you&apos;re building a design system
        component.
      </Docs.Text>
      <Docs.Text>
        If you need to render something other than a <Docs.Code>View</Docs.Code>
        , you can pass a component to the <Docs.Code>as</Docs.Code> prop.
      </Docs.Text>
    </>
  ),
  examples: [
    {
      ...examples.background,
      description: (
        <>
          <Docs.Text>
            To apply a background color, pass the{' '}
            <Docs.Code>background</Docs.Code> prop. If this prop is provided,
            the foreground colour compatible children (e.g.{' '}
            <Docs.Code>Text</Docs.Code>) will render a foreground color that has
            sufficient contrast with the background color of Box.
          </Docs.Text>
          <Docs.Text>
            Below, you can see that the foreground color of{' '}
            <Docs.Code>body</Docs.Code> is dark grey, however, for{' '}
            <Docs.Code>accent</Docs.Code> it is light.
          </Docs.Text>
        </>
      ),
    },
    {
      ...examples.padding,
      description: (
        <Docs.Text>
          To apply padding to the bounds of Box, pass the{' '}
          <Docs.Code>padding</Docs.Code> prop. The system also supports margin a
          particular direction or side, as seen below.
        </Docs.Text>
      ),
    },
    {
      ...examples.margin,
      description: (
        <Docs.Text>
          To apply margin to the bounds of Box, pass the{' '}
          <Docs.Code>margin</Docs.Code> prop. The system also supports margin a
          particular direction or side, as seen below.
        </Docs.Text>
      ),
    },
    {
      ...examples.borderRadius,
      description: (
        <Docs.Text>
          To apply a border radius, supply the{' '}
          <Docs.Code>borderRadius</Docs.Code> prop with a numerical pixel value.
          The system also supports border radius on directional or specific
          corners as seen below.
        </Docs.Text>
      ),
    },
    {
      ...examples.widths,
      description: (
        <Docs.Text>
          To apply a width, fractional values (e.g. <Docs.Code>1/3</Docs.Code>)
          or <Docs.Code>full</Docs.Code> can be supplied to the{' '}
          <Docs.Code>width</Docs.Code> prop. The <Docs.Code>width</Docs.Code>{' '}
          prop also supports the <Docs.Code>custom</Docs.Code> attribute for
          custom sizes.
        </Docs.Text>
      ),
    },
    examples.heights,
    {
      name: 'Composition',
      description: (
        <>
          <Docs.Text>
            There may be cases where you want to compose{' '}
            <Docs.Code>Box</Docs.Code>, such as animated components. To render
            another element instead, you can use the <Docs.Code>as</Docs.Code>{' '}
            prop.
          </Docs.Text>
          <Docs.CodeBlock
            code={dedent`
              const offsetX = useSharedValue(0);

              const animatedStyles = useAnimatedStyle(() => ({
                transform: [
                  {
                    translateX: withSpring(offsetX.value),
                  },
                ],
              }));

              return (
                <>
                  <Box as={Animated.View} style={animatedStyles} />
                  <TouchableOpacity onPress={() => (offsetX.value = 100)}>
                    <Text>
                      Move
                    </Text>
                  </TouchableOpacity>
                </>
              );
            `}
          />
        </>
      ),
    },
  ],
};

export default docs;
