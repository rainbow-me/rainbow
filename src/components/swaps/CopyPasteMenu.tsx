/* eslint-disable react/jsx-props-no-spreading */
import * as i18n from '@/languages';
import React, { PropsWithChildren, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AbsolutePortal } from '@/components/AbsolutePortal';
import Clipboard from '@react-native-clipboard/clipboard';
import Svg, { Path } from 'react-native-svg';

const color = '#000000d9'; // black with 85% opacity
const separatorColor = '#ffffff26'; // white with 15% opacity

const menuOptionStyle = (pressed: boolean) =>
  ({
    backgroundColor: color,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignContent: 'center',
    opacity: pressed ? 0.9 : 1,
  }) as const;

const copy = i18n.t(i18n.l.copy);
const paste = i18n.t(i18n.l.paste);

function CopyPasteMenuBubble({
  x,
  y,
  onPressOutside,
  onCopy,
  onPaste,
}: PropsWithChildren<{ x: number; y: number; onPressOutside: VoidFunction; onPaste?: VoidFunction; onCopy: VoidFunction }>) {
  const [layout, setLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const arrowOffset = 12;

  return (
    <>
      <AbsolutePortal>
        <View style={{ height: '100%', width: '100%' }} onTouchEnd={onPressOutside} />
        <View
          onLayout={e => setLayout(e.nativeEvent.layout)}
          style={{
            position: 'absolute',
            top: y,
            left: x,
            transform: [{ translateX: -layout.width / 2 + arrowOffset }, { translateY: -layout.height - 10 }],
          }}
        >
          <Animated.View exiting={FadeOut.duration(100)} entering={FadeIn.duration(200).delay(100)} style={{ flexDirection: 'row' }}>
            <Pressable
              onPress={onCopy}
              style={({ pressed }) => [onPaste && { borderTopRightRadius: 0, borderBottomRightRadius: 0 }, menuOptionStyle(pressed)]}
            >
              <Text style={{ color: 'white' }}>{copy}</Text>

              <View style={{ position: 'absolute', bottom: -6, left: layout.width / 2 - 6 - arrowOffset }}>
                <Svg width="12" height="6" viewBox="0 0 12 6">
                  <Path d="M4.93934 4.93934C5.52513 5.52513 6.47487 5.52513 7.06066 4.93934L12 0H0L4.93934 4.93934Z" fill={color} />
                </Svg>
              </View>
            </Pressable>

            {onPaste && (
              <Pressable
                onPress={onPaste}
                style={({ pressed }) => [
                  { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderColor: separatorColor, borderWidth: 0, borderLeftWidth: 1 },
                  menuOptionStyle(pressed),
                ]}
              >
                <Text style={{ color: 'white' }}>{paste}</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </AbsolutePortal>
    </>
  );
}

export function CopyPasteMenu({
  children,
  onPaste,
  onCopy,
}: PropsWithChildren<{
  onPaste?: (text?: string) => void;
  onCopy: () => void;
}>) {
  const [position, setPosition] = useState<{ x: number; y: number } | undefined>();
  const dismiss = () => setPosition(undefined);

  return (
    <>
      <Pressable
        onLongPress={e => {
          const { pageX, pageY, locationY } = e.nativeEvent;
          setPosition({ x: pageX, y: pageY - locationY });
        }}
      >
        {children}
      </Pressable>

      {position && (
        <CopyPasteMenuBubble
          y={position.y}
          x={position.x}
          onPressOutside={dismiss}
          onPaste={
            onPaste
              ? () => {
                  Clipboard.getString().then(onPaste);
                  dismiss();
                }
              : undefined
          }
          onCopy={() => {
            onCopy();
            dismiss();
          }}
        />
      )}
    </>
  );
}
