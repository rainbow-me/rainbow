import React, { useMemo, useState, useRef } from 'react';
import ValueChart from './ValueChart';
import ValueText from './ValueText';
import {
  data1,
  data2,
  data3,
  data4,
  dataColored1,
  dataColored2,
  dataColored3,
} from './data';
import TimespanSelector from './TimespanSelector';
import { colors } from '../../styles';

const dataColored = [dataColored1, dataColored2, dataColored3];
const dataSwitching1 = [
  dataColored,
  [dataColored1, dataColored2],
  [dataColored2, dataColored3],
  [data4],
];

const dataSwitching2 = [
  [data2],
  [data1],
  [dataColored2, dataColored3],
  [data3],
];

const colorsArray = [
  colors.red,
  colors.grey,
  colors.green,
  colors.purple,
  colors.red,
  colors.green,
  colors.red,
  colors.purple,
  colors.green,
  colors.grey,
  colors.green,
  colors.purple,
];

let colorIndex = 0;

export default function Chart() {
  const textInputRef = useRef(null);

  // eslint-disable-next-line no-unused-vars
  const data1 = useMemo(() => {
    colorIndex = 0;
    return dataSwitching1.map((sectionsData, index) => {
      return {
        name: index,
        segments: sectionsData.map((data, i) => {
          return {
            color: colorsArray[colorIndex++],
            line: i * 5,
            points: data.map(values => {
              return {
                isImportant: Math.random() < 0.05 ? true : false,
                x: values.timestamp,
                y: values.value,
              };
            }),
            renderStartSeparator:
              colorIndex % 2 !== 0
                ? {
                    fill: colorsArray[colorIndex],
                    r: 7,
                    stroke: 'white',
                    strokeWidth: colorIndex + 2,
                  }
                : undefined,
          };
        }),
      };
    });
  }, []);

  const data2 = useMemo(() => {
    colorIndex = 0;
    return dataSwitching2.map((sectionsData, index) => {
      return {
        name: index,
        segments: sectionsData.map((data, i) => {
          return {
            color: colorsArray[colorIndex++],
            line: i * 5,
            points: data.map(values => {
              return { x: values.timestamp, y: values.value };
            }),
            renderStartSeparator:
              colorIndex % 2 !== 0
                ? {
                    fill: colorsArray[colorIndex],
                    r: 7,
                    stroke: 'white',
                    strokeWidth: colorIndex + 2,
                  }
                : undefined,
          };
        }),
      };
    });
  }, []);

  const [currentChart, setCurrentChart] = useState(0);
  const change = currentChart % 2 === 0 ? 20 : -20; // placeholder

  return (
    <>
      <ValueText
        headerText="PRICE"
        direction={change > 0}
        change={change.toFixed(2)}
        ref={textInputRef}
      />
      <ValueChart
        mode="gesture-managed"
        enableSelect
        onValueUpdate={value => {
          textInputRef.current.updateValue(value);
        }}
        currentDataSource={currentChart}
        amountOfPathPoints={100}
        data={data2}
        barColor={change > 0 ? colors.chartGreen : colors.red}
        stroke={{ detailed: 1.5, simplified: 3 }}
        importantPointsIndexInterval={25}
      />
      <TimespanSelector
        reloadChart={setCurrentChart}
        color={change > 0 ? colors.chartGreen : colors.red}
        isLoading={false}
      />
    </>
  );
}
