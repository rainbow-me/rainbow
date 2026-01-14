import { useCleanup } from '@/hooks/useCleanup';
import { Canvas, DataSourceParam, ImageShader, Rect, Shader, Skia, useImage, vec } from '@shopify/react-native-skia';
import { forwardRef, memo, useImperativeHandle } from 'react';
import { cancelAnimation, convertToRGBA, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { transitionEasing } from '@/features/rnbw-rewards/animations/layoutAnimations';

const DEFAULT_SIZE = 160;
const DEFAULT_EDGE_THICKNESS = 12;
const DEFAULT_EDGE_COLOR = '#633F0A';

type SpinnableCoinProps = {
  source: DataSourceParam;
  edgeColor?: string;
  edgeThickness?: number;
  size?: number;
  spinDurationMs?: number;
};

export type SpinnableCoinHandle = {
  spin: ({ turns, durationMs }: { turns: number; durationMs: number }) => void;
};

export const SpinnableCoin = memo(
  forwardRef<SpinnableCoinHandle, SpinnableCoinProps>(function SpinnableCoin(
    { edgeColor = DEFAULT_EDGE_COLOR, edgeThickness = DEFAULT_EDGE_THICKNESS, size = DEFAULT_SIZE, source },
    ref
  ) {
    const coinImage = useImage(source);
    const rotation = useSharedValue(0);

    useImperativeHandle(
      ref,
      () => ({
        spin: ({ turns, durationMs }) => {
          'worklet';
          cancelAnimation(rotation);
          const degrees = turns * 360;
          const targetRotation = rotation.value + degrees;
          const remainder = ((targetRotation % 180) + 180) % 180;
          const epsilon = 0.001;
          let correction = 0;
          if (remainder >= epsilon && 180 - remainder >= epsilon) {
            correction = degrees >= 0 ? 180 - remainder : -remainder;
          }
          rotation.value = withTiming(targetRotation + correction, { duration: durationMs, easing: transitionEasing });
        },
      }),
      [rotation]
    );

    const uniforms = useDerivedValue(() => {
      'worklet';
      const radians = (rotation.value * Math.PI) / 180;
      return {
        angle: radians,
        canvasSize: vec(size, size),
        edgeColor: convertToRGBA(edgeColor),
        radius: size / 2,
        thickness: edgeThickness,
      };
    }, [size]);

    useCleanup(() => coinImage?.dispose?.(), [coinImage]);

    if (!coinImage || !COIN_SHADER_SOURCE) {
      return null;
    }

    return (
      <Canvas style={{ width: size, height: size }}>
        <Rect x={0} y={0} width={size} height={size}>
          <Shader source={COIN_SHADER_SOURCE} uniforms={uniforms}>
            <ImageShader fit="cover" image={coinImage} tx="clamp" ty="clamp" width={size} height={size} x={0} y={0} />
          </Shader>
        </Rect>
      </Canvas>
    );
  })
);

SpinnableCoin.displayName = 'SpinnableCoin';

const COIN_SHADER = `
uniform shader image;
uniform float2 canvasSize;
uniform float radius;
uniform float thickness;
uniform float angle;
uniform half4 edgeColor;

half4 main(float2 fragCoord) {
  float2 center = canvasSize * 0.5;
  float2 p = fragCoord - center;
  float cosA = abs(cos(angle));
  float sinA = abs(sin(angle));
  float maxX = radius * cosA + thickness * 0.5 * sinA;
  float scaleX = maxX > radius ? radius / maxX : 1.0;
  p.x *= scaleX;

  float cameraZ = radius + thickness;
  float3 ro = float3(p.x, p.y, cameraZ);
  float3 rd = float3(0.0, 0.0, -1.0);

  float s = sin(-angle);
  float c = cos(-angle);
  float3 roL = float3(c * ro.x + s * ro.z, ro.y, -s * ro.x + c * ro.z);
  float3 rdL = float3(c * rd.x + s * rd.z, rd.y, -s * rd.x + c * rd.z);

  float h = thickness * 0.5;
  float r = radius;
  float t = 1e9;
  float surface = 0.0;
  float capSign = 1.0;

  float a = rdL.x * rdL.x + rdL.y * rdL.y;
  float b = 2.0 * (roL.x * rdL.x + roL.y * rdL.y);
  float c2 = roL.x * roL.x + roL.y * roL.y - r * r;
  float disc = b * b - 4.0 * a * c2;
  if (disc >= 0.0 && a > 1e-6) {
    float sqrtD = sqrt(disc);
    float t0 = (-b - sqrtD) / (2.0 * a);
    float t1 = (-b + sqrtD) / (2.0 * a);
    if (t0 > 0.0) {
      float z = roL.z + t0 * rdL.z;
      if (abs(z) <= h) {
        t = t0;
        surface = 1.0;
      }
    }
    if (t1 > 0.0) {
      float z = roL.z + t1 * rdL.z;
      if (abs(z) <= h && t1 < t) {
        t = t1;
        surface = 1.0;
      }
    }
  }

  if (abs(rdL.z) > 1e-6) {
    float tFront = (h - roL.z) / rdL.z;
    if (tFront > 0.0) {
      float2 p2 = roL.xy + tFront * rdL.xy;
      if (dot(p2, p2) <= r * r && tFront < t) {
        t = tFront;
        surface = 2.0;
        capSign = 1.0;
      }
    }
    float tBack = (-h - roL.z) / rdL.z;
    if (tBack > 0.0) {
      float2 p2 = roL.xy + tBack * rdL.xy;
      if (dot(p2, p2) <= r * r && tBack < t) {
        t = tBack;
        surface = 2.0;
        capSign = -1.0;
      }
    }
  }

  if (t > 1e8) {
    return half4(0.0);
  }

  float3 hit = roL + t * rdL;

  if (surface < 1.5) {
    return edgeColor;
  }

  float2 uv = float2(hit.x / r * 0.5 + 0.5, hit.y / r * 0.5 + 0.5);
  if (capSign < 0.0) {
    uv.x = 1.0 - uv.x;
  }
  uv = float2(clamp(uv.x, 0.0, 1.0), clamp(uv.y, 0.0, 1.0));
  float2 samplePos = uv * (radius * 2.0);
  half4 face = image.eval(samplePos);
  half3 rgb = mix(edgeColor.rgb, face.rgb, face.a);
  return half4(rgb, 1.0);
}
`;

const COIN_SHADER_SOURCE = Skia.RuntimeEffect.Make(COIN_SHADER);
