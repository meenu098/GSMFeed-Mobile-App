import { Feather } from "@expo/vector-icons";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import CONFIG from "../../../../shared/config";
import { useTheme } from "../../../../shared/themeContext";
import ChangeOtpNumberModal from "./ChangeOtpModal";

interface WhatsAppVerificationProps {
  user: any;
  onNext: () => void;
  onBack: () => void;
  displayPhone: string;
}

const normalizeCountryCode = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "");

const normalizePhoneNumber = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "");

const inferLocalNumber = (displayPhone: string, code: string) => {
  const normalizedPhone = normalizePhoneNumber(displayPhone);
  if (
    code &&
    normalizedPhone.startsWith(code) &&
    normalizedPhone.length > code.length
  ) {
    return normalizedPhone.slice(code.length);
  }
  return normalizedPhone;
};

const formatPhoneDisplay = (countryCode: string, localNumber: string) => {
  if (!countryCode && !localNumber) return "";
  if (!countryCode) return localNumber;
  if (!localNumber) return `+${countryCode}`;
  return `+${countryCode} ${localNumber}`;
};

const WhatsAppVerification: FC<WhatsAppVerificationProps> = ({
  user,
  onNext,
  onBack,
  displayPhone,
}) => {
  const { isDark } = useTheme();

  const derivedPhoneData = useMemo(() => {
    const countryCode =
      normalizeCountryCode(user?.phone_code) ||
      normalizeCountryCode(user?.phone_country_code) ||
      "971";
    const localNumber =
      normalizePhoneNumber(user?.phone_number) ||
      inferLocalNumber(displayPhone, countryCode);

    return {
      countryCode,
      localNumber,
    };
  }, [displayPhone, user?.phone_code, user?.phone_country_code, user?.phone_number]);

  const [currentPhoneCode, setCurrentPhoneCode] = useState(
    derivedPhoneData.countryCode,
  );
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState(
    derivedPhoneData.localNumber,
  );
  const [resendTimer, setResendTimer] = useState(180); // 3 minutes
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpInputVersion, setOtpInputVersion] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneRef = useRef({
    code: derivedPhoneData.countryCode,
    number: derivedPhoneData.localNumber,
  });

  const colors = {
    bg: isDark ? "#0F172A" : "#E8F5E9",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1D1D1D",
    subText: isDark ? "#94A3B8" : "#4F4F4F",
    whatsapp: "#179D0D",
    danger: "#EF4444",
    buttonDisabled: isDark ? "#334155" : "#CBD5E1",
  };

  useEffect(() => {
    setCurrentPhoneCode(derivedPhoneData.countryCode);
    setCurrentPhoneNumber(derivedPhoneData.localNumber);
  }, [derivedPhoneData.countryCode, derivedPhoneData.localNumber]);

  useEffect(() => {
    phoneRef.current = {
      code: currentPhoneCode,
      number: currentPhoneNumber,
    };
  }, [currentPhoneCode, currentPhoneNumber]);

  const startTimer = useCallback(() => {
    setResendTimer(180);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }, []);

  const formatTime = () => {
    const mins = Math.floor(resendTimer / 60);
    const secs = resendTimer % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const resetVerificationState = useCallback(() => {
    setOtpCode("");
    setStatus("idle");
    setOtpInputVersion((prev) => prev + 1);
  }, []);

  const sendOTP = useCallback(
    async (phoneOverride?: { code: string; number: string }) => {
      const code = normalizeCountryCode(
        phoneOverride?.code ?? phoneRef.current.code,
      );
      const number = normalizePhoneNumber(
        phoneOverride?.number ?? phoneRef.current.number,
      );

      resetVerificationState();
      startTimer();
      try {
        await fetch(`${CONFIG.API_ENDPOINT}/api/auth/verify-account-mobile/otp`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user?.email,
            phone_code: code,
            phone_country_code: code,
            phone_number: number,
            phone: formatPhoneDisplay(code, number),
          }),
        });
      } catch (error) {
        console.error("OTP Send Error:", error);
      }
    },
    [resetVerificationState, startTimer, user?.email, user?.token],
  );

  const verifyOtp = async (code: string) => {
    if (code.length !== 6) return;

    startTimer();
    setStatus("loading");
    try {
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/auth/verify-access/otp/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user?.email, otp: code }),
        },
      );
      const data = await res.json();

      if (data.status) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    sendOTP();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sendOTP]);

  const formattedCurrentPhone = formatPhoneDisplay(
    currentPhoneCode,
    currentPhoneNumber,
  );
  const canProceed = status === "success";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Verify your WhatsApp number
        </Text>
        <Text style={[styles.subtitleTop, { color: colors.subText }]}>
          Enter the 6-digit OTP to continue onboarding.
        </Text>

        <View
          style={[
            styles.phoneCard,
            { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" },
          ]}
        >
          <Text style={[styles.phoneLabel, { color: colors.subText }]}>
            OTP sent to
          </Text>
          <Text style={[styles.phoneValue, { color: colors.text }]}>
            {formattedCurrentPhone || displayPhone || "Phone not available"}
          </Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.pencilBtn}
          >
            <Feather name="edit-2" size={16} color={colors.whatsapp} />
            <Text style={[styles.editText, { color: colors.whatsapp }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        <OtpInput
          key={`otp-${otpInputVersion}`}
          numberOfDigits={6}
          focusColor={colors.whatsapp}
          onTextChange={(value) => {
            setOtpCode(value);
            if (status !== "loading") {
              setStatus("idle");
            }
          }}
          onFilled={(code) => verifyOtp(code)}
          theme={{
            containerStyle: styles.otpContainer,
            pinCodeContainerStyle: StyleSheet.flatten([
              styles.otpBox,
              {
                backgroundColor: isDark ? colors.bg : "#FFF",
                borderColor: isDark ? "#334155" : "#E2E8F0",
              },
            ]),
            pinCodeTextStyle: { color: colors.text },
            focusedPinCodeContainerStyle: {
              borderColor: colors.whatsapp,
              borderWidth: 2,
            },
          }}
        />

        <View style={styles.statusRow}>
          {status === "loading" && (
            <View style={styles.row}>
              <ActivityIndicator color={colors.whatsapp} />
              <Text style={{ color: colors.whatsapp, marginLeft: 10 }}>
                Verifying...
              </Text>
            </View>
          )}
          {status === "success" && (
            <Text style={{ color: colors.whatsapp }}>✓ Verified</Text>
          )}
          {status === "error" && (
            <Text style={{ color: colors.danger }}>
              Invalid code. Please try again.
            </Text>
          )}
          {status !== "loading" && resendTimer > 0 ? (
            <Text style={[styles.resendText, { color: colors.subText }]}>
              Resend in {formatTime()}
            </Text>
          ) : null}
          {status !== "loading" && resendTimer === 0 ? (
            <TouchableOpacity onPress={() => sendOTP()}>
              <Text style={{ color: colors.whatsapp, fontWeight: "700" }}>
                Resend Code
              </Text>
            </TouchableOpacity>
          ) : null}
          {!canProceed && otpCode.length > 0 && status !== "loading" ? (
            <Text style={[styles.verifyHint, { color: colors.subText }]}>
              Verify OTP to enable Next
            </Text>
          ) : null}
        </View>

        <View style={styles.navButtons}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                borderColor: isDark ? "#334155" : "#E2E8F0",
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
              },
            ]}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
            <Text style={[styles.navText, { color: colors.text }]}> Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            style={[
              styles.nextBtn,
              { backgroundColor: canProceed ? colors.whatsapp : colors.buttonDisabled },
            ]}
            disabled={!canProceed}
          >
            <Text style={[styles.navText, { color: "#FFFFFF" }]}>Next </Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ChangeOtpNumberModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onUpdate={(_fullNumber, countryCode, localNumber) => {
          const normalizedCode = normalizeCountryCode(countryCode) || "971";
          const normalizedNumber = normalizePhoneNumber(localNumber);
          setCurrentPhoneCode(normalizedCode);
          setCurrentPhoneNumber(normalizedNumber);
          phoneRef.current = {
            code: normalizedCode,
            number: normalizedNumber,
          };
          sendOTP({ code: normalizedCode, number: normalizedNumber });
        }}
        currentPhoneCode={currentPhoneCode}
        currentNumber={currentPhoneNumber}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 16 },
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    elevation: 4,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleTop: { fontSize: 14, textAlign: "center", marginBottom: 16 },
  phoneCard: {
    width: "100%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    alignItems: "center",
  },
  phoneLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  phoneValue: { fontSize: 18, fontWeight: "700" },
  pencilBtn: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: { fontSize: 13, fontWeight: "700" },
  otpContainer: { width: "100%", height: 82 },
  otpBox: {
    width: 44,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  statusRow: {
    marginTop: 16,
    minHeight: 62,
    justifyContent: "center",
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  resendText: { fontSize: 14, marginTop: 4 },
  verifyHint: { fontSize: 12, marginTop: 8 },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    marginTop: 16,
  },
  backBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { fontSize: 16, fontWeight: "700" },
});

export default WhatsAppVerification;
