import { useMemo, PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import type { SkiaValue } from "@shopify/react-native-skia";
import {
  useComputedValue,
  useLoop,
  BlurMask,
  vec,
  Canvas as SkiaCanvas,
  CanvasProps,
  Circle,
  Fill,
  Group,
  polar2Canvas,
  Easing,
  mix,
  useValue,
  useTouchHandler,
} from "@shopify/react-native-skia";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export const Canvas = ({ children, style, ...props }: CanvasProps) => {
  const cx = useValue(0);
  const cy = useValue(0);

  console.log({ useSharedValue });
  // const scale = useSharedValue(1);
  // const origin = { x: useSharedValue(0), y: useSharedValue(0) };
  // const translation = { x: useSharedValue(0), y: useSharedValue(0) };

  const touchHandler = useTouchHandler({
    onStart: ({ x, y }) => {
      console.log("onStart", x, y);
    },
    onActive: ({ x, y }) => {
      // console.log("onActive", x, y);
      // cx.current = x;
      // cy.current = y;
    },
  });
  return (
    <SkiaCanvas style={style} {...props} onTouch={touchHandler}>
      {children}
    </SkiaCanvas>
  );
};
