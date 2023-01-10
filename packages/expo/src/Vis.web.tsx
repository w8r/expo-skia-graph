import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
console.log("web");

export const Vis = () => (
  <WithSkiaWeb getComponent={() => import("./Breathe")} />
);
