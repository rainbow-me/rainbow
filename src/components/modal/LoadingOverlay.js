import { BlurView } from '@react-native-community/blur';
import PropTypes from 'prop-types';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors, position } from '../../styles';
import ActivityIndicator from '../ActivityIndicator';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered } from '../layout';
import { Text } from '../text';

const sx = StyleSheet.create({
  overlay: {
    backgroundColor: colors.alpha(colors.blueGreyDark, 0.15),
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 22,
    paddingHorizontal: 19,
    paddingTop: 19,
  },
  title: {
    marginLeft: 8,
  },
});

const Content = title => (
  <Centered style={sx.overlay}>
    <Centered zIndex={2}>
      <ActivityIndicator />
      {title && (
        <Text
          color={colors.blueGreyDark}
          lineHeight="none"
          size="large"
          style={sx.title}
          weight="semibold"
        >
          {title}
        </Text>
      )}
    </Centered>
    <BlurView
      {...position.coverAsObject}
      blurAmount={20}
      blurType="light"
      zIndex={1}
    />
  </Centered>
);

const LoadingOverlay = ({ title, ...props }) =>
  Platform.OS === 'android' ? (
    <View
      {...props}
      {...position.sizeAsObject('100%')}
      alignSelf="center"
      flex={1}
      zIndex={999}
    >
      {Content(title)}
    </View>
  ) : (
    <TouchableBackdrop
      {...props}
      {...position.sizeAsObject('100%')}
      disabled
      zIndex={999}
    >
      {Content(title)}
    </TouchableBackdrop>
  );

LoadingOverlay.propTypes = {
  title: PropTypes.string,
};

const neverRerender = () => true;
export default React.memo(LoadingOverlay, neverRerender);
