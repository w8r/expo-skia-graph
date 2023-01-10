import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Vis } from "./src/Vis";

export default function App() {
  return (
    <View style={styles.container}>
      <Vis />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
