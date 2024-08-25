import React, { FC } from "react";
import type { ViewProps } from "react-native";

import { Viewer } from "./Viewer";
import { useVis, VisProvider } from "./context";

const Wrapper = (props: ViewProps) => {
  const { graph } = useVis();
  //if (graph.nodes.length === 0) return null;
  return <Viewer graph={graph} {...props} />;
};

const Vis: FC<ViewProps> = (props) => (
  <VisProvider>
    <Wrapper {...props} />
  </VisProvider>
);

export default Vis;
