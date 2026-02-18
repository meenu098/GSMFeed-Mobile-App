import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import SkeletonLoader from "../../../../components/SkeletonLoader";
import { resolveAuthenticatedRoute } from "../../../../shared/authGate";
import CONFIG from "../../../../shared/config";
import { clearUser, setUser } from "../../../../shared/storage";
import InterestSelectionScreen from "../../InterestSelection";

import NotificationStep from "./NotificationStep";
import ProfilePictureStep from "./ProfilePictureStep";
import FollowRecommendationsStep from "./Recommentation";
import OnboardingWelcome from "./welcome";
import WhatsAppVerification from "./whatsapp";

const OnboardingController = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileUploadLoading, setProfileUploadLoading] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) {
          router.replace("/screens/auth/Login");
          return;
        }

        const user = JSON.parse(userString);
        const targetRoute = resolveAuthenticatedRoute(user);
        if (targetRoute === "/screens/Newsfeed") {
          router.replace("/screens/Newsfeed");
          return;
        }

        if (targetRoute === "/under-review") {
          router.replace("/under-review");
          return;
        }

        setUserData(user);
      } finally {
        setLoading(false);
      }
    };
    initUser();
  }, [router]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const hasPrimaryAccess = (value: unknown) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return (
        normalized === "1" || normalized === "true" || normalized === "yes"
      );
    }
    return false;
  };

  const resolveImageType = (imageUri: string) => {
    const extension = imageUri.split(".").pop()?.toLowerCase();
    if (extension === "png") return "image/png";
    if (extension === "heic" || extension === "heif") return "image/heic";
    return "image/jpeg";
  };

  const handleProfilePictureNext = async (imageUri: string | null) => {
    if (!imageUri) {
      handleNext();
      return;
    }

    if (!userData?.token) {
      Alert.alert("Error", "User session not found.");
      return;
    }

    if (profileUploadLoading) {
      return;
    }

    setProfileUploadLoading(true);
    try {
      const fileName = imageUri.split("/").pop() || `avatar-${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("avatar", {
        uri: imageUri,
        name: fileName,
        type: resolveImageType(imageUri),
      } as any);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/profile/update-profile-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userData.token}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );

      const result = await response.json();
      if (response.ok && result?.status) {
        const updatedAvatar =
          result?.data?.avatar ||
          result?.data?.avatar_url ||
          result?.user?.avatar ||
          userData?.avatar;

        const mergedUser = {
          ...userData,
          ...(result?.data || {}),
          avatar: updatedAvatar,
        };

        setUserData(mergedUser);
        await setUser(mergedUser);
        handleNext();
      } else {
        Alert.alert(
          "Error",
          result?.message || "Failed to upload profile picture.",
        );
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setProfileUploadLoading(false);
    }
  };

  const handleNotificationNext = async (enabled: boolean) => {
    if (notificationSaving) return;

    if (!userData?.token) {
      handleNext();
      return;
    }

    setNotificationSaving(true);
    try {
      await fetch(`${CONFIG.API_ENDPOINT}/api/notifications/settings/pause`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: enabled ? null : "unli",
        }),
      });
    } catch {
      // Continue onboarding even if this preference sync fails.
    } finally {
      setNotificationSaving(false);
      handleNext();
    }
  };

  const fetchLatestAuthData = async (token: string) => {
    try {
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/auth/get-auth-data`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const result = await response.json();
      if (response.ok && result?.status && result?.data) {
        return result.data;
      }
    } catch {
      // Continue using onboarding response payload if revalidation fails.
    }
    return null;
  };

  const handleInterestSelectionNext = () => {
    handleNext();
  };

  const handleFinish = async () => {
    if (!userData?.token) {
      Alert.alert("Error", "User session not found.");
      return;
    }

    try {
      const finishPayloads = [
        { step: 7, onboarding_steps: 7, step_key: "follow_suggestions" },
        { step: "follow_suggestions", onboarding_steps: 7 },
      ];

      let res: Response | null = null;
      let result: any = null;

      for (const payload of finishPayloads) {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/user/onboarding`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${userData?.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        const responseBody = await response.json();

        res = response;
        result = responseBody;
        if (response.ok && responseBody?.status) {
          break;
        }
      }

      if (res?.ok && result?.status) {
        const latestAuthData = await fetchLatestAuthData(userData.token);
        const onboardingPayload = result?.data || result?.user || {};
        const mergedUser = {
          ...userData,
          ...onboardingPayload,
          ...(latestAuthData || {}),
          onboarding_completed: true,
          is_onboarding_complete: true,
        };

        setUserData(mergedUser);
        await setUser(mergedUser);
        const primaryAccess =
          mergedUser?.has_account_primary_access ??
          onboardingPayload?.has_account_primary_access ??
          latestAuthData?.has_account_primary_access;

        router.replace(
          hasPrimaryAccess(primaryAccess)
            ? "/screens/Newsfeed"
            : "/under-review",
        );
      } else {
        Alert.alert(
          "Error",
          result?.message || "Failed to complete onboarding.",
        );
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  if (loading) {
    return <SkeletonLoader variant="form" withScroll={false} />;
  }

  return (
    <View style={styles.container}>
      {step === 1 && (
        <OnboardingWelcome
          onStart={handleNext}
          onLogout={async () => {
            await clearUser();
            router.replace("/screens/auth/Login");
          }}
        />
      )}
      {step === 2 && (
        <WhatsAppVerification
          user={userData}
          displayPhone={userData?.phone_full || userData?.phone || ""}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <NotificationStep onNext={handleNotificationNext} onBack={handleBack} />
      )}
      {step === 4 && (
        <ProfilePictureStep
          onNext={handleProfilePictureNext}
          onBack={handleBack}
          isSubmitting={profileUploadLoading}
        />
      )}
      {step === 5 && (
        <InterestSelectionScreen
          mode="onboarding"
          user={userData}
          onSubmitSuccess={handleInterestSelectionNext}
          onBack={handleBack}
        />
      )}
      {step === 6 && (
        <FollowRecommendationsStep
          user={userData}
          onFinish={handleFinish}
          onBack={handleBack}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
});

export default OnboardingController;
