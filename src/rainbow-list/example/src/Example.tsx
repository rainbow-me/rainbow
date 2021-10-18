// @ts-disable
import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { ReText } from 'react-native-redash';
import {
  RecyclerRow,
  RecyclerView,
  UltraFastText,
  useRowTypesLayout,
  useSharedDataAtIndex,
  useUltraFastData,
  usePosition,
} from './List';
import type { DataCell } from './data';

function ContactCell() {
  const position = usePosition();
  const text = useDerivedValue(() => 'pos: ' + position!.value);
  //const color2 = useDerivedValue(() => data.value?.color);
  //const color = useDerivedValue(() => {
  //   const name = data.value?.name ?? '';
  //   const colors = ['red', 'green', 'blue', 'white', 'yellow'];
  //   let hash = 0,
  //     i,
  //     chr;
  //   if (name.length === 0) return hash;
  //   for (i = 0; i < name.length - 2; i++) {
  //     chr = name.charCodeAt(i);
  //     hash = (hash << 5) - hash + chr;
  //     hash |= 0;
  //   }
  //   return colors[Math.abs(hash) % 5];
  // });
  const circleStyle = useAnimatedStyle(() => ({
    opacity: (position?.value ?? 0 % 10) / 10,
    backgroundColor: 'red',
  }));
  // const circleStyle2 = useAnimatedStyle(() => ({
  //   opacity: (data.value?.index ?? 0 % 10) / 10,
  //   backgroundColor: 'red',
  // }));
  //
  // const wrapperStyle = useAnimatedStyle(() => ({
  //   height: data.value.color === "green" ? 200 : 100,
  // }));

  const {
    nested: { prof },
  } = useUltraFastData<DataCell>(); // const pr of = "nested.prof"

  return (
    <RecyclerRow
      style={
        {
          //height: reactiveData?.color === "green" ? 200 : 100,
        }
      }
    >
      <View
        style={[
          {
            // height: reactiveData?.color === "green" ? 200 : 100,
            height: 100,
            borderWidth: 2,
            backgroundColor: 'grey',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          },
        ]}
      >
        {/*<Animated.View*/}
        {/*  style={[*/}
        {/*    {*/}
        {/*      backgroundColor: reactiveData?.color,*/}
        {/*      width: 60,*/}
        {/*      height: 60,*/}
        {/*      borderRadius: 30,*/}
        {/*      marginRight: 20,*/}
        {/*    },*/}
        {/*  ]}*/}
        {/*/>*/}
        <Animated.View
          style={[
            circleStyle,
            {
              width: 30,
              height: 30,
              borderRadius: 30,
              marginRight: 20,
            },
          ]}
        />
        {/*<Animated.View*/}
        {/*  style={[*/}
        {/*    circleStyle2,*/}
        {/*    {*/}
        {/*      width: 30,*/}
        {/*      height: 30,*/}
        {/*      borderRadius: 30,*/}
        {/*      marginRight: 20,*/}
        {/*    },*/}
        {/*  ]}*/}
        {/*/>*/}
        {/*<UltraFastText binding={name} />*/}
        {/*<UltraFastSwtich binding={"type"} >*/}
        {/*  <UltraFastCase type="loading"/>*/}
        {/*</UltraFastSwtich>*/}

        {/*<UltraFastText binding={name} />*/}
        <ReText text={text} style={{ width: 120 }} />
        <UltraFastText binding={prof} />

        {/*<RecyclableText style={{ width: '70%' }}>Beata Kozidrak</RecyclableText>*/}
      </View>
    </RecyclerRow>
  );
}

function ContactCell2() {
  // const { name } = useUltraFastData<DataCell>(); // const prof = "nested.prof"

  const data = useSharedDataAtIndex();
  // const reactiveData = useReactiveDataAtIndex();
  //console.log(reactiveData)
  const text = useDerivedValue(() => {
    return data.value?.nested?.prof ?? 'NONE';
  });

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: 'red',
  }));

  return (
    <RecyclerRow
      style={{
        height: 80,
        //height: reactiveData?.color === "green" ? 200 : 100,
      }}
    >
      <ReText text={text} />
      <Animated.View
        style={[
          {
            width: 30,
            height: 30,
            borderRadius: 30,
            marginRight: 20,
          },
        ]}
      />
      <Animated.View
        style={[
          circleStyle,
          {
            width: 30,
            height: 30,
            borderRadius: 30,
            marginRight: 20,
          },
        ]}
      />
    </RecyclerRow>
  );
}

function HeaderCell() {
  return (
    <RecyclerRow
      style={{
        height: 70,
        backgroundColor: 'blue',
        //height: reactiveData?.color === "green" ? 200 : 100,
      }}
    >
      <Text>Header</Text>
    </RecyclerRow>
  );
}

export default function Example({ data }: { data: DataCell[] }) {
  const layoutProvider = useRowTypesLayout(() => ({
    header: {
      view: <HeaderCell />,
      maxRendered: 2,
    },
    type1: <ContactCell />,
    type2: <ContactCell2 />,
  }));

  const getViewType = useCallback(
    (d) => (d.index === 0 ? 'header' : d.index % 2 === 0 ? 'type2' : 'type1'),
    []
  );
  const isSticky = useCallback((_, __, i) => i === 0, []);
  const getHash = useCallback((d) => d.name, []);

  return (
    <>
      <RecyclerView<DataCell>
        getViewType={getViewType}
        data={data}
        getIsSticky={isSticky}
        getHash={getHash}
        layoutProvider={layoutProvider}
        style={{ width: '100%', height: 600 }}
      />
    </>
  );
}
