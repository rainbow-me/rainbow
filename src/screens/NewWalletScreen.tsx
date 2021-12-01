import * as React from 'react';
import { useMemo, useState } from 'react';
import { compact, find, get, isEmpty, keys, map, toLower } from 'lodash';

import { Button, StyleSheet, View } from 'react-native';
import RecyclerView from '../rainbow-list/example/src/Example';
import { data as data1, data2 } from '../rainbow-list/example/src/data';
import sections from "./exampleSections"

const openFamilyTabs = {}
const showcase = true;

export default function App() {
    const {
        areSmallCollectibles,
        items,
        itemsCount,
        sectionsIndices,
        stickyComponentsIndices,
    } = useMemo(() => {
        const sectionsIndices: number[] = [];
        const stickyComponentsIndices: number[] = [];
        const items = sections.reduce((ctx: any[], section) => {
            sectionsIndices.push(ctx.length);
            if (section.pools) {
                ctx = ctx.concat([
                    {
                        data: section.data,
                        pools: true,
                        ...section.header,
                    },
                ]);
            } else {
                stickyComponentsIndices.push(ctx.length);
                ctx = ctx.concat([
                    {
                        isHeader: true,
                        ...section.header,
                    },
                ]);
                if (section.collectibles) {
                    section.data.forEach((item, index) => {
                        if (
                            item.isHeader ||
                            openFamilyTabs[item.familyName + (showcase ? '-showcase' : '')]
                        ) {
                            ctx.push({
                                familySectionIndex: index,
                                item: { ...item, ...section.perData },
                                renderItem: section.renderItem,
                            });
                        }
                    });
                } else {
                    ctx = ctx.concat(
                        section.data.map(item => ({
                            item: { ...item, ...section.perData },
                            renderItem: section.renderItem,
                        }))
                    );
                }
            }
            return ctx;
        }, []);
        items.push({ item: { isLastPlaceholder: true }, renderItem: () => null });
        const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(
            sections.find(e => e.collectibles)
        );
        return {
            areSmallCollectibles,
            items,
            itemsCount: items.length,
            sectionsIndices,
            stickyComponentsIndices,
        };
    }, [openFamilyTabs, sections, showcase]);

    console.log(items)

    console.log(items.length)
  const [visible, setVisible] = useState<boolean>(true);
  const [cut, setCut] = useState<boolean>(false);
  const [altered, setAltered] = useState<boolean>(false);
  const [reordered, setReordered] = useState<boolean>(false);

  const data = useMemo(() => {
    const currData = data1
      .map(a =>
        altered
          ? {
              ...a,
              nested: { prof: a.nested.prof.split('').reverse().join('') },
            }
          : a
      )
      .filter((_, i) => !cut || i > 5 || i < 3);
    if (!reordered) {
      return currData;
    }
    const [a, b, c, d, e, ...rest] = currData;
    return [a, b, e, c, d, ...rest];
  }, [altered, cut, reordered]);
  if (!visible) {
    return null;
  }
  console.log({ altered });

  return (
    <View style={styles.container}>
      <RecyclerView data={data} />
      <Button
        onPress={() => {
          setVisible(false);
          setTimeout(() => setVisible(true), 1000);
        }}
        title="reset"
      />
      <Button
        onPress={() => {
          setCut(prev => !prev);
        }}
        title="CUT"
      />
      <Button
        onPress={() => {
          setAltered(prev => !prev);
        }}
        title="Alter data"
      />
      <Button
        onPress={() => {
          setReordered(prev => !prev);
        }}
        title="Shuffle data"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  keys: {
    color: 'grey',
    fontSize: 14,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  textInput: {
    borderColor: 'black',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    marginVertical: 20,
    padding: 10,
  },
  title: {
    color: 'black',
    fontSize: 16,
    marginRight: 10,
  },
});
