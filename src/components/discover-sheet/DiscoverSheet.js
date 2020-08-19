import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BaseButton } from 'react-native-gesture-handler';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import { useNavigation } from '../../navigation';
import {
  YABSForm,
  YABSScrollView,
} from '../../react-native-yet-another-bottom-sheet';
import { deviceUtils } from '../../utils';

const Lorem = () => {
  const { navigate } = useNavigation();

  return (
    <View
      style={{
        paddingLeft: 19,
        paddingRight: 19,
      }}
    >
      <BaseButton onPress={() => navigate('ImportSeedPhraseSheet')}>
        <Text style={styles.panelTitle}>Discover</Text>
      </BaseButton>
      <Text>
        {[...Array(70)].map(
          () =>
            'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis  sunt in culpa. '
        )}
      </Text>
    </View>
  );
};

export function DiscoverSheetAndroid() {
  return (
    <YABSForm
      panGHProps={{
        simultaneousHandlers: 'AnimatedScrollViewPager',
      }}
      points={[0, 200, deviceUtils.dimensions.height - 200]}
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'white',
          bottom: 0,
          top: 100,
        },
      ]}
    >
      <View style={{ backgroundColor: 'yellow', height: 40, width: '100%' }} />
      <YABSScrollView>
        <Lorem />
      </YABSScrollView>
    </YABSForm>
  );
}

export function DiscoverSheetIOS() {
  const isFocused = useIsFocused();
  return (
    <SlackBottomSheet
      allowsDragToDismiss={false}
      allowsTapToDismiss={false}
      backgroundOpacity={0}
      blocksBackgroundTouches={false}
      initialAnimation={false}
      interactsWithOuterScrollView
      isHapticFeedbackEnabled={false}
      presentGlobally={false}
      scrollsToTopOnTapStatusBar={isFocused}
      topOffset={100}
      unmountAnimation={false}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <ScrollView
          contentContainerStyle={{ marginBottom: 20 }}
          style={{
            backgroundColor: 'white',
            marginBottom: -20,
            opacity: 1,
            paddingTop: 12,
          }}
        >
          <Lorem />
        </ScrollView>
      </View>
    </SlackBottomSheet>
  );
}

const styles = StyleSheet.create({
  panelTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
});
