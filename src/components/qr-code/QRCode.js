import QRCodeUtil from 'qrcode';
import React, { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Rect } from 'react-native-svg';
import RainbowLogo from '../../assets/rainbow-og.png';
import { magicMemo } from '../../utils';
import useSafeImageUri from '@/hooks/useSafeImageUri';
import { useTheme } from '@/theme';
import { logger } from '@/logger';

const generateMatrix = (value, errorCorrectionLevel) => {
  let qrCodeData;
  try {
    if (!value) return [];

    qrCodeData = QRCodeUtil.create(value, { errorCorrectionLevel });
    if (!qrCodeData?.modules?.data) return [];

    const arr = Array.prototype.slice.call(qrCodeData.modules.data, 0);
    const sqrt = Math.sqrt(arr.length);

    // Ensure sqrt is valid
    if (!sqrt || !Number.isFinite(sqrt) || sqrt === 0) return [];

    return arr.reduce((rows, key, index) => {
      if (index % sqrt === 0) {
        rows.push([key]);
      } else if (rows.length > 0) {
        rows[rows.length - 1].push(key);
      }
      return rows;
    }, []);
  } catch (error) {
    logger.warn('Error generating QR code matrix:', {
      error,
      value,
      qrCodeData: qrCodeData?.modules?.data,
    });
    return [];
  }
};

const QRCode = ({
  ecl = 'M',
  logo = RainbowLogo,
  logoBackgroundColor: givenLogoBackgroundColor,
  logoMargin = -5,
  logoSize = 84,
  size = 150,
  value = 'QR Code',
}) => {
  const { colors } = useTheme();
  const logoBackgroundColor = givenLogoBackgroundColor || colors.transparent;
  const href = useSafeImageUri(logo);
  const dots = useMemo(() => {
    try {
      const dots = [];
      const matrix = generateMatrix(value, ecl);

      // Handle empty matrix case
      if (!matrix || !matrix.length) return [];

      const cellSize = size / matrix.length;
      const qrList = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];

      qrList.forEach(({ x, y }) => {
        const x1 = (matrix.length - 7) * cellSize * x;
        const y1 = (matrix.length - 7) * cellSize * y;
        for (let i = 0; i < 3; i++) {
          dots.push(
            <Rect
              key={`corner-${x}-${y}-${i}`}
              fill={i % 2 !== 0 ? 'white' : 'black'}
              height={cellSize * (7 - i * 2)}
              rx={(i - 3) * -6 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
              ry={(i - 3) * -6 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
              width={cellSize * (7 - i * 2)}
              x={x1 + cellSize * i}
              y={y1 + cellSize * i}
            />
          );
        }
      });

      // Safely calculate clear arena size
      const clearArenaSize = Math.floor((logoSize + 3) / cellSize) || 0;
      const matrixMiddleStart = matrix.length / 2 - clearArenaSize / 2;
      const matrixMiddleEnd = matrix.length / 2 + clearArenaSize / 2 - 1;

      matrix.forEach((row, i) => {
        if (!row) return;

        row.forEach((column, j) => {
          if (matrix[i]?.[j]) {
            if (!((i < 7 && j < 7) || (i > matrix.length - 8 && j < 7) || (i < 7 && j > matrix.length - 8))) {
              if (
                !(
                  i > matrixMiddleStart &&
                  i < matrixMiddleEnd &&
                  j > matrixMiddleStart &&
                  j < matrixMiddleEnd &&
                  i < j + clearArenaSize / 2 &&
                  j < i + clearArenaSize / 2 + 1
                )
              ) {
                dots.push(
                  <Circle
                    key={`dot-${i}-${j}`}
                    cx={i * cellSize + cellSize / 2}
                    cy={j * cellSize + cellSize / 2}
                    fill="black"
                    r={cellSize / 3} // calculate size of single dots
                  />
                );
              }
            }
          }
        });
      });

      return dots;
    } catch (error) {
      console.warn('Error generating QR code dots:', error);
      return [];
    }
  }, [ecl, logoSize, size, value, colors]);

  // Calculate logo position, but ensure it's valid
  const logoPosition = size && logoSize ? size / 2 - logoSize / 2 - logoMargin : 0;
  const logoWrapperSize = logoSize + logoMargin * 2;

  // If we couldn't generate the QR code, return a simple placeholder
  if (!dots || !dots.length) {
    return (
      <Svg height={size} width={size}>
        <Defs>
          <ClipPath id="clip-wrapper">
            <Rect height={logoWrapperSize} width={logoWrapperSize} />
          </ClipPath>
          <ClipPath id="clip-logo">
            <Rect height={logoSize} width={logoSize} />
          </ClipPath>
        </Defs>
        <Rect fill="white" height={size} width={size} />
        {logo && (
          <G x={logoPosition} y={logoPosition}>
            <Rect clipPath="url(#clip-wrapper)" fill={logoBackgroundColor} height={logoWrapperSize} width={logoWrapperSize} />
            <G x={logoMargin} y={logoMargin}>
              <Image clipPath="url(#clip-logo)" height={logoSize} href={href} preserveAspectRatio="xMidYMid slice" width={logoSize} />
            </G>
          </G>
        )}
      </Svg>
    );
  }

  return (
    <Svg height={size} width={size}>
      <Defs>
        <ClipPath id="clip-wrapper">
          <Rect height={logoWrapperSize} width={logoWrapperSize} />
        </ClipPath>
        <ClipPath id="clip-logo">
          <Rect height={logoSize} width={logoSize} />
        </ClipPath>
      </Defs>
      <Rect fill="white" height={size} width={size} />
      {dots}
      {logo && (
        <G x={logoPosition} y={logoPosition}>
          <Rect clipPath="url(#clip-wrapper)" fill={logoBackgroundColor} height={logoWrapperSize} width={logoWrapperSize} />
          <G x={logoMargin} y={logoMargin}>
            <Image clipPath="url(#clip-logo)" height={logoSize} href={href} preserveAspectRatio="xMidYMid slice" width={logoSize} />
          </G>
        </G>
      )}
    </Svg>
  );
};

export default magicMemo(QRCode, 'value');
