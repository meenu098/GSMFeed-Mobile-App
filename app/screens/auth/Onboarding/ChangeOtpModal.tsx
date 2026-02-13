import { Feather, FontAwesome } from "@expo/vector-icons";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../shared/themeContext";

interface ChangeOtpNumberModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (
    fullNumber: string,
    countryCode: string,
    localNumber: string,
  ) => void;
  currentPhoneCode: string;
  currentNumber: string;
}

const normalizeCountryCode = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "");

const normalizePhoneNumber = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "");

const formatPhoneDisplay = (countryCode: string, localNumber: string) => {
  if (!countryCode && !localNumber) return "";
  if (!countryCode) return localNumber;
  if (!localNumber) return `+${countryCode}`;
  return `+${countryCode} ${localNumber}`;
};

const ChangeOtpNumberModal = ({
  visible,
  onClose,
  onUpdate,
  currentPhoneCode,
  currentNumber,
}: ChangeOtpNumberModalProps) => {
  const { isDark, screenTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    iso: TCountryCode;
  }>({
    code: normalizeCountryCode(currentPhoneCode) || "971",
    iso: "AE",
  });
  const [phoneNumber, setPhoneNumber] = useState(
    normalizePhoneNumber(currentNumber),
  );

  const colors = {
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : screenTheme.card,
    primary: screenTheme.primary,
    whatsapp: screenTheme.whatsapp,
    disabled: screenTheme.buttonDisabled,
  };

  const countriesData = useMemo(
    () =>
      Object.entries(countries).map(([iso, data]) => ({
        iso: iso as TCountryCode,
        name: data.name,
        phone: String(data.phone[0] || ""),
        emoji: getEmojiFlag(iso as TCountryCode),
      })),
    [],
  );

  // Filter countries for dropdown search
  const countryList = useMemo(() => {
    return countriesData.filter(
      (country) =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.phone.includes(search),
    );
  }, [countriesData, search]);

  useEffect(() => {
    if (!visible) return;

    const code = normalizeCountryCode(currentPhoneCode) || "971";
    const local = normalizePhoneNumber(currentNumber);

    const exactMatch =
      countriesData.find((country) => country.phone === code) ||
      countriesData.find(
        (country) =>
          country.phone.startsWith(code) || code.startsWith(country.phone),
      );

    setSelectedCountry({
      code,
      iso: exactMatch?.iso || "AE",
    });
    setPhoneNumber(local);
    setSearch("");
    setShowPicker(false);
  }, [countriesData, currentNumber, currentPhoneCode, visible]);

  const handleUpdate = () => {
    const sanitizedCode = normalizeCountryCode(selectedCountry.code);
    const sanitizedNumber = normalizePhoneNumber(phoneNumber);

    if (sanitizedNumber.length < 5) {
      return;
    }

    onUpdate(
      formatPhoneDisplay(sanitizedCode, sanitizedNumber),
      sanitizedCode,
      sanitizedNumber,
    );
    onClose();
  };

  const canSubmit = phoneNumber.trim().length >= 5;
  const selectedCountryFlag = getEmojiFlag(selectedCountry.iso || "AE");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContainer, { backgroundColor: colors.card }]}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <FontAwesome name="whatsapp" size={60} color={colors.whatsapp} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Update WhatsApp Number
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Change country code and number, then resend OTP for verification.
          </Text>

          <View style={styles.inputRow}>
            {/* Country Code Selector */}
            <TouchableOpacity
              style={[
                styles.countryPicker,
                {
                  borderColor: showPicker ? colors.primary : colors.border,
                  backgroundColor: colors.inputBg,
                },
              ]}
              onPress={() => setShowPicker(!showPicker)}
            >
              <Text style={styles.flag}>{selectedCountryFlag}</Text>
              <Text style={[styles.codeText, { color: colors.text }]}>
                +{selectedCountry.code}
              </Text>
              <Feather
                name={showPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.subText}
              />
            </TouchableOpacity>

            {/* Phone Number Input */}
            <TextInput
              style={[
                styles.phoneInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholder="Phone number"
              placeholderTextColor={colors.subText}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(value) => setPhoneNumber(normalizePhoneNumber(value))}
            />
          </View>

          {/* Searchable Dropdown */}
          {showPicker && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.searchBar, { color: colors.text, borderBottomColor: colors.border }]}
                placeholder="Search by country or code"
                placeholderTextColor={colors.subText}
                value={search}
                onChangeText={setSearch}
              />
              <FlatList
                data={countryList}
                keyExtractor={(item) => item.iso}
                style={styles.countryList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry({
                        code: String(item.phone),
                        iso: item.iso,
                      });
                      setShowPicker(false);
                    }}
                  >
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      +{item.phone} {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View
            style={[
              styles.previewBox,
              { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" },
            ]}
          >
            <Text style={[styles.previewLabel, { color: colors.subText }]}>
              New number
            </Text>
            <Text style={[styles.previewValue, { color: colors.text }]}>
              {formatPhoneDisplay(selectedCountry.code, phoneNumber) || "-"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.updateBtn,
              {
                backgroundColor: canSubmit ? colors.primary : colors.disabled,
              },
            ]}
            onPress={handleUpdate}
            disabled={!canSubmit}
          >
            <Text style={styles.updateText}>
              {canSubmit ? "Update & Send OTP" : "Enter valid number"}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalContainer: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: "center",
    position: "relative",
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  closeBtn: { position: "absolute", top: 14, right: 14, zIndex: 10 },
  iconCircle: { marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  inputRow: { flexDirection: "row", gap: 10, width: "100%", zIndex: 5 },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 52,
    flex: 0.42,
  },
  flag: { fontSize: 18, marginRight: 6 },
  codeText: { fontSize: 15, fontWeight: "700", flex: 1 },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 52,
  },
  dropdown: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 10,
    elevation: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchBar: {
    borderBottomWidth: 1,
    padding: 10,
    marginBottom: 5,
    fontSize: 14,
  },
  countryList: { maxHeight: 190 },
  countryItem: { flexDirection: "row", padding: 12, alignItems: "center" },
  itemEmoji: { fontSize: 18, marginRight: 10 },
  itemName: { fontSize: 14, flexShrink: 1 },
  previewBox: {
    width: "100%",
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  previewValue: { fontSize: 16, fontWeight: "700" },
  updateBtn: {
    width: "100%",
    height: 52,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  updateText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});

export default ChangeOtpNumberModal;
