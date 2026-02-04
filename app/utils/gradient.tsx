import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";

const GradientText = ({ text, style }: any) => {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        colors={["#3b82f6", "#8b5cf6", "#f97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
