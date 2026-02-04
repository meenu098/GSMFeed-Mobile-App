import React, { useState } from "react";
import BroadcastSelection from "../screens/BroadCastSelection";
import BuyForm from "./ListingForms/BuyForm";
import SellForm from "./ListingForms/SellForm";
import ProductSummary from "./ProductSummary";

const BroadcastManager = () => {
  const [currentView, setCurrentView] = useState<"selection" | "sell" | "buy">(
    "selection"
  );
  const [step, setStep] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleSelection = (type: "Sell" | "Buy") => {
    setIsModalVisible(false);
    setCurrentView(type === "Sell" ? "sell" : "buy");
    setStep(1);
  };

  const handleNextStep = () => setStep(2);
  const handleBackStep = () => setStep(1);

  return (
    <>
      {currentView === "selection" && (
        <BroadcastSelection
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelect={handleSelection}
        />
      )}

      {step === 1 && currentView === "sell" && (
        <SellForm
          onNext={handleNextStep}
          onBack={() => setCurrentView("selection")}
        />
      )}
      {step === 1 && currentView === "buy" && (
        <BuyForm
          onNext={handleNextStep}
          onBack={() => setCurrentView("selection")}
        />
      )}

      {step === 2 && (
        <ProductSummary
          type={currentView === "sell" ? "Sell" : "Buy"}
          onBack={handleBackStep}
        />
      )}
    </>
  );
};

export default BroadcastManager;
