import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '@/components/icons/Svg';

export const XIcon = ({ color, size = 38 }: { color: string; size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38">
      <Path
        d="M20.2667 18.0045L25.107 12.4946H23.9604L19.7558 17.2778L16.4001 12.4946H12.5287L17.6043 19.7283L12.5287 25.5055H13.6753L18.1126 20.4532L21.6573 25.5055H25.5287M14.0891 13.3414H15.8506L23.9596 24.7003H22.1976"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.144 12.2947H16.5041L19.7735 16.9548L23.87 12.2947H25.5489L20.5207 18.0184L25.9133 25.7055H21.5533L18.095 20.7764L13.7658 25.7055H12.0867L17.3503 19.7145L12.144 12.2947ZM14.4776 13.5414L22.3006 24.5004H23.5711L15.7476 13.5414H14.4776Z"
        fill={color}
      />
    </Svg>
  );
};
