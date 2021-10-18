import * as React from 'react';
import { useMemo, useState } from 'react';

import { Button, StyleSheet, View } from 'react-native';
import RecyclerView from './Example';
import { data as data1, data2 } from './data';


export default function App() {
  const [visible, setVisible] = useState<boolean>(true);
  const [cut, setCut] = useState<boolean>(false);
  const [altered, setAltered] = useState<boolean>(false)
  const [reordered, setReordered] = useState<boolean>(false)




  const data = useMemo(() => {
    const currData = data1.map(a => altered ? {...a, nested: { prof:  a.nested.prof.split("").reverse().join("")  }} : a).filter((_, i) => ! cut || (i > 5 || i < 3));
    if (!reordered) {
      return currData
    }
    const [a, b, c, d, e, ...rest] = currData;
    return [a, b, e, c, d, ...rest]
  }, [altered, cut, reordered])
  if (!visible) {
    return null;
  }
  console.log({ altered })

  return (
    <View style={styles.container}>

      <RecyclerView data={data}/>
      <Button title={"reset"} onPress={() => {
        setVisible(false);
        setTimeout(() => setVisible(true), 1000)
      }} />
      <Button title={"CUT"} onPress={() => {
        setCut(prev => !prev)
      }} />
      <Button title={"Alter data"} onPress={() => {
        setAltered(prev => !prev)
      }} />
      <Button title={"Shuffle data"} onPress={() => {
        setReordered(prev => !prev)
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  keys: {
    fontSize: 14,
    color: 'grey',
  },
  title: {
    fontSize: 16,
    color: 'black',
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    marginVertical: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'black',
    borderRadius: 5,
    padding: 10,
  },
});
