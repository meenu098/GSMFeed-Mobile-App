import React from "react";
import FormTemplate from "./Formtemplate";

const SellForm = ({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) => {
  return <FormTemplate type="Sell" onBack={onBack} onNext={onNext} />;
};

export default SellForm;
