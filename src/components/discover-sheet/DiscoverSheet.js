import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BaseButton } from 'react-native-gesture-handler';
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

function DiscoverSheet() {
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

export default DiscoverSheet;

const styles = StyleSheet.create({
  panelTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
});
