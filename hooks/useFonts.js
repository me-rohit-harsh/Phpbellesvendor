import { useFonts } from "expo-font";

export default function useCustomFonts() {
  const [fontsLoaded] = useFonts({
    "MyFont-Regular": require("../assets/fonts/Gilroy-Regular.ttf"),
    "MyFont-Medium": require("../assets/fonts/Gilroy-Medium.ttf"),
    "MyFont-SemiBold": require("../assets/fonts/Gilroy-Semibold.ttf"),
    "MyFont-Bold": require("../assets/fonts/Gilroy-Bold.ttf"),
  });

  return fontsLoaded;
}
