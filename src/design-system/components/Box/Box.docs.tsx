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
        Renders an individual <Docs.Code>View</Docs.Code> element with quick access to the standard padding and negative margin scales, as
        well as other common layout properties. Ideally you&apos;re not supposed to need this component much unless you&apos;re building a
        design system component.
      </Docs.Text>
      <Docs.Text>
        If you need to render something other than a <Docs.Code>View</Docs.Code>, you can pass a component to the <Docs.Code>as</Docs.Code>{' '}
        prop.
      </Docs.Text>
    </>
  ),
  examples: [
    {
      ...examples.background,
      description: (
        <>
          <Docs.Text>
            To apply a background color, pass the <Docs.Code>background</Docs.Code> prop. If this prop is provided, the foreground color
            compatible children (e.g. <Docs.Code>Text</Docs.Code>) will render a foreground color that has sufficient contrast with the
            background color of Box.
          </Docs.Text>
          <Docs.Text>
            Below, you can see that the text color of <Docs.Code>surfacePrimary</Docs.Code> is dark, however, for{' '}
            <Docs.Code>accent</Docs.Code> it is light.
          </Docs.Text>
        </>
      ),
    },
    {
      ...examples.padding,
      showFrame: true,
      description: (
        <Docs.Text>
          To apply padding to the bounds of Box, pass the <Docs.Code>padding</Docs.Code> prop. The system also supports margin a particular
          direction or side, as seen below.
        </Docs.Text>
      ),
    },
    {
      ...examples.margin,
      description: (
        <Docs.Text>
          To apply margin to the bounds of Box, pass the <Docs.Code>margin</Docs.Code> prop. The system also supports margin a particular
          direction or side, as seen below.
        </Docs.Text>
      ),
    },
    {
      ...examples.borderRadius,
      description: (
        <Docs.Text>
          To apply a border radius, supply the <Docs.Code>borderRadius</Docs.Code> prop with a numerical pixel value. The system also
          supports border radius on directional or specific corners as seen below.
        </Docs.Text>
      ),
    },
    {
      ...examples.widths,
      description: (
        <Docs.Text>
          To apply a width, fractional values (e.g. <Docs.Code>1/3</Docs.Code>) or <Docs.Code>full</Docs.Code> can be supplied to the{' '}
          <Docs.Code>width</Docs.Code> prop. The <Docs.Code>width</Docs.Code> prop also supports the <Docs.Code>custom</Docs.Code> attribute
          for custom sizes.
        </Docs.Text>
      ),
    },
    examples.heights,
    {
      ...examples.shadows,
      description: (
        <Docs.Text>
          To apply a standard shadow, a size with an optional color variant (e.g. <Docs.Code>&quot;30px&quot;</Docs.Code> or{' '}
          <Docs.Code>&quot;30px accent&quot;</Docs.Code>) can be supplied to the <Docs.Code>shadow</Docs.Code> prop. Note that the default
          set of shadow colors are only applied in light mode.
        </Docs.Text>
      ),
      showFrame: true,
      examples: [
        {
          ...examples.shadowsWithCustom,
          description: (
            <Docs.Text>
              The <Docs.Code>shadow</Docs.Code> prop also accepts a custom shadow in the form of an object defining shadow properties for
              iOS and Android across light and dark modes. On iOS, shadows are applied as a stack from top to bottom, meaning that the first
              element of the array is the most front facing shadow, and the last is the back facing shadow.
            </Docs.Text>
          ),
        },
      ],
    },
    {
      name: 'Composition',
      description: (
        <>
          <Docs.Text>
            There may be cases where you want to compose <Docs.Code>Box</Docs.Code>, such as animated components. To render another element
            instead, you can use the <Docs.Code>as</Docs.Code> prop.
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
