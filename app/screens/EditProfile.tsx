import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AvatarEditModal from "../screens/AvatarModalComponent";
import CoverEditModal from "../screens/CoverPhotoModal";
import PositionSelectionModal from "../screens/PositionSelectionModal";
import SocialLinksModal from "../screens/SocialLinkModal";
import CONFIG from "../utils/config";
import { useTheme } from "../utils/themeContext";

const EditProfileScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [tempData, setTempData] = useState<any>({});
  const [roles, setRoles] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [accountType, setAccountType] = useState<string>("");

  // Social Links States
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [selectedSocialIndex, setSelectedSocialIndex] = useState<number | null>(
    null,
  );

  // Image Editing States
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const [editType, setEditType] = useState<"avatar" | "cover">("avatar");

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1a1a1a",
    inputBg: isDark ? "#1E2530" : "#FFFFFF",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
    subText: isDark ? "#94A3B8" : "#666",
  };

  useEffect(() => {
    initScreen();
  }, []);

  const initScreen = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;
      setAccountType(user?.account_type || "");

      await fetchUserDetails();
      user?.account_type === "individual"
        ? await fetchRoles()
        : await fetchIndustries();
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/user/details`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();
      setData(json.data);
      setTempData(json.data);
    } catch (error) {
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/selections/roles`,
      );
      if (response.ok) {
        const json = await response.json();
        setRoles(json?.data?.map((r: any) => ({ value: r.id, label: r.name })));
      }
    } catch (error) {
    }
  };

  const fetchIndustries = async () => {
    try {
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/selections/industries`,
      );
      if (response.ok) {
        const json = await response.json();
        setIndustries(
          json?.data?.map((c: any) => ({ value: c.id, label: c.name })),
        );
      }
    } catch (error) {
    }
  };

  const handlePickImage = async (type: "avatar" | "cover") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setEditType(type);
      setImageToEdit(result.assets[0].uri);
      setZoom(1);
      type === "avatar"
        ? setAvatarModalVisible(true)
        : setCoverModalVisible(true);
    }
  };

  const handleSaveImage = async () => {
    if (!imageToEdit) return;
    setAvatarModalVisible(false);
    setCoverModalVisible(false);

    const formData = new FormData();
    const isAvatar = editType === "avatar";
    const endpoint = isAvatar
      ? "/api/user/profile/update-profile-picture"
      : "/api/user/profile/update-cover-picture";

    formData.append(isAvatar ? "avatar" : "cover", {
      uri:
        Platform.OS === "android"
          ? imageToEdit
          : imageToEdit.replace("file://", ""),
      type: "image/jpeg",
      name: isAvatar ? "avatar_crop.jpg" : "cover_crop.jpg",
    } as any);

    try {
      const userString = await AsyncStorage.getItem("user");
      const user = JSON.parse(userString!);
      const res = await fetch(`${CONFIG.API_ENDPOINT}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const json = await res.json();
      if (json.status) {
        Alert.alert("Success", `${editType} updated successfully`);
        fetchUserDetails();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to upload image");
    }
  };

  // Social Link Save Logic
  const handleSaveSocial = (newLink: any) => {
    const updatedLinks = [...(data?.bio?.socialLinks || [])];
    if (selectedSocialIndex !== null) {
      updatedLinks[selectedSocialIndex] = newLink; // Edit existing
    } else {
      updatedLinks.push(newLink); // Add new
    }
    setData({ ...data, bio: { ...data.bio, socialLinks: updatedLinks } });
  };

  const checkIfDataChanged = () =>
    JSON.stringify(data) !== JSON.stringify(tempData);

  const handleSubmit = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      const user = JSON.parse(userString!);
      const newData: any = {
        bio: data?.bio?.bio,
        website: data?.bio?.website,
        socialLink: data?.bio?.socialLinks,
      };
      accountType === "individual"
        ? (newData["position"] = data?.position)
        : (newData["company_category"] = data?.company_category);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/profile/bio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(newData),
        },
      );

      if (response.ok) {
        const json = await response.json();
        setData(json.data);
        setTempData(json.data);
        Alert.alert("Success", "Profile updated successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const getDropdownLabel = () =>
    accountType === "individual"
      ? data?.position
      : data?.company_category?.name;

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Edit profile
          </Text>
        </View>

        {/* Profile Card */}
        <View
          style={[
            styles.profileHeaderCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Image
            source={{
              uri: data?.avatar_url || "https://via.placeholder.com/50",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {data?.name}
            </Text>
            <Text style={{ color: theme.subText }}>@{data?.username}</Text>
          </View>
          <TouchableOpacity
            style={styles.blueBtn}
            onPress={() => handlePickImage("avatar")}
          >
            <Text style={styles.btnText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        {/* Cover Photo */}
        <Text style={[styles.sectionLabel, { color: theme.text }]}>
          Cover photo
        </Text>
        <View style={styles.coverWrapper}>
          {data?.cover ? (
            <Image source={{ uri: data.cover }} style={styles.coverPhoto} />
          ) : (
            <View
              style={[styles.coverPhoto, { backgroundColor: theme.inputBg }]}
            />
          )}
          <TouchableOpacity
            style={styles.coverBtn}
            onPress={() => handlePickImage("cover")}
          >
            <Text style={styles.btnText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Position/Industry */}
        <Text style={[styles.label, { color: theme.text }]}>
          {accountType === "individual" ? "Position" : "Industry"}
        </Text>
        <TouchableOpacity
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              justifyContent: "center",
            },
          ]}
          onPress={() => setRoleModalVisible(true)}
        >
          <View style={styles.dropdownRow}>
            <Text
              style={{ color: getDropdownLabel() ? theme.text : theme.subText }}
            >
              {getDropdownLabel() ||
                `Select ${accountType === "individual" ? "position" : "industry"}`}
            </Text>
            <Ionicons name="chevron-down" size={18} color={theme.subText} />
          </View>
        </TouchableOpacity>

        {/* Website */}
        <Text style={[styles.label, { color: theme.text }]}>Website</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={data?.bio?.website || ""}
          onChangeText={(val) =>
            setData({ ...data, bio: { ...data.bio, website: val } })
          }
          placeholder="https://example.com"
          placeholderTextColor={theme.subText}
        />

        <TouchableOpacity
          style={styles.personalDetailsLink}
          onPress={() => router.push("/screens/PersonalDetails")}
        >
          <Text style={{ color: theme.primary, fontWeight: "600" }}>
            Edit Personal & Address Details →
          </Text>
        </TouchableOpacity>

        {/* Bio */}
        <Text style={[styles.label, { color: theme.text }]}>Bio</Text>
        <TextInput
          style={[
            styles.input,
            styles.bioInput,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          multiline
          value={data?.bio?.bio || ""}
          onChangeText={(val) =>
            setData({ ...data, bio: { ...data.bio, bio: val } })
          }
          placeholder="Add information about yourself"
          placeholderTextColor={theme.subText}
        />

        {/* Social Links Section */}
        <Text style={[styles.sectionLabel, { color: theme.text }]}>
          Social Links
        </Text>
        <View
          style={[
            styles.socialCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {data?.bio?.socialLinks?.map((link: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={[styles.socialRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setSelectedSocialIndex(index);
                setSocialModalVisible(true);
              }}
            >
              <View>
                <Text
                  style={[
                    styles.socialName,
                    { color: theme.text, textTransform: "capitalize" },
                  ]}
                >
                  {link.name}
                </Text>
                <Text style={{ color: theme.subText, fontSize: 13 }}>
                  {link.username}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.text} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setSelectedSocialIndex(null);
              setSocialModalVisible(true);
            }}
          >
            <Ionicons name="add" size={28} color={theme.subText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: checkIfDataChanged() ? theme.primary : "#A5B4FC",
            },
          ]}
          onPress={handleSubmit}
          disabled={!checkIfDataChanged()}
        >
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODALS */}
      <PositionSelectionModal
        visible={roleModalVisible}
        onClose={() => setRoleModalVisible(false)}
        roles={accountType === "individual" ? roles : industries}
        currentPosition={getDropdownLabel()}
        onSelect={(item: any) => {
          accountType === "individual"
            ? setData({ ...data, position: item.label })
            : setData({
                ...data,
                company_category: { id: item.value, name: item.label },
              });
        }}
      />

      <SocialLinksModal
        visible={socialModalVisible}
        onClose={() => setSocialModalVisible(false)}
        initialData={
          selectedSocialIndex !== null
            ? data?.bio?.socialLinks[selectedSocialIndex]
            : null
        }
        onSave={handleSaveSocial}
      />

      <AvatarEditModal
        visible={avatarModalVisible}
        imageUri={imageToEdit}
        zoom={zoom}
        setZoom={setZoom}
        onClose={() => setAvatarModalVisible(false)}
        onSave={handleSaveImage}
      />
      <CoverEditModal
        visible={coverModalVisible}
        imageUri={imageToEdit}
        zoom={zoom}
        setZoom={setZoom}
        onClose={() => setCoverModalVisible(false)}
        onSave={handleSaveImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  profileHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 25,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userName: { fontSize: 16, fontWeight: "bold" },
  blueBtn: {
    backgroundColor: "#4F75FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  sectionLabel: { fontSize: 18, fontWeight: "bold", marginVertical: 15 },
  coverWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  coverPhoto: { ...StyleSheet.absoluteFillObject },
  coverBtn: {
    backgroundColor: "#4F75FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  bioInput: { height: 100, textAlignVertical: "top", paddingTop: 10 },
  personalDetailsLink: { marginBottom: 20, paddingVertical: 5 },
  // Social Links Styles
  socialCard: { borderRadius: 15, borderWidth: 1, overflow: "hidden" },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  socialName: { fontWeight: "bold" },
  addBtn: { height: 55, justifyContent: "center", alignItems: "center" },
  submitBtn: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  submitText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});

export default EditProfileScreen;
