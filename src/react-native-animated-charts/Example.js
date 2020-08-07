import React, { useState } from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  View,
} from 'react-native';
import { data1, data2, softData } from './data';
import { Chart, ChartDot, ChartPath, ChartXLabel, ChartYLabel } from './index';
export const { width: SIZE } = Dimensions.get('window');

export const formatUSD = value => {
  'worklet';
  if (value === '') {
    return '';
  }
  return `$ ${value.toLocaleString('en-US', {
    currency: 'USD',
  })}`;
};

export const formatDatetime = value => {
  'worklet';
  if (value === '') {
    return '';
  }
  const date = new Date(Number(value));
  const s = date.getSeconds();
  const m = date.getMinutes();
  const h = date.getHours();
  const d = date.getDate();
  const n = date.getMonth();
  const y = date.getFullYear();
  return `${y}-${n}-${d} ${h}:${m}:${s}`;
};

function Example() {
  const [data, setData] = useState(data1);
  if (!TurboModuleRegistry.get('NativeReanimated')) {
    return null;
  }

  return (
    <View style={{ backgroundColor: 'black' }}>
      <Chart data={data}>
        <ChartPath
          fill="none"
          height={SIZE / 2}
          stroke="red"
          strokeWidth="0.005"
          width={SIZE}
        />
        <ChartDot
          style={{
            backgroundColor: 'blue',
          }}
        />
        <ChartYLabel
          format={formatUSD}
          style={{ backgroundColor: 'white', margin: 4 }}
        />
        <ChartXLabel
          format={formatDatetime}
          style={{ backgroundColor: 'white', margin: 4 }}
        />
      </Chart>
      <TouchableOpacity onPress={() => setData(data1)}>
        <Text style={{ color: 'white' }}>Data 1</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setData(softData)}>
        <Text style={{ color: 'white' }}>Data 1 simplified</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setData(data2)}>
        <Text style={{ color: 'white' }}>Data 2</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Example;
