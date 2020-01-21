import React from 'react';
import Chart from './Chart';
import ValueText from './ValueText';
import {
  // data1,
  // data2,
  // data3,
  // data4,
  dataColored1,
  dataColored2,
  dataColored3,
} from './data';
// const dataSwitching = [data1, data2, data3, data4];
const dataColored = [dataColored1, dataColored2, dataColored3];

class ValueChart extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const change = 20;

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
          amountOfPathPoints={50} // amount of points for switch between charts
          autoGenerateImportantPoints // you can specify if you want to select important points in data or do it automatically inside chart
          // data={dataSwitching}
          data={dataColored}
          // data={[
          //   {
          //     name: '1W',
          //     segments: [
          //       {
          //         color: 'red',
          //         line: 'dotted',
          //         points: [
          //           {
          //             important: true,
          //             timestamp: 0,
          //             value: 0,
          //           },
          //         ],
          //         renderStartSeparator: () => null, // or renderEndSeparator
          //       },
          //     ],
          //   },
          // ]}

          // TODO:
          // currentDataSource={0}
        />
      </>
    );
  }
}

export default ValueChart;
