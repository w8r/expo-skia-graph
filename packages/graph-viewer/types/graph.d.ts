export type Id = string;

export type RGB = `rgb(${number},${number},${number})`;
export type RGBA = `rgba(${number},${number},${number},${number})`;
export type Hex = `#${string}`;

export type Color = RGBA | RGB | Hex;

export interface GraphNode {
  id: Id;
  attributes: {
    selected?: boolean;
    x: number;
    y: number;
    radius: number;
    color: Color;
  };
}

export interface GraphEdge {
  id: Id;
  source: Id;
  target: Id;
  attributes: {
    selected?: boolean;
    width: number;
    color: Color;
  };
}

export interface Graph {
  id: Id;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
