import { useRouter } from "expo-router";
import React, { useState } from "react";
import BroadcastSelection from "../screens/BroadCastSelection";
import BuyForm from "./ListingForms/BuyForm";
import ListingSummary from "./ListingForms/ListingSummary";
import ProductDescAI from "./ListingForms/ProductDescAI";
import SellForm from "./ListingForms/SellForm";

const BroadcastManager = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"selection" | "sell" | "buy">(
    "selection",
  );
  const [step, setStep] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<{
    remarks: string;
    hashtags: string[];
  }>({
    remarks: "",
    hashtags: [],
  });

  const resetFlowState = () => {
    setStep(1);
    setProducts([]);
    setEditingIndex(null);
    setSummaryData({ remarks: "", hashtags: [] });
    setCurrentView("selection");
    setIsModalVisible(true);
  };

  const handleSelection = (type: "Sell" | "Buy") => {
    setIsModalVisible(false);
    setCurrentView(type === "Sell" ? "sell" : "buy");
    setStep(1);
  };

  const handleBackToSelection = () => {
    resetFlowState();
  };

  const handleFormNext = (data: any) => {
    setProducts((prev) => {
      if (editingIndex !== null && prev[editingIndex]) {
        const updated = [...prev];
        updated[editingIndex] = { ...updated[editingIndex], ...data };
        return updated;
      }
      return [...prev, data];
    });
    setEditingIndex(null);
    setStep(2);
  };

  const handleSummaryNext = (nextSummaryData: any) => {
    setSummaryData((prev) => ({
      ...prev,
      ...nextSummaryData,
      hashtags: Array.isArray(nextSummaryData?.hashtags)
        ? nextSummaryData.hashtags
        : prev.hashtags,
    }));
    setStep(2.5);
  };

  const handleAiNext = (result?: { postId?: string }) => {
    resetFlowState();
    router.replace({
      pathname: "/screens/Newsfeed",
      params: {
        listingCreated: "1",
        listingCreatedAt: String(Date.now()),
        ...(result?.postId ? { postId: result.postId } : {}),
      },
    });
  };

  const listingData = {
    type: currentView === "sell" ? "Sell" : "Buy",
    products,
    remarks: summaryData.remarks,
    hashtags: summaryData.hashtags,
  };

  if (step === 2.5 && products.length > 0) {
    return (
      <ProductDescAI
        listingData={listingData}
        onNext={handleAiNext}
        onBack={() => setStep(2)}
      />
    );
  }

  if (step === 2 && products.length > 0) {
    return (
      <ListingSummary
        listingData={listingData}
        onNext={handleSummaryNext}
        onBack={() => {
          setEditingIndex(products.length - 1);
          setStep(1);
        }}
        onAddMore={() => {
          setEditingIndex(null);
          setStep(1);
        }}
        onEditProduct={(index: number) => {
          setEditingIndex(index);
          setStep(1);
        }}
      />
    );
  }

  return (
    <>
      {currentView === "selection" && (
        <BroadcastSelection
          visible={isModalVisible}
          onClose={handleBackToSelection}
          onSelect={handleSelection}
        />
      )}

      {step === 1 && currentView === "sell" && (
        <SellForm
          initialData={editingIndex !== null ? products[editingIndex] : undefined}
          onNext={handleFormNext}
          onBack={handleBackToSelection}
        />
      )}
      {step === 1 && currentView === "buy" && (
        <BuyForm
          initialData={editingIndex !== null ? products[editingIndex] : undefined}
          onNext={handleFormNext}
          onBack={handleBackToSelection}
        />
      )}
    </>
  );
};

export default BroadcastManager;
