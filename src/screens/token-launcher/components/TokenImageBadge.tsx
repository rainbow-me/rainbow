import React, { useMemo } from 'react';
import { Image, LinearGradient, Path, vec, Skia, Group, SkImage, processTransform3d, Shadow, PathOp } from '@shopify/react-native-skia';
import { SharedValue } from 'react-native-reanimated';

const outterBadgeMask =
  'M89.1316 6.56756C97.1099 -2.18919 110.89 -2.18919 118.868 6.56756C124.161 12.3766 132.352 14.5713 139.84 12.1869C151.128 8.59241 163.062 15.4825 165.593 27.0552C167.272 34.7322 173.268 40.7284 180.945 42.4074C192.517 44.9384 199.408 56.8724 195.813 68.1602C193.429 75.6482 195.623 83.8391 201.432 89.1316C210.189 97.1099 210.189 110.89 201.432 118.868C195.623 124.161 193.429 132.352 195.813 139.84C199.408 151.128 192.517 163.062 180.945 165.593C173.268 167.272 167.272 173.268 165.593 180.945C163.062 192.517 151.128 199.408 139.84 195.813C132.352 193.429 124.161 195.623 118.868 201.432C110.89 210.189 97.1099 210.189 89.1316 201.432C83.8391 195.623 75.6482 193.429 68.1602 195.813C56.8724 199.408 44.9384 192.517 42.4074 180.945C40.7284 173.268 34.7322 167.272 27.0552 165.593C15.4825 163.062 8.59241 151.128 12.1869 139.84C14.5713 132.352 12.3766 124.161 6.56756 118.868C-2.18919 110.89 -2.18919 97.1099 6.56756 89.1316C12.3766 83.8391 14.5713 75.6482 12.1869 68.1602C8.59241 56.8724 15.4825 44.9384 27.0552 42.4074C34.7322 40.7284 40.7284 34.7322 42.4074 27.0552C44.9384 15.4825 56.8724 8.59241 68.1602 12.1869C75.6482 14.5713 83.8391 12.3766 89.1316 6.56756Z';
const middleBadgeMask =
  'M97.6324 14.3126C89.3139 23.4429 76.4399 26.8924 64.6708 23.1447C59.8367 21.6053 54.7258 24.5561 53.6419 29.5122C51.0029 41.5785 41.5785 51.0029 29.5122 53.6419C24.5561 54.7258 21.6053 59.8367 23.1447 64.6708C26.8924 76.4399 23.4429 89.3139 14.3126 97.6324C10.5625 101.049 10.5625 106.951 14.3126 110.368C23.4429 118.686 26.8924 131.56 23.1447 143.329C21.6053 148.163 24.5561 153.274 29.5122 154.358C41.5785 156.997 51.0029 166.421 53.6419 178.488C54.7258 183.444 59.8367 186.395 64.6708 184.855C76.4399 181.108 89.3139 184.557 97.6324 193.687C101.049 197.438 106.951 197.438 110.368 193.687C118.686 184.557 131.56 181.108 143.329 184.855C148.163 186.395 153.274 183.444 154.358 178.488C156.997 166.421 166.421 156.997 178.488 154.358C183.444 153.274 186.395 148.163 184.855 143.329C181.108 131.56 184.557 118.686 193.687 110.368C197.438 106.951 197.438 101.049 193.687 97.6324C184.557 89.3139 181.108 76.4399 184.855 64.6708C186.395 59.8367 183.444 54.7258 178.488 53.6419C166.421 51.0029 156.997 41.5785 154.358 29.5122C153.274 24.5561 148.163 21.6053 143.329 23.1447C131.56 26.8924 118.686 23.4429 110.368 14.3126C106.951 10.5625 101.049 10.5625 97.6324 14.3126Z';
const innerBadgeMask =
  'M94.7834 24.5711C99.729 19.143 108.271 19.143 113.217 24.5711L117.157 28.8964C120.438 32.4973 125.516 33.8578 130.157 32.3797L135.733 30.6043C142.73 28.3761 150.127 32.6472 151.696 39.8208L152.946 45.5371C153.987 50.2959 157.704 54.0128 162.463 55.0536L168.179 56.3038C175.353 57.8727 179.624 65.2703 177.396 72.2673L175.62 77.8429C174.142 82.4845 175.503 87.5619 179.104 90.8426L183.429 94.7834C188.857 99.729 188.857 108.271 183.429 113.217L179.104 117.157C175.503 120.438 174.142 125.516 175.62 130.157L177.396 135.733C179.624 142.73 175.353 150.127 168.179 151.696L162.463 152.946C157.704 153.987 153.987 157.704 152.946 162.463L151.696 168.179C150.127 175.353 142.73 179.624 135.733 177.396L130.157 175.62C125.516 174.142 120.438 175.503 117.157 179.104L113.217 183.429C108.271 188.857 99.729 188.857 94.7834 183.429L90.8426 179.104C87.5619 175.503 82.4845 174.142 77.8429 175.62L72.2673 177.396C65.2703 179.624 57.8727 175.353 56.3038 168.179L55.0536 162.463C54.0128 157.704 50.2959 153.987 45.5371 152.946L39.8208 151.696C32.6472 150.127 28.3761 142.73 30.6043 135.733L32.3797 130.157C33.8578 125.516 32.4973 120.438 28.8965 117.157L24.5711 113.217C19.143 108.271 19.143 99.729 24.5711 94.7834L28.8964 90.8426C32.4973 87.5619 33.8578 82.4845 32.3797 77.8429L30.6043 72.2673C28.3761 65.2703 32.6472 57.8727 39.8208 56.3038L45.5371 55.0536C50.2959 54.0128 54.0128 50.2959 55.0536 45.5371L56.3038 39.8208C57.8727 32.6472 65.2703 28.3761 72.2673 30.6043L77.8429 32.3797C82.4845 33.8578 87.5619 32.4973 90.8426 28.8965L94.7834 24.5711Z';

export function TokenImageBadge({
  size,
  image,
  accentColor,
}: {
  size: number;
  image: SkImage | SharedValue<SkImage | null>;
  accentColor: string;
}) {
  // These are the reference sizes of the SVG paths above
  const originalSize = 208;
  const imageOriginalSize = 167;
  const scaleRatio = size / originalSize;
  const imageToBackgroundRatio = imageOriginalSize / originalSize;
  const imageScaledSize = size * imageToBackgroundRatio;

  const [outterPath, outterStrokePath, innerPath] = useMemo(() => {
    const outterPath = Skia.Path.MakeFromSVGString(outterBadgeMask);
    const middlePath = Skia.Path.MakeFromSVGString(middleBadgeMask);
    const innerPath = Skia.Path.MakeFromSVGString(innerBadgeMask);

    if (!innerPath || !outterPath || !middlePath) return [null, null, null];

    const outterStrokePath = Skia.Path.MakeFromOp(outterPath, middlePath, PathOp.Difference);

    if (!outterStrokePath) return [null, null, null];

    // Scale the paths based on the reference sizes
    innerPath.transform(processTransform3d([{ scale: scaleRatio }]));
    outterPath.transform(processTransform3d([{ scale: scaleRatio }]));
    outterStrokePath.transform(processTransform3d([{ scale: scaleRatio }]));

    return [outterPath, outterStrokePath, innerPath];
  }, [scaleRatio]);

  if (!outterPath || !outterStrokePath || !innerPath) return null;

  return (
    <Group>
      {/* Token image background */}
      <Group>
        {/* TODO: The design did not consider image variants where center of the image is not the same color as accent color */}
        <Group opacity={0.5}>
          <Shadow dx={0} dy={80} blur={40} color={accentColor} />
        </Group>

        {/* Base white fill */}
        <Path path={outterPath} color="white" />

        {/* Glow effect */}
        <Path path={outterPath} blendMode="plus">
          <Shadow dx={0} dy={0} blur={22} color="rgba(245, 248, 255, 0.2)" />
        </Path>

        {/* Blue linear gradient overlay with opacity */}
        <Path path={outterPath} opacity={0.7}>
          {/* TODO: adjust start and end to match scale */}
          <LinearGradient start={vec(71, 148.309)} end={vec(299, 148.309)} colors={['#0E76FD', '#61B5FF']} />
        </Path>

        {/* Primary accent color fill */}
        <Path path={outterPath} color={accentColor} style="fill" />

        {/* Inner stroke effect*/}
        <Path path={outterStrokePath} blendMode={'plus'} color="rgba(245, 248, 255, 0.2)" />

        {/* Inner shadows */}
        <Path path={outterPath}>
          <Shadow dx={0} dy={1.43396} blur={7.16982 / 2} color="rgba(255, 255, 255, 1)" inner shadowOnly />
        </Path>
        <Path path={outterPath} blendMode="darken">
          <Shadow dx={0} dy={-2.86792} blur={5.73584 / 2} color="rgba(0, 0, 0, 0.4)" inner shadowOnly />
        </Path>
      </Group>
      {/* Token image */}
      <Group>
        <Path path={innerPath}>
          <Shadow dx={0} dy={48.33 / 2} blur={54.78 / 2} color={'rgba(37, 41, 46, 0.2)'} shadowOnly />
        </Path>
        <Path path={innerPath}>
          <Shadow dx={0} dy={0} blur={6 / 2} color={'rgba(255, 255, 255, 0.6)'} shadowOnly />
        </Path>
        <Image
          clip={innerPath}
          image={image}
          x={(size - imageScaledSize) / 2}
          y={(size - imageScaledSize) / 2}
          width={imageScaledSize}
          height={imageScaledSize}
          fit="cover"
        />
        <Path path={innerPath}>
          <Shadow dx={0} dy={0} blur={4 / 2} color={'rgba(255, 255, 255, 1)'} inner shadowOnly />
        </Path>
      </Group>
    </Group>
  );
}
