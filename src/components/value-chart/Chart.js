import React, { Fragment, useCallback, useMemo, useRef, useState,  } from 'react';
import { greaterThan, toFixedDecimals } from '../../helpers/utilities';
import { colors } from '../../styles';
import { Column } from '../layout';
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

const chartStroke = { detailed: 1.5, simplified: 3 };

let colorIndex = 0;

const Chart = ({ change, ...props }) => {
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

  const valueRef = useRef(null);
  const [curVal, setCurVal] = useState(0);

  const handleValueUpdate = useCallback(v => {
    // console.log('value update', v);
    setCurVal(v);
    // textInputRef.current = v;
  }, [setCurVal]);

// lol => {
//           lol = valueRef.current;
//           console.log('lol', lol);
//           return lol;
//         }

  console.log('HAPPENIGN');

  return (
    <Column
      overflow="hidden"
      paddingBottom={21}
      paddingTop={19}
      width="100%"
      {...props}
    >
      <ValueText
        change={toFixedDecimals(change, 2)}
        direction={positiveChange}
        headerText="PRICE"
        ref={textInputRef}
        value={curVal}
      />
      <ValueChart
        amountOfPathPoints={100}
        barColor={positiveChange ? colors.chartGreen : colors.red}
        currentDataSource={currentChart}
        data={data2}
        enableSelect
        importantPointsIndexInterval={25}
        mode="gesture-managed"
        onValueUpdate={handleValueUpdate}
        stroke={chartStroke}
      />
      <TimespanSelector
        color={positiveChange ? colors.chartGreen : colors.red}
        isLoading={false}
        reloadChart={setCurrentChart}
      />
    </Column>
  );
};

export default React.memo(Chart);
