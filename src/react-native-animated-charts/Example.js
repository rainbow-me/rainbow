import React, { useState } from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  View,
} from 'react-native';
import { data1, data2, softData, softData2, splineSoftData } from './data';
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
  const [data, setData] = useState({ points: data1 });

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
          strokeWidth="2"
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
      <TouchableOpacity
        onPress={() => setData({ points: data1, smoothing: 0 })}
      >
        <Text style={{ color: 'white' }}>Data 1</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setData({ points: softData, smoothing: 0 })}
      >
        <Text style={{ color: 'white' }}>Data 1 simplified</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setData({ points: data2, smoothing: 0 })}
      >
        <Text style={{ color: 'white' }}>Data 2</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setData({ points: softData2, smoothing: 0.2 })}
      >
        <Text style={{ color: 'white' }}>
          Data 2 simple not splined beziered
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setData({ points: softData2, smoothing: 0 })}
      >
        <Text style={{ color: 'white' }}>Data 2 simple not splined</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setData({ points: splineSoftData, smoothing: 0 })}
      >
        <Text style={{ color: 'white' }}>Data 2 simple splined</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Example;
