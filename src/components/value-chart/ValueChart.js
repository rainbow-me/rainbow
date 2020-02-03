import React from 'react';
import Chart from './Chart';
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
const dataSwitching = [
  dataColored,
  [dataColored1, dataColored2],
  [dataColored2, dataColored3],
  [data4],
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

class ValueChart extends React.Component {
  constructor(props) {
    super(props);

    colorIndex = 0;
    this.state = {
      currentChart: 0,
    };

    this.data = dataSwitching.map((sectionsData, index) => {
      return {
        name: index,
        segments: sectionsData.map((data, i) => {
          return {
            color: colorsArray[colorIndex++],
            line: i * 5,
            points: data.map(values => {
              return { x: values.timestamp, y: values.value };
            }),
            renderEndSeparor: () => null,
            renderStartSeparatator: () => null,
          };
        }),
      };
    });
  }

  render() {
    const change = this.state.currentChart % 2 == 0 ? 20 : -20; // placeholder

    return (
      <>
        <ValueText
          headerText="PRICE"
          direction={change > 0}
          change={change.toFixed(2)}
          ref={component => {
            this._text = component;
          }}
        />
        <Chart
          mode="gesture-managed" // "gesture-managed" / "detailed" / "simplified"
          enableSelect // enable checking value in touched point of chart
          onValueUpdate={value => {
            this._text.updateValue(value);
          }}
          currentDataSource={this.state.currentChart}
          amountOfPathPoints={150} // amount of points for switch between charts
          data={this.data}
          barColor={change > 0 ? colors.chartGreen : colors.red}
          stroke={{ detailed: 1.5, simplified: 3 }}
        />
        <TimespanSelector
          reloadChart={index => this.setState({ currentChart: index })}
          color={change > 0 ? colors.chartGreen : colors.red}
          isLoading={false}
        />
      </>
    );
  }
}

export default ValueChart;
