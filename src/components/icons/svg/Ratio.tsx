import React from 'react';
import { G, Path, Mask, Defs, ClipPath, SvgProps } from 'react-native-svg';
import Svg from '../Svg';

export function Ratio(props: SvgProps) {
  return (
    <Svg viewBox="0 0 16 16" {...props}>
      <G clipPath="url(#clip0_1_2)">
        <Path d="M16 0H0v16h16V0z" fill="#7EFDCF" />
        <Mask
          id="a"
          style={{
            maskType: 'luminance',
          }}
          maskUnits="userSpaceOnUse"
          x={2}
          y={3}
          width={12}
          height={10}
        >
          <Path d="M13.13 3.154H2.87v9.66h10.26v-9.66z" fill="#fff" />
        </Mask>
        <G mask="url(#a)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.917 4.331L4.03 8.046a.479.479 0 00.055.79l.85.462 4.33 2.352c.372.203.819.173 1.164-.077l.965-.698.277-.2c.448-.325.608-.941.383-1.46l-.005-.012-2.042-4.573c-.195-.438-.717-.58-1.089-.299zm-.569-.837c.866-.658 2.085-.325 2.54.695l2.035 4.56.007.013c.438.98.137 2.151-.709 2.763l-.277.201-.965.698c-.641.464-1.47.52-2.161.144l-5.18-2.814c-.94-.51-1.038-1.893-.179-2.546l4.89-3.714z"
            fill="#1E2435"
          />
        </G>
      </G>
      <Defs>
        <ClipPath id="clip0_1_2">
          <Path fill="#fff" d="M0 0H16V16H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default Ratio;
