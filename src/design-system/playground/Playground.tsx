import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import RainbowContextWrapper from '../../helpers/RainbowContext';
import useHideSplashScreen from '../../hooks/useHideSplashScreen';
import {
  Box,
  DesignSystemProvider,
  Divider,
  Heading,
  Inline,
  Inset,
  Stack,
  Text,
} from '../';
import { ColorMode } from '../color/palettes';
import backgroundPlayground from '../components/BackgroundProvider/BackgroundProvider.playground';
import bleedPlayground from '../components/Bleed/Bleed.playground';
import boxPlayground from '../components/Box/Box.playground';
import columnsPlayground from '../components/Columns/Columns.playground';
import debugLayoutPlayground from '../components/DebugLayout/DebugLayout.playground';
import dividerPlayground from '../components/Divider/Divider.playground';
import headingPlayground from '../components/Heading/Heading.playground';
import inlinePlayground from '../components/Inline/Inline.playground';
import insetPlayground from '../components/Inset/Inset.playground';
import markdownTextPlayground from '../components/MarkdownText/MarkdownText.playground';
import rowPlayground from '../components/Row/Row.playground';
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
  debugLayoutPlayground,
  dividerPlayground,
  headingPlayground,
  inlinePlayground,
  insetPlayground,
  markdownTextPlayground,
  rowPlayground,
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

const CodePreview = ({ Example }: { Example: Example['Example'] }) => {
  const { element } = React.useMemo(() => getSourceFromExample({ Example }), [
    Example,
  ]);
  return <>{element}</>;
};

const ExamplePreview = ({
  name,
  subTitle,
  meta,
  Example,
  examples,
}: Example & { meta: Meta }) => {
  return (
    <Stack space="19px">
      {subTitle ? (
        <Text size="16px" weight="medium">
          {subTitle}
        </Text>
      ) : (
        <Heading size="18px" weight="bold">
          {name}
        </Heading>
      )}
      {Example && (
        <View
          style={
            meta.category === 'Layout' && meta.name !== 'Box'
              ? styles.layoutContainer
              : undefined
          }
        >
          <CodePreview Example={Example} />
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
    <Stack space="42px">
      <TouchableOpacity
        onPress={useCallback(() => setOpen(x => !x), [setOpen])}
      >
        <Inline space="6px">
          <View style={styles.docsRowToggle}>
            <Heading size="20px">{open ? '-' : '+'}</Heading>
          </View>
          <Heading size="20px">{meta.name}</Heading>
        </Inline>
      </TouchableOpacity>
      {open
        ? examples?.map(({ name, subTitle, Example, examples }, index) =>
            Example || examples ? (
              <ExamplePreview
                Example={Example}
                examples={examples}
                key={index}
                meta={meta}
                name={name}
                subTitle={subTitle}
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
  useEffect(hideSplashScreen, [hideSplashScreen]);

  return <>{children}</>;
};

export const Playground = () => {
  const [colorModeIndex, setColorModeIndex] = useState(0);
  const colorMode = colorModes[colorModeIndex];

  const toggleColorMode = useCallback(
    () =>
      setColorModeIndex(currentIndex => (currentIndex + 1) % colorModes.length),
    [setColorModeIndex]
  );

  return (
    <HideSplashScreen>
      <RainbowContextWrapper>
        <DesignSystemProvider colorMode={colorMode}>
          <Box background="body" flexGrow={1}>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
              {android ? (
                <View style={{ height: StatusBar.currentHeight }} />
              ) : null}
              <Inset space="19px">
                <Stack space="24px">
                  <TouchableOpacity onPress={toggleColorMode}>
                    <Heading>Color mode: {colorMode}</Heading>
                  </TouchableOpacity>
                  <Divider />
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
