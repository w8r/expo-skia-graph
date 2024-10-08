import { Skia, type SkMatrix, vec } from "@shopify/react-native-skia";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { invertTransform, rotateZ, translate, zoomAroundPoint } from "./utils";
import { View } from "react-native";
import { MutableRefObject, useCallback, useRef } from "react";
import { useVis } from "./context";
import { GraphNode } from "../../types/graph";

interface GestureHandlerProps {
  matrix: SharedValue<SkMatrix>;
  debug?: boolean;
  children?: React.ReactNode;
}

export const GestureHandler = ({ matrix, children }: GestureHandlerProps) => {
  const pivot = useSharedValue(Skia.Point(0, 0));
  const offset = useSharedValue(Skia.Matrix());
  const {
    getElementAt,
    selectNode,
    clearSelection,
    isSelecting,
    isDragging,
    setIsDragging,
    screenToWorld,
    moveNode,
  } = useVis();
  const pan = Gesture.Pan()
    .onBegin((evt) => {
      const node = getElementAt(evt.x, evt.y);
      if (node) {
        setIsDragging(node as GraphNode);
        selectNode(node.id);
      }
    })
    .onChange((event) => {
      // here we can have lasso
      // or be dragging nodes
      if (isDragging) {
        const coord = screenToWorld(event.x, event.y);
        moveNode(isDragging.id, coord.x, coord.y);
      } else {
        matrix.value = translate(matrix.value, event.changeX, event.changeY);
      }
    })
    .onEnd(() => {
      setIsDragging(null);
      clearSelection();
    });
  const containerRef = useRef<View>(null) as MutableRefObject<View>;
  const pinch = Gesture.Pinch()
    .onBegin((event) => {
      offset.value = matrix.value;
      pivot.value = vec(event.focalX, event.focalY);
    })
    .onChange((event) => {
      pivot.value = invertTransform(
        matrix.value,
        vec(event.focalX, event.focalY)
      );
      matrix.value = zoomAroundPoint(offset.value, event.scale, pivot.value);
    });

  const rotate = Gesture.Rotation()
    .onBegin((event) => {
      offset.value = matrix.value;
      pivot.value = vec(event.anchorX, event.anchorY);
    })
    .onChange((event) => {
      matrix.value = rotateZ(offset.value, event.rotation, pivot.value);
    });

  const longTap = Gesture.LongPress().onEnd((event) => {
    const node = getElementAt(event.x, event.y);
    if (node) selectNode(node.id);
    else clearSelection();
  });

  const gesture = Gesture.Race(pan, pinch, rotate, longTap);

  const onWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const dz = event.deltaY > 0 ? 0.9 : 1.1;
      containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        pivot.value = invertTransform(
          matrix.value,
          vec(event.clientX - pageX, event.clientY - pageY)
        );
        matrix.value = zoomAroundPoint(matrix.value, dz, pivot.value);
      });
    },
    [matrix]
  );

  const onViewCreated = useCallback(
    (view: View) => {
      containerRef.current = view;
      if (!view) return;
      const element = view as unknown as HTMLElement;
      if (element.addEventListener) element.addEventListener("wheel", onWheel);
    },
    [matrix]
  );

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gesture}>
        <View ref={onViewCreated}>{children}</View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
