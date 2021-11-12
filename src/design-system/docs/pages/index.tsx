import type { NextPage } from 'next';
import Head from 'next/head';
import React, { Children, Fragment, ReactNode } from 'react';
import { backgroundColors, foregroundColors } from '../../color/palettes';
import { fontWeights } from '../../typography/fontWeights';
import { typeHierarchy } from '../../typography/typeHierarchy';
import { Radii, Space, sprinkles } from '../styles/sprinkles.css';

const GRID_SPACING: Space = '16px';
const CARD_GUTTER: Space = '32px';
const CARD_RADIUS: Radii = '16px';

const fontWeightFromString = {
  '400': 400,
  '500': 500,
  '600': 600,
  '700': 700,
  '800': 800,
};

const Title = ({ children }: { children: ReactNode }) => (
  <h1
    className={sprinkles({
      color: 'primary',
      fontSize: '23px',
      fontWeight: '800',
    })}
  >
    {children}
  </h1>
);

const Heading = ({ children }: { children: ReactNode }) => (
  <h2
    className={sprinkles({
      color: 'secondary',
      fontSize: '23px',
      fontWeight: '700',
    })}
  >
    {children}
  </h2>
);

const Stack = ({ space, children }: { space: Space; children: ReactNode }) => (
  <div
    className={sprinkles({
      display: 'flex',
      flexDirection: 'column',
      gap: space,
    })}
  >
    {children}
  </div>
);

const Columns = ({
  space,
  children,
}: {
  space: Space;
  children: ReactNode;
}) => (
  <div
    className={sprinkles({
      display: 'flex',
      flexDirection: 'row',
      gap: space,
      width: '100%',
    })}
  >
    {Children.map(children, child => (
      <div
        className={sprinkles({
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
        })}
      >
        {child}
      </div>
    ))}
  </div>
);

const Card = ({
  backgroundColor = 'white',
  height,
  children,
}: {
  backgroundColor?: string;
  height?: 'full';
  children: ReactNode;
}) => (
  <div
    className={sprinkles({
      borderRadius: CARD_RADIUS,
      height: height === 'full' ? '100%' : undefined,
      padding: CARD_GUTTER,
      paddingVertical: CARD_GUTTER,
    })}
    style={{ backgroundColor }}
  >
    {children}
  </div>
);

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Rainbow Design System Cheat Sheet</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <div
        className={sprinkles({
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '1020px',
          paddingBottom: '48px',
          paddingLeft: GRID_SPACING,
          paddingRight: GRID_SPACING,
          paddingTop: '48px',
        })}
      >
        <Stack space="64px">
          <Stack space="24px">
            <Stack space="12px">
              <Title>Typography</Title>
              <Columns space={GRID_SPACING}>
                <Heading>Heading Sizes</Heading>
                <Heading>Text Sizes</Heading>
                <Heading>Font Weights</Heading>
              </Columns>
            </Stack>
            <Columns space={GRID_SPACING}>
              <Card height="full">
                <Stack space={CARD_GUTTER}>
                  {Object.entries(typeHierarchy.heading).map(
                    (
                      [sizeName, { fontSize, lineHeight, letterSpacing }],
                      index
                    ) => (
                      <div key={index} style={{ fontSize }}>
                        <div
                          className={sprinkles({
                            color: 'primary',
                            fontWeight: '800',
                          })}
                        >
                          {sizeName} heading
                        </div>
                        <div
                          className={sprinkles({
                            color: 'secondary',
                            fontWeight: '500',
                          })}
                        >
                          {lineHeight}
                          px line height
                          <br />
                          {letterSpacing}px spacing
                        </div>
                      </div>
                    )
                  )}
                </Stack>
              </Card>

              <Card height="full">
                <Stack space={CARD_GUTTER}>
                  {Object.entries(typeHierarchy.text).map(
                    (
                      [sizeName, { fontSize, lineHeight, letterSpacing }],
                      index
                    ) => (
                      <div key={index} style={{ fontSize }}>
                        <div
                          className={sprinkles({
                            color: 'primary',
                            fontWeight: '800',
                          })}
                        >
                          {sizeName} text
                        </div>
                        <div
                          className={sprinkles({
                            color: 'secondary',
                            fontWeight: '600',
                          })}
                        >
                          {lineHeight}
                          px line height
                          <br />
                          {letterSpacing}px spacing
                        </div>
                      </div>
                    )
                  )}
                </Stack>
              </Card>

              <Card height="full">
                <Stack space="12px">
                  {Object.entries(fontWeights).map(
                    ([fontWeightName, fontWeight], index) => (
                      <div
                        className={sprinkles({
                          color: 'primary',
                          fontSize: '18px',
                          fontWeight: fontWeightFromString[fontWeight],
                        })}
                        key={index}
                      >
                        {fontWeightName} ({fontWeight})
                      </div>
                    )
                  )}
                </Stack>
              </Card>
            </Columns>
          </Stack>

          <Stack space="24px">
            <Stack space="12px">
              <Title>Background Colors</Title>
              <Columns space={GRID_SPACING}>
                <Heading>Light Mode</Heading>
                <Heading>Dark Mode</Heading>
              </Columns>
            </Stack>
            <Stack space={GRID_SPACING}>
              {Object.entries(backgroundColors).map(
                ([backgroundName, background], i) => (
                  <Columns key={i} space={GRID_SPACING}>
                    {('color' in background
                      ? [background, background]
                      : [background.light, background.dark]
                    ).map(({ color: backgroundColor, mode }, index) => (
                      <div
                        className={sprinkles({
                          borderRadius: CARD_RADIUS,
                          color: mode === 'light' ? 'primary' : 'white',
                          padding: CARD_GUTTER,
                        })}
                        key={index}
                        style={{ backgroundColor }}
                      >
                        <Stack space="8px">
                          <div
                            className={sprinkles({
                              fontSize: '18px',
                              fontWeight: '800',
                              wordBreak: 'break-word',
                            })}
                          >
                            {backgroundName}
                          </div>
                          <div
                            className={sprinkles({
                              color:
                                mode === 'light'
                                  ? 'secondary'
                                  : 'secondaryDark',
                              fontSize: '18px',
                              fontWeight: '500',
                              wordBreak: 'break-word',
                            })}
                          >
                            {backgroundColor}
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Columns>
                )
              )}
            </Stack>
          </Stack>

          <Stack space="24px">
            <Stack space="12px">
              <Title>Foreground Colors</Title>
              <Columns space={GRID_SPACING}>
                <Heading>Light Mode</Heading>
                <Heading>Dark Mode</Heading>
                <Heading>Dark Tinted Mode</Heading>
              </Columns>
            </Stack>
            <Stack space="none">
              {Object.entries(foregroundColors).map(
                ([foregroundName, foreground], colorIndex, arr) => (
                  <Columns key={colorIndex} space={GRID_SPACING}>
                    {(typeof foreground === 'string'
                      ? ([
                          [foreground, 'bodyLight'],
                          [foreground, 'bodyDark'],
                          [foreground, 'bodyDark'],
                        ] as const)
                      : ([
                          [foreground.light, 'bodyLight'],
                          [foreground.dark, 'bodyDark'],
                          [
                            foreground.darkTinted ?? foreground.dark,
                            'bodyDark',
                          ],
                        ] as const)
                    ).map(([color, backgroundColor], index) => (
                      <div
                        className={sprinkles({
                          backgroundColor,
                          borderBottomRadius:
                            colorIndex === arr.length - 1
                              ? CARD_RADIUS
                              : undefined,
                          borderTopRadius:
                            colorIndex === 0 ? CARD_RADIUS : undefined,
                          height: '100%',
                          padding: CARD_GUTTER,
                          paddingTop: colorIndex === 0 ? CARD_GUTTER : 'none',
                        })}
                        key={index}
                      >
                        <Stack space="8px">
                          <div
                            className={sprinkles({
                              fontSize: '18px',
                              fontWeight: '800',
                              wordBreak: 'break-word',
                            })}
                            style={{ color }}
                          >
                            {foregroundName}
                          </div>
                          <div
                            className={sprinkles({
                              fontSize: '18px',
                              fontWeight: '500',
                              wordBreak: 'break-word',
                            })}
                            style={{ color }}
                          >
                            {color}
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Columns>
                )
              )}
            </Stack>
          </Stack>
        </Stack>
      </div>
    </>
  );
};

export default Home;
