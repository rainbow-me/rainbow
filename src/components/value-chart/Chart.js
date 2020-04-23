import React, { Fragment, useMemo, useRef, useState } from 'react';
import { greaterThan, toFixedDecimals } from '../../helpers/utilities';
import { colors } from '../../styles';
import TimespanSelector from './TimespanSelector';
import ValueChart from './ValueChart';
import ValueText from './ValueText';
import { data1, data2, data3, dataColored2, dataColored3 } from './data';

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

export default function Chart({ change }) {
  const textInputRef = useRef(null);

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
              return { x: values[0], y: values[1] };
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

  const positiveChange = greaterThan(change, 0);

  return (
    <Fragment>
      <ValueText
        headerText="PRICE"
        direction={positiveChange}
        change={toFixedDecimals(change, 2)}
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
        barColor={positiveChange ? colors.green : colors.red}
        stroke={{ detailed: 1.5, simplified: 3 }}
        importantPointsIndexInterval={25}
      />
      <TimespanSelector
        reloadChart={setCurrentChart}
        color={positiveChange ? colors.green : colors.red}
        isLoading={false}
      />
    </Fragment>
  );
}
