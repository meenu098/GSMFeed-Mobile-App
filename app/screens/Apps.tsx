import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

type ToolCard = {
  key: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  locked?: boolean;
  onPress?: () => void;
};

type ImeiMode = "imei" | "serial";

type CurrencyResponse = {
  success?: boolean;
  base?: string;
  rates?: Record<string, number>;
};

const VAT_API_URL = "https://api.vatcheckapi.com/v2/check";
const VAT_API_KEY =
  process.env.EXPO_PUBLIC_VAT_CHECK_API_KEY ||
  "vpbZlFqJ2JBnlzK3hFhg2sxQiDN1tUH8bYCoPN7h";

const isOperator = (value: string) =>
  value === "+" || value === "-" || value === "×" || value === "÷";

const formatCalculatedValue = (value: number) => {
  const fixed = Number(value.toFixed(10));
  return Number.isInteger(fixed)
    ? String(fixed)
    : String(fixed).replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
};

const evaluateExpression = (expression: string): number | null => {
  const normalized = expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");

  if (!normalized) return null;
  if (!/^[0-9+\-*/.()]+$/.test(normalized)) return null;
  if (/[*+/.-]{2,}/.test(normalized.replace(/--/g, ""))) return null;
  if (/[*+/.-]$/.test(normalized)) return null;

  try {
    const result = Function(`"use strict"; return (${normalized});`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
};

const SectionHeader = ({
  title,
  lineColor,
  textColor,
}: {
  title: string;
  lineColor: string;
  textColor: string;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
    <View style={[styles.sectionLine, { backgroundColor: lineColor }]} />
  </View>
);

const AppCard = ({
  item,
  bg,
  text,
  subText,
  border,
}: {
  item: ToolCard;
  bg: string;
  text: string;
  subText: string;
  border: string;
}) => (
  <TouchableOpacity
    style={styles.cardWrap}
    activeOpacity={item.disabled ? 1 : 0.7}
    onPress={item.disabled ? undefined : item.onPress}
    disabled={item.disabled}
  >
    <View
      style={[
        styles.cardIconBox,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: item.disabled ? 0.5 : 1,
        },
      ]}
    >
      {item.icon}
      {item.locked ? (
        <MaterialCommunityIcons
          name="diamond-stone"
          size={14}
          color="#f59e0b"
          style={styles.lockIcon}
        />
      ) : null}
    </View>
    <Text
      style={[
        styles.cardLabel,
        { color: item.disabled ? subText : text },
      ]}
      numberOfLines={2}
    >
      {item.label}
    </Text>
  </TouchableOpacity>
);

const ResultBadge = ({
  ok,
  theme,
}: {
  ok: boolean;
  theme: { success: string; error: string };
}) => (
  <View
    style={[
      styles.resultBadge,
      { backgroundColor: ok ? theme.success : theme.error },
    ]}
  >
    <Feather name={ok ? "check" : "x"} size={30} color="#fff" />
  </View>
);

export default function AppsScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [vatModalVisible, setVatModalVisible] = useState(false);
  const [imeiModalVisible, setImeiModalVisible] = useState(false);
  const [calculatorModalVisible, setCalculatorModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencyPickerTarget, setCurrencyPickerTarget] = useState<
    "from" | "to" | null
  >(null);

  const [vatNumber, setVatNumber] = useState("");
  const [vatLoading, setVatLoading] = useState(false);
  const [vatResult, setVatResult] = useState<{
    checked: boolean;
    valid: boolean;
    message: string;
  }>({ checked: false, valid: false, message: "" });

  const [imeiMode, setImeiMode] = useState<ImeiMode>("imei");
  const [imeiNumber, setImeiNumber] = useState("");
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imeiResult, setImeiResult] = useState<{
    checked: boolean;
    ok: boolean;
    message: string;
  }>({ checked: false, ok: false, message: "" });

  const [calcExpression, setCalcExpression] = useState("0");
  const [calcResult, setCalcResult] = useState<string>("");
  const calcDisplayScrollRef = useRef<ScrollView | null>(null);

  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState("");
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [currencyBase, setCurrencyBase] = useState("USD");
  const [currencyAmount, setCurrencyAmount] = useState("1");
  const [currencyFrom, setCurrencyFrom] = useState("USD");
  const [currencyTo, setCurrencyTo] = useState("AED");
  const [currencySearch, setCurrencySearch] = useState("");
  const [currencyResult, setCurrencyResult] = useState<string>("");

  const triggerSelectionHaptic = useCallback(() => {
    if (Platform.OS === "web") return;
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  }, []);

  const triggerErrorHaptic = useCallback(() => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
  }, []);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F1F5F9",
    cardBg: isDark ? "#121721" : "#E9EEF3",
    text: isDark ? "#F8FAFC" : "#323B46",
    subText: isDark ? "#94A3B8" : "#8A9099",
    border: isDark ? "#1E293B" : "#D5DCE3",
    primary: "#3B66F5",
    modalBg: isDark ? "#131A25" : "#FFFFFF",
    modalOverlay: "rgba(0,0,0,0.38)",
    success: "#37B26C",
    error: "#EF4444",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
  };

  const getToken = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  const handleVatCheck = async () => {
    const number = vatNumber.trim();
    if (!number) {
      setVatResult({
        checked: true,
        valid: false,
        message: "Please enter a VAT number.",
      });
      return;
    }

    try {
      setVatLoading(true);
      setVatResult({ checked: false, valid: false, message: "" });
      const response = await fetch(
        `${VAT_API_URL}?vat_number=${encodeURIComponent(number)}&apikey=${encodeURIComponent(VAT_API_KEY)}`,
      );
      const json = await response.json();

      const valid =
        Boolean(json?.valid) ||
        Boolean(json?.is_valid) ||
        String(json?.status || "")
          .toLowerCase()
          .includes("valid");

      setVatResult({
        checked: true,
        valid,
        message: valid
          ? `${number} is a valid VAT number.`
          : `${number} is not a valid VAT number.`,
      });
    } catch {
      setVatResult({
        checked: true,
        valid: false,
        message: "Unable to verify VAT number right now.",
      });
    } finally {
      setVatLoading(false);
    }
  };

  const handleImeiCheck = async () => {
    const number = imeiNumber.trim();
    if (number.length < 5) return;

    try {
      setImeiLoading(true);
      setImeiResult({ checked: false, ok: false, message: "" });
      const token = await getToken();
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/imei/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          number,
          type: imeiMode,
        }),
      });
      const json = await response.json();

      const message =
        String(json?.message || json?.data?.message || "").trim() ||
        `${number} check completed.`;
      const ok =
        Boolean(json?.status) ||
        Boolean(json?.success) ||
        response.ok;
      setImeiResult({
        checked: true,
        ok,
        message: ok ? message : message || `${number} is not clean.`,
      });
    } catch {
      setImeiResult({
        checked: true,
        ok: false,
        message: "Could not check this number right now.",
      });
    } finally {
      setImeiLoading(false);
    }
  };

  const handleOpenCurrency = async () => {
    setCurrencyModalVisible(true);
    if (Object.keys(currencyRates).length > 0) return;

    try {
      setCurrencyLoading(true);
      setCurrencyError("");
      const token = await getToken();
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/currency-rates`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json: CurrencyResponse = await response.json();

      if (!json?.rates || typeof json.rates !== "object") {
        setCurrencyError("Currency rates are unavailable right now.");
        return;
      }

      const base = String(json.base || "USD");
      setCurrencyBase(base);
      setCurrencyRates(json.rates);

      const hasUsd = Object.prototype.hasOwnProperty.call(json.rates, "USD");
      const hasAed = Object.prototype.hasOwnProperty.call(json.rates, "AED");

      setCurrencyFrom(hasUsd ? "USD" : base);
      setCurrencyTo(hasAed ? "AED" : base);
      setCurrencyResult("");
    } catch {
      setCurrencyError("Could not load currency rates.");
    } finally {
      setCurrencyLoading(false);
    }
  };

  const currencyCodes = useMemo(
    () => Object.keys(currencyRates).sort((a, b) => a.localeCompare(b)),
    [currencyRates],
  );

  const filteredCurrencyCodes = useMemo(() => {
    const term = currencySearch.trim().toUpperCase();
    if (!term) return currencyCodes;
    return currencyCodes.filter((code) => code.includes(term));
  }, [currencyCodes, currencySearch]);

  const calcPreview = useMemo(() => {
    const result = evaluateExpression(calcExpression);
    return result === null ? "" : formatCalculatedValue(result);
  }, [calcExpression]);

  const calcHintLabel = useMemo(() => {
    if (calcResult === "Invalid expression") return calcResult;
    if (calcResult) return `= ${calcResult}`;
    if (calcPreview) return `≈ ${calcPreview}`;
    return "Tap = to calculate";
  }, [calcPreview, calcResult]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      calcDisplayScrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [calcExpression, calcResult]);

  const handleConvertCurrency = () => {
    const amount = Number(currencyAmount);
    if (!Number.isFinite(amount)) {
      setCurrencyResult("Invalid amount");
      return;
    }
    const fromRate = currencyRates[currencyFrom];
    const toRate = currencyRates[currencyTo];
    if (!fromRate || !toRate) {
      setCurrencyResult("Conversion unavailable");
      return;
    }

    const converted = (amount / fromRate) * toRate;
    setCurrencyResult(
      `${amount.toLocaleString()} ${currencyFrom} = ${converted.toLocaleString(undefined, {
        maximumFractionDigits: 6,
      })} ${currencyTo}`,
    );
  };

  const handleCalculate = () => {
    const result = evaluateExpression(calcExpression);
    if (result === null) {
      setCalcResult("Invalid expression");
      triggerErrorHaptic();
      return;
    }
    const displayResult = formatCalculatedValue(result);
    setCalcResult(displayResult);
    setCalcExpression(displayResult);
    triggerSuccessHaptic();
  };

  const handleCalcTap = (value: string) => {
    triggerSelectionHaptic();
    setCalcResult("");

    if (/^\d$/.test(value)) {
      setCalcExpression((prev) => (prev === "0" ? value : `${prev}${value}`));
      return;
    }

    if (value === ".") {
      setCalcExpression((prev) => {
        const segments = prev.split(/[+\-×÷]/);
        const lastSegment = segments[segments.length - 1] || "";
        if (lastSegment.includes(".")) return prev;
        if (prev === "0") return "0.";
        if (isOperator(prev.slice(-1))) return `${prev}0.`;
        return `${prev}.`;
      });
      return;
    }

    if (isOperator(value)) {
      setCalcExpression((prev) => {
        if (!prev) return value === "-" ? "-" : "0";
        if (isOperator(prev.slice(-1))) return `${prev.slice(0, -1)}${value}`;
        return `${prev}${value}`;
      });
      return;
    }
  };

  const handleCalcClear = () => {
    triggerSelectionHaptic();
    setCalcExpression("0");
    setCalcResult("");
  };

  const handleCalcBackspace = () => {
    triggerSelectionHaptic();
    setCalcResult("");
    setCalcExpression((prev) => {
      if (prev.length <= 1) return "0";
      const next = prev.slice(0, -1);
      return next || "0";
    });
  };

  const handleCalcToggleSign = () => {
    triggerSelectionHaptic();
    const result = evaluateExpression(calcExpression);
    if (result === null) return;
    const toggled = formatCalculatedValue(result * -1);
    setCalcExpression(toggled);
    setCalcResult(toggled);
  };

  const handleCalcPercent = () => {
    triggerSelectionHaptic();
    const result = evaluateExpression(calcExpression);
    if (result === null) return;
    const percent = formatCalculatedValue(result / 100);
    setCalcExpression(percent);
    setCalcResult(percent);
  };

  const monitorCards: ToolCard[] = [
    {
      key: "vat",
      label: "VAT Check",
      icon: (
        <MaterialCommunityIcons
          name="alarm-light-outline"
          size={26}
          color={theme.text}
        />
      ),
      onPress: () => {
        setVatResult({ checked: false, valid: false, message: "" });
        setVatNumber("");
        setVatModalVisible(true);
      },
    },
    {
      key: "imei",
      label: "IMEI Check",
      icon: <Ionicons name="qr-code-outline" size={26} color={theme.text} />,
      onPress: () => {
        setImeiResult({ checked: false, ok: false, message: "" });
        setImeiNumber("");
        setImeiMode("imei");
        setImeiModalVisible(true);
      },
    },
    {
      key: "company",
      label: "Company Check",
      icon: (
        <MaterialCommunityIcons
          name="office-building-outline"
          size={24}
          color={theme.subText}
        />
      ),
      disabled: true,
      locked: true,
    },
  ];

  const toolCards: ToolCard[] = [
    {
      key: "calculator",
      label: "Calculator",
      icon: <Ionicons name="calculator-outline" size={24} color={theme.text} />,
      onPress: () => {
        setCalcExpression("0");
        setCalcResult("");
        setCalculatorModalVisible(true);
      },
    },
    {
      key: "currency",
      label: "Currency Converter",
      icon: (
        <MaterialCommunityIcons
          name="currency-usd"
          size={24}
          color={theme.text}
        />
      ),
      onPress: handleOpenCurrency,
    },
    {
      key: "price-history",
      label: "Price History",
      icon: <Ionicons name="stats-chart-outline" size={24} color={theme.subText} />,
      disabled: true,
    },
  ];

  const applicationCards: ToolCard[] = [
    {
      key: "events",
      label: "Events",
      icon: (
        <MaterialCommunityIcons
          name="calendar-star"
          size={24}
          color={theme.text}
        />
      ),
      disabled: true,
    },
    {
      key: "marketplace",
      label: "Marketplace",
      icon: (
        <MaterialCommunityIcons name="store-outline" size={24} color={theme.subText} />
      ),
      disabled: true,
      locked: true,
    },
    {
      key: "auctions",
      label: "Auctions",
      icon: <MaterialCommunityIcons name="gavel" size={24} color={theme.subText} />,
      disabled: true,
      locked: true,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 30,
          paddingHorizontal: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: theme.text }]}>Apps</Text>

        <SectionHeader
          title="Monitor"
          lineColor={theme.border}
          textColor={theme.subText}
        />
        <View style={styles.gridRow}>
          {monitorCards.map((item) => (
            <AppCard
              key={item.key}
              item={item}
              bg={theme.cardBg}
              text={theme.text}
              subText={theme.subText}
              border={theme.border}
            />
          ))}
        </View>

        <SectionHeader
          title="Tools"
          lineColor={theme.border}
          textColor={theme.subText}
        />
        <View style={styles.gridRow}>
          {toolCards.map((item) => (
            <AppCard
              key={item.key}
              item={item}
              bg={theme.cardBg}
              text={theme.text}
              subText={theme.subText}
              border={theme.border}
            />
          ))}
        </View>

        <SectionHeader
          title="Applications"
          lineColor={theme.border}
          textColor={theme.subText}
        />
        <View style={styles.gridRow}>
          {applicationCards.map((item) => (
            <AppCard
              key={item.key}
              item={item}
              bg={theme.cardBg}
              text={theme.text}
              subText={theme.subText}
              border={theme.border}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={vatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVatModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                VAT number validation
              </Text>
              <TouchableOpacity onPress={() => setVatModalVisible(false)}>
                <Feather name="x" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            {vatResult.checked ? (
              <View style={styles.resultWrap}>
                <ResultBadge ok={vatResult.valid} theme={theme} />
                <Text style={[styles.resultText, { color: theme.text }]}>
                  {vatResult.message}
                </Text>
              </View>
            ) : null}

            <TextInput
              value={vatNumber}
              onChangeText={setVatNumber}
              placeholder="Enter VAT number"
              placeholderTextColor={theme.subText}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                },
              ]}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleVatCheck}
              disabled={vatLoading}
            >
              {vatLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Check</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={imeiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImeiModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                IMEI Checker
              </Text>
              <TouchableOpacity onPress={() => setImeiModalVisible(false)}>
                <Feather name="x" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.segmentWrap, { backgroundColor: theme.cardBg }]}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  imeiMode === "imei" && { backgroundColor: theme.primary },
                ]}
                onPress={() => setImeiMode("imei")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: imeiMode === "imei" ? "#fff" : theme.text },
                  ]}
                >
                  Imei
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  imeiMode === "serial" && { backgroundColor: theme.primary },
                ]}
                onPress={() => setImeiMode("serial")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: imeiMode === "serial" ? "#fff" : theme.text },
                  ]}
                >
                  Serial
                </Text>
              </TouchableOpacity>
            </View>

            {imeiResult.checked ? (
              <View style={styles.resultWrap}>
                <ResultBadge ok={imeiResult.ok} theme={theme} />
                <Text style={[styles.resultText, { color: theme.text }]}>
                  {imeiResult.message}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.inputLabel, { color: theme.subText }]}>
              Enter number (at least 5 digits)
            </Text>
            <TextInput
              value={imeiNumber}
              onChangeText={setImeiNumber}
              placeholder="e.g. 123123"
              placeholderTextColor={theme.subText}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                },
              ]}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    imeiNumber.trim().length >= 5 ? theme.primary : theme.border,
                },
              ]}
              onPress={handleImeiCheck}
              disabled={imeiNumber.trim().length < 5 || imeiLoading}
            >
              {imeiLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Check</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={calculatorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalculatorModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Calculator
              </Text>
              <TouchableOpacity onPress={() => setCalculatorModalVisible(false)}>
                <Feather name="x" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.calcDisplay,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                },
              ]}
            >
              <ScrollView
                ref={calcDisplayScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.calcDisplayScroll}
              >
                <Text
                  style={[styles.calcExpression, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {calcExpression}
                </Text>
              </ScrollView>
              <Text
                style={[
                  styles.calcHint,
                  {
                    color:
                      calcResult === "Invalid expression"
                        ? theme.error
                        : theme.subText,
                  },
                ]}
              >
                {calcHintLabel}
              </Text>
            </View>

            <View style={styles.calcActionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.calcActionBtn,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCalcClear}
              >
                <Text style={[styles.calcActionText, { color: theme.error }]}>C</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.calcActionBtn,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCalcToggleSign}
              >
                <Text style={[styles.calcActionText, { color: theme.text }]}>±</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.calcActionBtn,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCalcPercent}
              >
                <Text style={[styles.calcActionText, { color: theme.text }]}>%</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.calcActionBtn,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCalcBackspace}
              >
                <Text style={[styles.calcActionText, { color: theme.text }]}>
                  ⌫
                </Text>
              </Pressable>
            </View>

            <View style={styles.keypadWrap}>
              {[
                ["7", "8", "9", "÷"],
                ["4", "5", "6", "×"],
                ["1", "2", "3", "-"],
                ["0", ".", "=", "+"],
              ].map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                  {row.map((key) => {
                    const isEqual = key === "=";
                    const isOp = isOperator(key);
                    return (
                      <Pressable
                        key={key}
                        style={({ pressed }) => [
                          styles.keypadBtn,
                          {
                            backgroundColor: isEqual
                              ? theme.primary
                              : isOp
                                ? theme.cardBg
                                : theme.inputBg,
                            borderColor: theme.border,
                          },
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => {
                          if (isEqual) {
                            handleCalculate();
                            return;
                          }
                          handleCalcTap(key);
                        }}
                      >
                        <Text
                          style={[
                            styles.keypadText,
                            {
                              color: isEqual
                                ? "#fff"
                                : isOp
                                  ? theme.primary
                                  : theme.text,
                            },
                          ]}
                        >
                          {key}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Currency Converter
              </Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Feather name="x" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            {currencyLoading ? (
              <ActivityIndicator color={theme.primary} size="large" />
            ) : (
              <>
                {currencyError ? (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {currencyError}
                  </Text>
                ) : null}

                <Text style={[styles.rateInfo, { color: theme.subText }]}>
                  Base: {currencyBase}
                </Text>

                <TextInput
                  value={currencyAmount}
                  onChangeText={setCurrencyAmount}
                  keyboardType="decimal-pad"
                  placeholder="Amount"
                  placeholderTextColor={theme.subText}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                    },
                  ]}
                />

                <View style={styles.currencyRow}>
                  <TouchableOpacity
                    style={[
                      styles.currencyPickerBtn,
                      { borderColor: theme.border, backgroundColor: theme.inputBg },
                    ]}
                    onPress={() => setCurrencyPickerTarget("from")}
                  >
                    <Text style={{ color: theme.text, fontWeight: "700" }}>
                      From: {currencyFrom}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.currencyPickerBtn,
                      { borderColor: theme.border, backgroundColor: theme.inputBg },
                    ]}
                    onPress={() => setCurrencyPickerTarget("to")}
                  >
                    <Text style={{ color: theme.text, fontWeight: "700" }}>
                      To: {currencyTo}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  onPress={handleConvertCurrency}
                >
                  <Text style={styles.primaryButtonText}>Convert</Text>
                </TouchableOpacity>

                {currencyResult ? (
                  <Text style={[styles.calcResult, { color: theme.text }]}>
                    {currencyResult}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(currencyPickerTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyPickerTarget(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.pickerCard, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Currency
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCurrencyPickerTarget(null);
                  setCurrencySearch("");
                }}
              >
                <Feather name="x" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={currencySearch}
              onChangeText={setCurrencySearch}
              placeholder="Search currency code"
              placeholderTextColor={theme.subText}
              autoCapitalize="characters"
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                },
              ]}
            />

            <ScrollView>
              {filteredCurrencyCodes.map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.pickerRow, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    if (currencyPickerTarget === "from") setCurrencyFrom(code);
                    if (currencyPickerTarget === "to") setCurrencyTo(code);
                    setCurrencyPickerTarget(null);
                    setCurrencySearch("");
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight: "600" }}>
                    {code}
                  </Text>
                </TouchableOpacity>
              ))}
              {filteredCurrencyCodes.length === 0 ? (
                <Text style={[styles.emptyPicker, { color: theme.subText }]}>
                  No currencies found.
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 28 / 2,
    fontWeight: "500",
  },
  sectionLine: {
    flex: 1,
    height: 1,
    marginLeft: 12,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cardWrap: {
    width: "32%",
    alignItems: "center",
  },
  cardIconBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 23 / 2,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 17,
    minHeight: 34,
  },
  lockIcon: {
    position: "absolute",
    top: 7,
    right: 7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 30 / 2,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginLeft: 26,
  },
  resultWrap: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  resultBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  resultText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  primaryButton: {
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  segmentWrap: {
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    padding: 3,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  calcDisplay: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    minHeight: 78,
    justifyContent: "flex-end",
  },
  calcDisplayScroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  calcExpression: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "right",
  },
  calcHint: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "500",
  },
  calcActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  calcActionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calcActionText: {
    fontSize: 16,
    fontWeight: "700",
  },
  keypadWrap: {
    gap: 8,
  },
  keypadRow: {
    flexDirection: "row",
    gap: 8,
  },
  keypadBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadText: {
    fontSize: 22,
    fontWeight: "700",
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  calcResult: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    marginBottom: 8,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  rateInfo: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  currencyPickerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxHeight: "80%",
  },
  pickerRow: {
    height: 42,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  emptyPicker: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
    fontWeight: "500",
  },
});
