import { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import type { SkiaValue } from "@shopify/react-native-skia";
import {
  useComputedValue,
  useLoop,
  BlurMask,
  vec,
  Canvas,
  Circle,
  Fill,
  Group,
  polar2Canvas,
  Easing,
  mix,
} from "@shopify/react-native-skia";

const c1 = "#61bea2";
const c2 = "#529ca0";

const N = 516;

interface RingProps {
  index: number;
  progress: SkiaValue<number>;
}

const Ring = ({ index, progress }: RingProps) => {
  const { width, height } = useWindowDimensions();
  const R = width / 4;
  const center = useMemo(
    () => vec(width / 2, height / 2 - 64),
    [height, width]
  );

  const theta = (index * (2 * Math.PI)) / N;
  const transform = useComputedValue(() => {
    const { x, y } = polar2Canvas(
      { theta, radius: progress.current * R },
      { x: 0, y: 0 }
    );
    const scale = mix(progress.current, 0.3, 1);
    return [{ translateX: x }, { translateY: y }, { scale }];
  }, [progress]);

  return (
    <Group origin={center} transform={transform}>
      <Circle c={center} r={R / N} color={index % 2 ? c1 : c2} />
    </Group>
  );
};

export const Breathe = () => {
  const { width, height } = useWindowDimensions();
  const center = useMemo(
    () => vec(width / 2, height / 2 - 64),
    [height, width]
  );

  const progress = useLoop({
    duration: 3000,
    easing: Easing.inOut(Easing.ease),
  });

  const transform = useComputedValue(
    () => [{ rotate: mix(progress.current, -Math.PI / 2, 0) }],
    [progress]
  );

  return (
    <Canvas style={styles.container}>
      <Fill color="rgb(36,43,56)" />
      <Group origin={center} transform={transform} blendMode="screen">
        {new Array(N).fill(0).map((_, index) => {
          return <Ring key={index} index={index} progress={progress} />;
        })}
      </Group>
    </Canvas>
  );
};

// Export Breathe as default, we can lazy-load this way easier.
export default Breathe;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});