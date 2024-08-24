import React, { FC, useCallback, useState } from "react";
import type { LayoutChangeEvent, ViewProps } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  useFont,
  Text,
} from "@shopify/react-native-skia";
import { GestureHandler } from "./GestureHandler";
import { makeMutable } from "react-native-reanimated";
import { Dimensions, View } from "react-native";
import { getTransformFromShapes } from "./utils";

// phyllotaxis
// https://en.wikipedia.org/wiki/Phyllotaxis
const phyllotaxis = (n: number) => {
  const theta = Math.PI * (3 - Math.sqrt(5));
  return (i: number) => {
    const r = Math.sqrt(i / n) * 50;
    const th = i * theta;
    return { x: r * Math.cos(th), y: r * Math.sin(th), radius: 1 };
  };
};

const N = 500;

const getPoint = phyllotaxis(N);
const points = Array.from({ length: N }, (_, i) => getPoint(i));
const getRandomHexColor = () => {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16);
  return `#${hex.padStart(6, "0")}`;
};

// add zooming an panning

const Container: FC<ViewProps> = (props) => {
  // store dimensions in the state once the element is rendered
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  const { width, height } = dimensions;

  // not layouted yet
  //if (width === 0 || height === 0) return null;

  console.log("dimensions", width, height);

  const r = width * 0.13;
  const matrix = makeMutable(
    getTransformFromShapes(
      points,
      // [
      //   { x: r, y: r, radius: r },
      //   { x: width - r, y: r, radius: r },
      //   { x: width / 2, y: width - r, radius: r },
      // ],
      width,
      height
    )
  );
  const fontSize = 1;
  const font = useFont(
    require("../../assets/fonts/SpaceMono-Regular.ttf"),
    fontSize
  );
  console.log("font", width, height);

  return (
    <View style={{ flex: 1 }} onLayout={onLayout} {...props}>
      <GestureHandler matrix={matrix}>
        <Canvas style={{ overflow: "hidden" }}>
          <Group blendMode="multiply" matrix={matrix}>
            {/* <Circle cx={r} cy={r} r={r} color="cyan" />
          <Circle cx={width - r} cy={r} r={r} color="magenta" />
          <Circle cx={width / 2} cy={width - r} r={r} color="yellow" /> */}
            {points.map(({ x, y, radius }, i) => (
              <Group key={i}>
                <Circle cx={x} cy={y} r={radius} color={getRandomHexColor()} />
                {/* <Text
                  font={font}
                  x={x}
                  y={y + 1.5}
                  color={"darkblue"}
                  text="text"
                /> */}
              </Group>
            ))}
          </Group>
        </Canvas>
      </GestureHandler>
    </View>
  );
};

export default Container;
