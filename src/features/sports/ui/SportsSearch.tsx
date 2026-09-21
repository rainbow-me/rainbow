import { useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { debounce } from 'lodash';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import Input from '@/components/inputs/Input';
import { Text, TextIcon, useForegroundColor } from '@/design-system';
import { type SportsHost } from '@/features/sports/core/browse';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import * as i18n from '@/languages';

export function SportsSearch({ host }: { host: SportsHost }) {
  const [text, setText] = useState(() => useSportsStore.getState().hosts[host].request.query ?? '');
  const label = useForegroundColor('label');
  const fill = useForegroundColor('fillQuaternary');
  const search = useMemo(() => debounce((query: string) => sportsActions.setSearch(host, query), 250), [host]);
  useEffect(() => () => search.cancel(), [search]);

  return (
    <View style={styles.row}>
      <View style={[styles.field, { backgroundColor: fill }]}>
        <TextIcon color="labelTertiary" size="17pt" weight="bold">
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
          style={[styles.input, { color: label }]}
          testID="sports-search"
        />
      </View>
      <ButtonPressAnimation
        onPress={() => {
          search.cancel();
          Keyboard.dismiss();
          sportsActions.setSearch(host, null);
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
  row: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { flex: 1, height: 46, borderRadius: 23, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 17, fontWeight: '600', height: 46 },
});
