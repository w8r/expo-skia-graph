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
import { Color, Graph } from "@/types/graph";
import { useVis } from "./context";

// phyllotaxis
// https://en.wikipedia.org/wiki/Phyllotaxis
const phyllotaxis = (n: number) => {
  const theta = Math.PI * (3 - Math.sqrt(5));
  return (i: number) => {
    const r = Math.sqrt(i / n) * 450;
    const th = i * theta;
    return { x: r * Math.cos(th), y: r * Math.sin(th), radius: 12 };
  };
};

const N = 400;

const getPoint = phyllotaxis(N);
const points = Array.from({ length: N }, (_, i) => getPoint(i));
const getRandomHexColor = () => {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16);
  return `#${hex.padStart(6, "0")}` as Color;
};

const defaultGraph: Graph = {
  id: "_",
  nodes: points.map(({ x, y, radius }, i) => ({
    id: i.toString(),
    attributes: {
      x,
      y,
      radius,
      color: getRandomHexColor(),
    },
  })),
  edges: [],
};

// add zooming an panning

export const Viewer: FC<ViewProps & { graph?: Graph }> = ({
  graph = defaultGraph,
  ...props
}) => {
  const { setSize, setMatrix, matrix } = useVis();
  // store dimensions in the state once the element is rendered
  const [, setDimensions] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    console.log("center", "width", width, "height", height, graph);
    setSize({ width, height });
  }, []);

  // not layouted yet
  // if (width === 0 || height === 0) return null;

  const fontSize = 12;
  const font = useFont(
    require("../../assets/fonts/Geist-Regular.ttf"),
    fontSize
  );

  return (
    <GestureHandler matrix={matrix}>
      <Canvas {...props} onLayout={onLayout}>
        <Group matrix={matrix}>
          {graph.nodes.map(
            ({ id, attributes: { x, y, radius, color, selected } }, i) => (
              <Group key={i}>
                <Circle
                  cx={x}
                  cy={y}
                  r={radius}
                  color={selected ? "red" : color}
                />
                {
                  <Text
                    font={font}
                    x={x}
                    y={y + 1.5}
                    color={"darkblue"}
                    text={id}
                  />
                }
              </Group>
            )
          )}
        </Group>
      </Canvas>
    </GestureHandler>
  );
};
