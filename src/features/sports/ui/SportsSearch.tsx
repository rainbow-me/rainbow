import { useMemo, useState, type ReactElement } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { debounce } from 'lodash';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import Input from '@/components/inputs/Input';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { fonts } from '@/design-system/typography/typography';
import { type SportsHost } from '@/features/sports/core/browse';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { useCleanup } from '@/hooks/useCleanup';
import * as i18n from '@/languages';

export function SportsSearch({ host, color, backgroundColor }: { host: SportsHost; color: string; backgroundColor: string }): ReactElement {
  const navigation = sportsNavigationStores[host];
  const [text, setText] = useState(() => navigation.getState().query ?? '');
  const search = useMemo(() => debounce((query: string) => navigation.getState().search(query), 250), [navigation]);

  useCleanup(() => search.cancel(), [search]);

  return (
    <View style={styles.row}>
      <View style={[styles.field, { backgroundColor }]}>
        <TextIcon color="labelTertiary" size="icon 17px" weight="bold">
          {'􀊫'}
        </TextIcon>
        <Input
          autoFocus
          value={text}
          onChangeText={value => {
            setText(value);
            search(value);
          }}
          onSubmitEditing={() => search.flush()}
          placeholder={i18n.t(i18n.l.sports.search)}
          returnKeyType="search"
          style={[styles.input, { color }]}
          testID="sports-search"
        />
      </View>
      <ButtonPressAnimation
        onPress={() => {
          search.cancel();
          Keyboard.dismiss();
          navigation.getState().search(null);
        }}
        scaleTo={0.96}
      >
        <Text color="label" size="15pt" weight="bold">
          {i18n.t(i18n.l.sports.cancel)}
        </Text>
      </ButtonPressAnimation>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  field: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    ...fonts.SFProRounded.semibold,
    flex: 1,
    fontSize: 17,
    letterSpacing: 0.37,
    height: 46,
  },
});
