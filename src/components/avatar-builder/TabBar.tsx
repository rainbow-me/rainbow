import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Categories } from './Categories';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const TabBar = ({ categoryKeys, activeCategory, onPress }: any) => {
  const { colors } = useTheme();
  return categoryKeys.map((c: any) => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const category = Categories[c];
    if (c !== 'all')
      return (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ButtonPressAnimation
          activeOpacity={1}
          duration={100}
          enableHapticFeedback
          key={category.name}
          onPress={() => onPress(category)}
          scaleTo={0.75}
          style={{
            alignItems: 'center',
            flex: 1,
            height: 30,
            justifyContent: 'center',
            maxWidth: 30,
          }}
        >
          {category === activeCategory && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <LinearGradient
              // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
              borderRadius={15}
              colors={['#FFB114', '#FF54BB', '#00F0FF']}
              end={{ x: 0, y: 0.5 }}
              opacity={0.1}
              overflow="hidden"
              pointerEvents="none"
              start={{ x: 1, y: 0.5 }}
              style={position.coverAsObject}
            />
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Icon
            color={
              category === activeCategory
                ? null
                : colors.alpha(colors.blueGreyDark, 0.4)
            }
            name={category.icon}
          />
        </ButtonPressAnimation>
      );
    return null;
  });
};

export default TabBar;
