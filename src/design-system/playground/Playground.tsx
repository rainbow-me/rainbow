import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHideSplashScreen } from '../../hooks';
import { Heading, Inline, Inset, Stack } from '../';
import backgroundDocs from '../components/BackgroundProvider/BackgroundProvider.docs';
import bleedDocs from '../components/Bleed/Bleed.docs';
import boxDocs from '../components/Box/Box.docs';
import columnsDocs from '../components/Columns/Columns.docs';
import headingDocs from '../components/Heading/Heading.docs';
import inlineDocs from '../components/Inline/Inline.docs';
import insetDocs from '../components/Inset/Inset.docs';
import markdownTextDocs from '../components/MarkdownText/MarkdownText.docs';
import rowDocs from '../components/Row/Row.docs';
import stackDocs from '../components/Stack/Stack.docs';
import textDocs from '../components/Text/Text.docs';
import textLinkDocs from '../components/TextLink/TextLink.docs';
import { Docs } from './Docs';

const allDocs = [
  backgroundDocs,
  bleedDocs,
  boxDocs,
  columnsDocs,
  headingDocs,
  inlineDocs,
  insetDocs,
  markdownTextDocs,
  rowDocs,
  stackDocs,
  textDocs,
  textLinkDocs,
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

const DocsRow = ({ name, category, examples }: Docs) => {
  const [open, setOpen] = useState(false);

  return (
    <Stack space="30px">
      <TouchableOpacity
        onPress={useCallback(() => setOpen(x => !x), [setOpen])}
      >
        <Inline space="6px">
          <View style={styles.docsRowToggle}>
            <Heading size="20px">{open ? '-' : '+'}</Heading>
          </View>
          <Heading size="20px">{name}</Heading>
        </Inline>
      </TouchableOpacity>
      {open
        ? examples.map((example, index) => (
            <Stack key={index} space="12px">
              <Heading size="18px" weight="bold">
                {example.name}
              </Heading>
              <View
                style={
                  category === 'Layout' && name !== 'Box'
                    ? styles.layoutContainer
                    : undefined
                }
              >
                {example.example}
              </View>
            </Stack>
          ))
        : null}
    </Stack>
  );
};

export const Playground = () => {
  const hideSplashScreen = useHideSplashScreen();
  useEffect(hideSplashScreen, [hideSplashScreen]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {android ? <View style={{ height: StatusBar.currentHeight }} /> : null}
      <Inset space="19px">
        <Stack space="24px">
          {allDocs.map(({ name, category, examples }, index) => (
            <DocsRow
              category={category}
              examples={examples}
              key={index}
              name={name}
            />
          ))}
        </Stack>
      </Inset>
    </ScrollView>
  );
};
