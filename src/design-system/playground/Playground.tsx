import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import RainbowContextWrapper from '../../helpers/RainbowContext';
import useHideSplashScreen from '../../hooks/useHideSplashScreen';
import { Box, DesignSystemProvider, Separator, Inline, Inset, Stack, Text } from '../';
import { ColorMode } from '../color/palettes';
import backgroundPlayground from '../components/BackgroundProvider/BackgroundProvider.playground';
import bleedPlayground from '../components/Bleed/Bleed.playground';
import boxPlayground from '../components/Box/Box.playground';
import columnsPlayground from '../components/Columns/Columns.playground';
import coverPlayground from '../components/Cover/Cover.playground';
import debugLayoutPlayground from '../components/DebugLayout/DebugLayout.playground';
import headingPlayground from '../components/Heading/Heading.playground';
import inlinePlayground from '../components/Inline/Inline.playground';
import insetPlayground from '../components/Inset/Inset.playground';
import markdownTextPlayground from '../components/MarkdownText/MarkdownText.playground';
import rowsPlayground from '../components/Rows/Rows.playground';
import separatorPlayground from '../components/Separator/Separator.playground';
import stackPlayground from '../components/Stack/Stack.playground';
import textPlayground from '../components/Text/Text.playground';
import textLinkPlayground from '../components/TextLink/TextLink.playground';
import { Docs, Example, Meta } from '../docs/types';
import { getSourceFromExample } from '../docs/utils/getSourceFromExample';

const allDocs = [
  backgroundPlayground,
  boxPlayground,
  bleedPlayground,
  columnsPlayground,
  coverPlayground,
  debugLayoutPlayground,
  headingPlayground,
  inlinePlayground,
  insetPlayground,
  markdownTextPlayground,
  rowsPlayground,
  separatorPlayground,
  stackPlayground,
  textPlayground,
  textLinkPlayground,
];

const styles = StyleSheet.create({
  docsRowToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 14,
  },
  layoutContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

const CodePreview = ({ wrapper = children => children, Example }: { wrapper: Example['wrapper']; Example: Example['Example'] }) => {
  const { element } = React.useMemo(() => getSourceFromExample({ Example }), [Example]);
  // @ts-expect-error Argument of type 'Source...' is not assignable to parameter of type 'ReactNode'.
  return <>{wrapper(element)}</>;
};

const ExamplePreview = ({ examples, name, subTitle, meta, wrapper, Example }: Example & { meta: Meta }) => {
  return (
    <Stack space="20px">
      {subTitle ? (
        <Text color="label" size="17pt" weight="medium">
          {subTitle}
        </Text>
      ) : (
        <Text color="label" size="17pt" weight="bold">
          {name}
        </Text>
      )}
      {Example && (
        <View style={meta.category === 'Layout' && meta.name !== 'Box' ? styles.layoutContainer : undefined}>
          <CodePreview Example={Example} wrapper={wrapper} />
        </View>
      )}
      {examples?.map((example, i) => (
        <Inset key={i} vertical="12px">
          <ExamplePreview {...example} meta={meta} />
        </Inset>
      ))}
    </Stack>
  );
};

const DocsRow = ({ meta, examples }: Docs) => {
  const [open, setOpen] = useState(false);

  return (
    <Stack space="44px">
      <TouchableOpacity onPress={useCallback(() => setOpen(x => !x), [setOpen])}>
        <Inline space="6px">
          <View style={styles.docsRowToggle}>
            <Text color="label" size="20pt" weight="heavy">
              {open ? '-' : '+'}
            </Text>
          </View>
          <Text color="label" size="20pt" weight="heavy">
            {meta.name}
          </Text>
        </Inline>
      </TouchableOpacity>
      {open
        ? examples?.map(({ name, subTitle, Example, examples, wrapper }, index) =>
            Example || examples ? (
              <ExamplePreview
                Example={Example}
                examples={examples}
                key={index}
                meta={meta}
                name={name}
                subTitle={subTitle}
                wrapper={wrapper}
              />
            ) : null
          )
        : null}
    </Stack>
  );
};

const colorModes: ColorMode[] = ['light', 'dark', 'darkTinted'];

const HideSplashScreen = ({ children }: { children: ReactNode }) => {
  const hideSplashScreen = useHideSplashScreen();
  useEffect(() => {
    hideSplashScreen();
  }, [hideSplashScreen]);

  return <>{children}</>;
};

export const Playground = () => {
  const [colorModeIndex, setColorModeIndex] = useState(0);
  const colorMode = colorModes[colorModeIndex];

  const toggleColorMode = useCallback(() => setColorModeIndex(currentIndex => (currentIndex + 1) % colorModes.length), [setColorModeIndex]);

  return (
    <HideSplashScreen>
      <RainbowContextWrapper>
        <DesignSystemProvider colorMode={colorMode}>
          <Box background="body (Deprecated)" flexGrow={1}>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
              {android ? <View style={{ height: StatusBar.currentHeight }} /> : null}
              <Inset space="20px">
                <Stack space="24px">
                  <TouchableOpacity onPress={toggleColorMode}>
                    <Text color="label" size="20pt" weight="heavy">
                      Color mode: {colorMode}
                    </Text>
                  </TouchableOpacity>
                  <Separator color="separator" />
                  {allDocs.map(({ meta, examples }, index) => (
                    <DocsRow examples={examples} key={index} meta={meta} />
                  ))}
                </Stack>
              </Inset>
            </ScrollView>
          </Box>
        </DesignSystemProvider>
      </RainbowContextWrapper>
    </HideSplashScreen>
  );
};
