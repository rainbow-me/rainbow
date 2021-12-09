/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from './Box';

const docs: DocsType = {
  name: 'Box',
  category: 'Layout',
  description: [
    <Docs.Text key="">
      Renders an individual <Docs.Code>View</Docs.Code> element with quick
      access to the standard padding and negative margin scales, as well as
      other common layout properties. Ideally you&apos;re not supposed to need
      this component much unless you&apos;re building a design system component.
    </Docs.Text>,
    <Docs.Text key="">
      If you need to render something other than a <Docs.Code>View</Docs.Code>,
      you can pass a component to the <Docs.Code>as</Docs.Code> prop.
    </Docs.Text>,
  ],
  examples: [
    {
      name: 'Background',
      description: [
        <Docs.Text key="">
          To apply a background color, pass the{' '}
          <Docs.Code>background</Docs.Code> prop. If this prop is provided, the
          foreground colour compatible children (e.g.{' '}
          <Docs.Code>Text</Docs.Code>) will render a foreground color that has
          sufficient contrast with the background color of Box.
        </Docs.Text>,
        <Docs.Text key="">
          Below, you can see that the foreground color of{' '}
          <Docs.Code>body</Docs.Code> is dark grey, however, for{' '}
          <Docs.Code>accent</Docs.Code> it is light.
        </Docs.Text>,
      ],
      Example: () =>
        source(
          <>
            <Box background="body" padding="19px">
              <Text size="18px" weight="bold">
                Body
              </Text>
            </Box>
            <Box background="accent" padding="19px">
              <Text size="18px" weight="bold">
                Accent
              </Text>
            </Box>
            <Box background="action" padding="19px">
              <Text size="18px" weight="bold">
                Action
              </Text>
            </Box>
            <Box background="swap" padding="19px">
              <Text size="18px" weight="bold">
                Swap
              </Text>
            </Box>
          </>
        ),
    },
    {
      name: 'Padding',
      description: [
        <Docs.Text key="">
          To apply padding to the bounds of Box, pass the{' '}
          <Docs.Code>padding</Docs.Code> prop. The system also supports margin a
          particular direction or side, as seen below.
        </Docs.Text>,
      ],
      Example: () =>
        source(
          <Stack space="12px">
            <Box background="body" padding="19px">
              <Placeholder />
            </Box>
            <Box background="body" paddingHorizontal="19px">
              <Placeholder />
            </Box>
            <Box background="body" paddingVertical="19px">
              <Placeholder />
            </Box>
            <Box background="body" paddingLeft="19px">
              <Placeholder />
            </Box>
            <Box background="body" paddingRight="19px">
              <Placeholder />
            </Box>
            <Box background="body" paddingTop="19px">
              <Placeholder />
            </Box>
            <Box background="body" paddingBottom="19px">
              <Placeholder />
            </Box>
          </Stack>
        ),
    },
    {
      name: 'Margin',
      description: [
        <Docs.Text key="">
          To apply margin to the bounds of Box, pass the{' '}
          <Docs.Code>margin</Docs.Code> prop. The system also supports margin a
          particular direction or side, as seen below.
        </Docs.Text>,
      ],
      Example: () =>
        source(
          <Stack space="12px">
            <Box background="body" margin="-19px">
              <Placeholder />
            </Box>
            <Inset vertical="19px">
              <Box background="body" marginHorizontal="-19px">
                <Placeholder />
              </Box>
            </Inset>
            <Box background="body" marginVertical="-19px">
              <Placeholder />
            </Box>
            <Inset vertical="19px">
              <Box background="body" marginLeft="-19px">
                <Placeholder />
              </Box>
            </Inset>
            <Box background="body" marginRight="-19px">
              <Placeholder />
            </Box>
            <Inset vertical="19px">
              <Box background="body" marginTop="-19px">
                <Placeholder />
              </Box>
            </Inset>
            <Box background="body" marginBottom="-19px">
              <Placeholder />
            </Box>
          </Stack>
        ),
    },
    {
      name: 'Border radius',
      description: [
        <Docs.Text key="">
          To apply a border radius, supply the{' '}
          <Docs.Code>borderRadius</Docs.Code> prop with a numerical pixel value.
          The system also supports border radius on directional or specific
          corners as seen below.
        </Docs.Text>,
      ],
      Example: () =>
        source(
          <Stack space="24px">
            <Box background="accent" borderRadius={16} padding="19px" />
            <Box background="accent" borderLeftRadius={16} padding="19px" />
            <Box background="accent" borderRightRadius={16} padding="19px" />
            <Box background="accent" borderTopRadius={16} padding="19px" />
            <Box background="accent" borderBottomRadius={16} padding="19px" />
            <Box
              background="accent"
              borderBottomLeftRadius={16}
              padding="19px"
            />
            <Box
              background="accent"
              borderBottomRightRadius={16}
              padding="19px"
            />
            <Box background="accent" borderTopLeftRadius={16} padding="19px" />
            <Box background="accent" borderTopRightRadius={16} padding="19px" />
          </Stack>
        ),
    },
    {
      name: 'Widths',
      description: [
        <Docs.Text key="">
          To apply a width, fractional values (e.g. <Docs.Code>1/3</Docs.Code>)
          or <Docs.Code>full</Docs.Code> can be supplied to the{' '}
          <Docs.Code>width</Docs.Code> prop.
        </Docs.Text>,
      ],
      Example: () =>
        source(
          <Stack space="12px">
            <Box background="accent" padding="24px" width="1/3" />
            <Box background="accent" padding="24px" width="full" />
          </Stack>
        ),
    },
    {
      name: 'Composition',
      description: [
        <Docs.Text key="">
          There may be cases where you want to compose{' '}
          <Docs.Code>Box</Docs.Code>, such as animated components. To render
          another element instead, you can use the <Docs.Code>as</Docs.Code>{' '}
          prop.
        </Docs.Text>,
        <Docs.CodeBlock
          code={`const offsetX = useSharedValue(0);

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
);`}
          key=""
        />,
      ],
    },
  ],
};

export default docs;
