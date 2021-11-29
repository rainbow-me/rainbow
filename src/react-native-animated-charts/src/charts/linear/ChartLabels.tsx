import { TextInput, TextInputProps } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ChartLabelProps extends TextInputProps {
  format: (value: string) => string;
}

const ChartLabelFactory = (fieldName: 'originalX' | 'originalY') => {
  const ChartLabel: React.FC<ChartLabelProps> = ({ format, ...props }) => {
    const chartData = useChartData();
    const val = chartData[fieldName];

    const textProps = useAnimatedProps(
      () => ({
        text: format ? format(val.value) : val.value,
        value: format ? format(val.value) : val.value,
      }),
      []
    );

    return (
      <AnimatedTextInput
        {...props}
        animatedProps={textProps}
        editable={false}
      />
    );
  };

  return ChartLabel;
};

export const ChartYLabel = ChartLabelFactory('originalY');
export const ChartXLabel = ChartLabelFactory('originalX');
