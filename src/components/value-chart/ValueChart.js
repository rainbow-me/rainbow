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

const dataSwitching = [data1, data2, data3, data4];
const dataColored = [dataColored1, dataColored2, dataColored3];

class ValueChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentChart: 0,
    };

    this.data = [
      {
        name: 'Detailed',
        sections: dataColored.map(data => {
          return {
            color: 'red',
            line: 'dotted',
            points: data.map(values => {
              return { x: values.timestamp, y: values.value };
            }),
            renderEndSeparor: () => null,
            renderStartSeparatator: () => null,
          };
        }),
      },
    ];

    this.data = dataSwitching.map((data, index) => {
      return {
        name: index,
        segments: [
          {
            color: 'red',
            line: 'dotted',
            points: data.map(values => {
              return { x: values.timestamp, y: values.value };
            }),
            renderEndSeparor: () => null,
            renderStartSeparatator: () => null,
          },
        ],
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
          // DONE:
          mode="detailed" // "gesture-managed" / "detailed" / "simplified"
          enableSelect // enable checking value in touched point of chart
          onValueUpdate={value => {
            this._text.updateValue(value);
          }}
          // INPROGRESS:
          currentDataSource={this.state.currentChart}
          // TODO:
          amountOfPathPoints={200} // amount of points for switch between charts
          autoGenerateImportantPoints // you can specify if you want to select important points in data or do it automatically inside chart
          // data={dataSwitching}
          data={dataSwitching}
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
