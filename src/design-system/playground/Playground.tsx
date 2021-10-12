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
import bleedDocs from '../components/Bleed/Bleed.docs';
import headingDocs from '../components/Heading/Heading.docs';
import inlineDocs from '../components/Inline/Inline.docs';
import insetDocs from '../components/Inset/Inset.docs';
import markdownTextDocs from '../components/MarkdownText/MarkdownText.docs';
import stackDocs from '../components/Stack/Stack.docs';
import textDocs from '../components/Text/Text.docs';
import textLinkDocs from '../components/TextLink/TextLink.docs';
import { Docs } from './Docs';

const allDocs = [
  bleedDocs,
  headingDocs,
  inlineDocs,
  insetDocs,
  markdownTextDocs,
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
});

const DocsRow = ({ name, examples }: Docs) => {
  const [open, setOpen] = useState(false);

  return (
    <Stack space="30dp">
      <TouchableOpacity
        onPress={useCallback(() => setOpen(x => !x), [setOpen])}
      >
        <Inline space="6dp">
          <View style={styles.docsRowToggle}>
            <Heading size="title">{open ? '-' : '+'}</Heading>
          </View>
          <Heading size="title">{name}</Heading>
        </Inline>
      </TouchableOpacity>
      {open
        ? examples.map((example, index) => (
            <Stack key={index} space="30dp">
              <Heading weight="bold">{example.name}</Heading>
              <View>{example.example}</View>
            </Stack>
          ))
        : null}
    </Stack>
  );
};

export const Playground = () => {
  const hideSplashScreen = useHideSplashScreen();
  useEffect(() => hideSplashScreen(), [hideSplashScreen]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {android ? <View style={{ height: StatusBar.currentHeight }} /> : null}
      <Inset space="gutter">
        <Stack space="30dp">
          {allDocs.map(({ name, examples }, index) => (
            <DocsRow examples={examples} key={index} name={name} />
          ))}
        </Stack>
      </Inset>
    </ScrollView>
  );
};
