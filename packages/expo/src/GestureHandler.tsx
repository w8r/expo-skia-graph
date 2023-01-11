import {
  CanvasProps,
  Group,
  SkiaMutableValue,
  SkMatrix,
  SkRect,
} from "@shopify/react-native-skia";
import {
  Skia,
  useSharedValueEffect,
  Canvas,
  useValue,
  rect,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Dimensions } from "react-native";
import { Matrix4, multiply4, toMatrix3, identity4 } from "react-native-redash";
import { concat, vec3 } from "./MatrixHelpers";

interface GestureHandlerProps extends CanvasProps {
  //matrix: SkiaMutableValue<SkMatrix>;
  //dimensions: SkRect;
  debug?: boolean;
}

export const GestureHandler = ({
  debug,
  style,
  children,
  ...props
}: GestureHandlerProps) => {
  const skMatrix = useValue(Skia.Matrix());
  const d = Dimensions.get("window");
  const { x, y, width, height } = rect(0, 0, d.width, d.height);
  const origin = useSharedValue(vec3(0, 0, 0));
  const matrix = useSharedValue(identity4);
  const offset = useSharedValue(identity4);

  useSharedValueEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skMatrix.current = Skia.Matrix(toMatrix3(matrix.value) as any);
  }, matrix);

  const pan = Gesture.Pan().onChange((e) => {
    matrix.value = multiply4(
      Matrix4.translate(e.changeX, e.changeY, 0),
      matrix.value
    );
  });

  const rotate = Gesture.Rotation()
    .onBegin((e) => {
      origin.value = [e.anchorX, e.anchorY, 0];
      offset.value = matrix.value;
    })
    .onChange((e) => {
      matrix.value = concat(offset.value, origin.value, [
        { rotateZ: e.rotation },
      ]);
    });

  const scale = Gesture.Pinch()
    .onBegin((e) => {
      origin.value = [e.focalX, e.focalY, 0];
      offset.value = matrix.value;
    })
    .onChange((e) => {
      matrix.value = concat(offset.value, origin.value, [{ scale: e.scale }]);
    });

  return (
    <GestureDetector gesture={Gesture.Race(scale, rotate, pan)}>
      <Canvas style={style} {...props}>
        <Group matrix={skMatrix}>{children}</Group>
      </Canvas>
    </GestureDetector>
  );
};
