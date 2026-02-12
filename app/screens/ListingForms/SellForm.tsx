import React from "react";
import FormTemplate from "./Formtemplate";
console.log("sell form loaded");
const SellForm = ({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (data: any) => void; // 1. Ensure type allows data
}) => {
  return (
    <FormTemplate
      type="Sell"
      onBack={onBack}
      onNext={onNext} // 2. Pass the reference
    />
  );
};
export default SellForm;
