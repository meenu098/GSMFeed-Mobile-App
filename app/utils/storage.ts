import AsyncStorage from "@react-native-async-storage/async-storage";

export const setUser = async (user: any) => {
  try {
    await AsyncStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
  }
};

export const getUser = async () => {
  try {
    const data = await AsyncStorage.getItem("user");
    return data ? JSON.parse(data) : null;
  } catch (error) {
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem("user");
  } catch (error) {
  }
};
