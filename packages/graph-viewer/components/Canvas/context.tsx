import React, { useCallback, type Dispatch, type SetStateAction } from "react";
import { createContext, FC, useContext, useState, useEffect } from "react";
import type { Graph, GraphEdge, GraphNode, Hex, Id } from "../../types/graph";
import { ViewProps } from "react-native";
import { quadtree as d3quadtree } from "d3-quadtree";
import { Skia, vec, type SkMatrix } from "@shopify/react-native-skia";
import { makeMutable } from "react-native-reanimated";
import { getTransformFromShapes, invertTransform } from "./utils";

const phyllotaxis = (n: number) => {
  const theta = Math.PI * (3 - Math.sqrt(5));
  return (i: number) => {
    const r = Math.sqrt(i / n) * 450;
    const th = i * theta;
    return { x: r * Math.cos(th), y: r * Math.sin(th), radius: 12 };
  };
};

const N = 400;
const tolerance = 10;

const getPoint = phyllotaxis(N);
const points = Array.from({ length: N }, (_, i) => getPoint(i));
const getRandomHexColor = () => {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16);
  return `#${hex.padStart(6, "0")}` as Hex;
};

type MutableMatrix = ReturnType<typeof makeMutable<SkMatrix>>;

const defaultGraph: Graph = {
  id: "",
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

export type VisState = {
  graph: Graph;
  setGraph: (graph: Graph) => void;
  isSelecting: boolean;
  setIsSelecting: (isSelecting: boolean) => void;

  selectedNodes: GraphNode[];
  setSelectedNodes: (selectedNodes: GraphNode[]) => void;

  selectedEdges: GraphEdge[];
  setSelectedEdges: (selectedEdges: GraphEdge[]) => void;

  selectNode: (id: Id | Id[]) => void;
  selectEdge: (id: Id | Id[]) => void;
  moveNode: (id: Id, x: number, y: number) => void;
  addNode: (node: GraphNode) => void;
  removeNode: (id: Id) => void;
  clearSelection: () => void;

  getElementAt: (x: number, y: number) => GraphNode | GraphEdge | null;

  matrix: MutableMatrix;
  setMatrix: Dispatch<SetStateAction<MutableMatrix>>;
  size: {
    width: number;
    height: number;
  };
  setSize: (size: { width: number; height: number }) => void;
};

export const VisContext = createContext<VisState>({
  graph: { nodes: [], edges: [] },
} as any as VisState);

export const VisProvider: FC<ViewProps> = ({ children }) => {
  const [graph, setGraph] = useState<Graph>(defaultGraph);
  const quadtree = d3quadtree<GraphNode>()
    .x((d) => d.attributes.x)
    .y((d) => d.attributes.y);

  console.log("graph", graph);
  quadtree.addAll(graph.nodes);

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  const [selectedNodes, setSelectedNodes] = useState<GraphNode[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<GraphEdge[]>([]);

  const [isSelecting, setIsSelecting] = useState(false);
  const [size, setSize] = useState({ width: 200, height: 200 });
  const initialMatrix = makeMutable(Skia.Matrix());
  const [matrix, setMatrix] = useState<MutableMatrix>(initialMatrix);

  useEffect(() => {
    matrix.value = getTransformFromShapes(points, size.width, size.height);

    console.log("change", matrix.value.get());
  }, []);

  useEffect(() => {
    setSelectedNodes(graph.nodes.filter((node) => node.attributes.selected));
    setSelectedEdges(graph.edges.filter((edge) => edge.attributes.selected));
  }, [graph]);

  const selectNode = (id: string | string[]) => {
    // add array to the selection
    if (Array.isArray(id)) {
      const set = new Set(id);
      const alreadySelected = new Set(selectedNodes.map((n) => n.id));
      const toAdd: GraphNode[] = [];
      graph.nodes.forEach((node) => {
        if (set.has(node.id) && !alreadySelected.has(node.id)) {
          node.attributes.selected = true;
          toAdd.push(node);
        }
      });
      setSelectedNodes([...selectedNodes, ...toAdd]);
      return;
    }
    graph.nodes.forEach((n) => {
      if (n.id === id) {
        n.attributes.selected = !n.attributes.selected;
        if (n.attributes.selected) setSelectedNodes([...selectedNodes, n]);
        else setSelectedNodes(selectedNodes.filter((n) => n.id !== id));
      }
    });
  };

  const screenToWorld = useCallback(
    (sx: number, sy: number) => invertTransform(matrix.value, vec(sx, sy)),
    [size, matrix]
  );

  const getElementAt = useCallback(
    (x: number, y: number) => {
      const pos = screenToWorld(x, y);
      let node = quadtree.find(pos.x, pos.y, tolerance) || null;
      if (node) {
        const dx = node.attributes.x - pos.x;
        const dy = node.attributes.y - pos.y;
        const r = node.attributes.radius;
        if (dx * dx + dy * dy > r * r) node = null;
        else return node;
      }
    },
    [size, matrix]
  );

  const selectEdge = (id: string | string[]) => {
    if (Array.isArray(id)) {
      const set = new Set(id);
      const alreadySelected = new Set(selectedEdges.map((e) => e.id));
      const toAdd: GraphEdge[] = [];
      graph.edges.forEach((edge) => {
        if (set.has(edge.id) && !alreadySelected.has(edge.id)) {
          edge.attributes.selected = true;
          toAdd.push(edge);
        }
      });
      setSelectedEdges([...selectedEdges, ...toAdd]);
      return;
    }
    graph.edges.forEach((e) => {
      if (e.id === id) {
        e.attributes.selected = !e.attributes.selected;
        if (e.attributes.selected) setSelectedEdges([...selectedEdges, e]);
        else setSelectedEdges(selectedEdges.filter((e) => e.id !== id));
      }
    });
  };

  const clearSelection = () => {
    setSelectedNodes([]);
    setSelectedEdges([]);
    graph.nodes.forEach((n) => {
      n.attributes.selected = false;
    });
    graph.edges.forEach((e) => {
      e.attributes.selected = false;
    });
    setGraph({ ...graph });
  };

  const addNode = (node: GraphNode) => {
    graph.nodes.push(node);
    setGraph({ ...graph });
    quadtree.add(node);
  };

  const removeNode = (id: Id) => {
    const node = nodeMap.get(id);
    if (!node) return;
    graph.nodes = graph.nodes.filter((n) => n.id !== id);
    setGraph({ ...graph });
    quadtree.remove(node);
  };

  const moveNode = (id: Id, x: number, y: number) => {
    const node = nodeMap.get(id);
    if (!node) return;
    quadtree.remove(node);

    node.attributes.x = x;
    node.attributes.y = y;

    setGraph({ ...graph });

    requestAnimationFrame(() => quadtree.add(node));
  };

  return (
    <VisContext.Provider
      value={
        {
          setGraph,
          graph,
          isSelecting,
          setIsSelecting,

          selectedNodes,
          setSelectedNodes,
          selectedEdges,
          setSelectedEdges,

          selectNode,
          selectEdge,
          clearSelection,

          getElementAt,

          addNode,
          removeNode,
          moveNode,

          matrix,
          setMatrix,
          size,
          setSize,
        } as VisState
      }
    >
      {children}
    </VisContext.Provider>
  );
};

export const useVis = () => useContext<VisState>(VisContext);
