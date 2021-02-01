import * as React from 'react';
import Svg, { LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export type AxisIconProps = {
  readonly size: number;
};

export default function AxisIcon({ size }: AxisIconProps): JSX.Element {
  const { colors } = useTheme();
  return (
    <Svg height={size} viewBox="0 0 512 512" width={size} x="0" y="0">
      <LinearGradient
        gradientTransform="matrix(1 0 0 -1 0 512)"
        gradientUnits="userSpaceOnUse"
        id="gradient"
        x1="0"
        x2="512"
        y1="250"
        y2="250"
      >
        <Stop offset="0" stopColor={colors.flamingo} />
        <Stop offset="1" stopColor={colors.neonSkyblue} />
      </LinearGradient>
      <Path
        d="M495.545,478.132l-112.371,20.216c-10.85,1.956-21.266-5.253-23.225-16.143
	c-1.956-10.871,5.271-21.27,16.143-23.225l58.58-10.539l-178.67-103.155L77.334,448.44l58.58,10.539
	c10.871,1.955,18.099,12.354,16.143,23.225c-1.959,10.891-12.379,18.098-23.225,16.143L16.46,478.132
	c-10.883-1.959-18.089-12.426-16.143-23.225l20.216-112.371c1.956-10.872,12.36-18.102,23.225-16.143
	c10.871,1.955,18.099,12.354,16.143,23.225l-12.587,69.966l188.688-108.94V81.617l-46.592,46.591
	c-7.809,7.811-20.472,7.812-28.284-0.001c-7.811-7.811-7.81-20.474,0.001-28.284l80.733-80.732c7.809-7.811,20.475-7.811,28.283,0
	l80.733,80.732c7.811,7.811,7.812,20.474,0.001,28.284c-7.81,7.81-20.473,7.812-28.284,0.001l-46.592-46.591v229.028l188.688,108.94
	l-12.586-69.966c-1.956-10.871,5.271-21.27,16.143-23.225c10.867-1.964,21.27,5.271,23.225,16.143l20.216,112.371
	C513.64,465.946,506.214,476.263,495.545,478.132z"
        fill="url(#gradient)"
        stroke="url(#gradient)"
      />
    </Svg>
  );
}
