import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";

const DATA = Array.from({ length: 20 }).map((_, i) => ({
  id: i.toString(),
  title: `Post ${i + 1}`,
  image: "https://picsum.photos/400/300?random=" + i,
}));

export default function NewsFeed() {
  return (
    <View style={styles.container}>
      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Custom "blur" using gradient */}
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.7)"]}
        style={styles.gradientOverlay}
      >
        <Text style={styles.overlayText}>Custom Gradient Blur</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  card: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  image: { width: "100%", height: 200 },
  title: { padding: 12, fontSize: 16, fontWeight: "bold" },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { fontSize: 16, fontWeight: "bold", color: "#000" },
});
