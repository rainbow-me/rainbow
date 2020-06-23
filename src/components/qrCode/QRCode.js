import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Rect } from 'react-native-svg';
import { onlyUpdateForPropTypes } from 'recompact';

const generateMatrix = (value, errorCorrectionLevel) => {
  const arr = Array.prototype.slice.call(
    QRCode.create(value, { errorCorrectionLevel }).modules.data,
    0
  );
  const sqrt = Math.sqrt(arr.length);
  return arr.reduce(
    (rows, key, index) =>
      (index % sqrt === 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    []
  );
};

const QRCodeSVG = ({
  ecl,
  logo,
  logoBackgroundColor,
  logoMargin,
  logoSize,
  size,
  value,
}) => {
  const matrix = generateMatrix(value, ecl);
  const cellSize = size / matrix.length;

  const dots = [];

  let qrList = [
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
          width={cellSize * (7 - i * 2)}
          height={cellSize * (7 - i * 2)}
          x={x1 + cellSize * i}
          y={y1 + cellSize * i}
          fill={i % 2 !== 0 ? 'white' : 'black'}
          rx={(i - 3) * -6 + (i === 0 ? 1 : 0)} // calculated border radius for corner squares
          ry={(i - 3) * -6 + (i === 0 ? 1 : 0)} // calculated border radius for corner squares
        />
      );
    }
  });

  const clearArenaSize = Math.floor(logoSize / cellSize);
  const matrixMiddleStart = matrix.length / 2 - clearArenaSize / 2;
  const matrixMiddleEnd = matrix.length / 2 + clearArenaSize / 2 - 1;

  matrix.forEach((row, i) => {
    row.forEach((column, j) => {
      if (matrix[i][j]) {
        if (
          !(
            (i < 7 && j < 7) ||
            (i > matrix.length - 8 && j < 7) ||
            (i < 7 && j > matrix.length - 8)
          )
        ) {
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
                cx={i * cellSize + cellSize / 2}
                cy={j * cellSize + cellSize / 2}
                r={cellSize / 3.5} // calculate size of single dots
                fill="black"
              />
            );
          }
        }
      }
    });
  });

  const logoPosition = size / 2 - logoSize / 2 - logoMargin;
  const logoWrapperSize = logoSize + logoMargin * 2;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id="clip-wrapper">
          <Rect width={logoWrapperSize} height={logoWrapperSize} />
        </ClipPath>
        <ClipPath id="clip-logo">
          <Rect width={logoSize} height={logoSize} />
        </ClipPath>
      </Defs>
      <Rect width={size} height={size} fill="white" />
      {dots}
      {logo && (
        <G x={logoPosition} y={logoPosition}>
          <Rect
            width={logoWrapperSize}
            height={logoWrapperSize}
            fill={logoBackgroundColor}
            clipPath="url(#clip-wrapper)"
          />
          <G x={logoMargin} y={logoMargin}>
            <Image
              width={logoSize}
              height={logoSize}
              preserveAspectRatio="xMidYMid slice"
              href={logo}
              clipPath="url(#clip-logo)"
            />
          </G>
        </G>
      )}
    </Svg>
  );
};

QRCodeSVG.propTypes = {
  ecl: PropTypes.string,
  logo: PropTypes.object,
  logoBackgroundColor: PropTypes.string,
  logoMargin: PropTypes.number,
  logoSize: PropTypes.number,
  size: PropTypes.number,
  value: PropTypes.string,
};

QRCodeSVG.defaultProps = {
  ecl: 'M',
  size: 150,
  value: 'QR Code',
};

export default onlyUpdateForPropTypes(QRCodeSVG);
