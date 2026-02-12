import React from "react";
import FormTemplate from "./Formtemplate";

const SellForm = ({
  initialData,
  onBack,
  onNext,
}: {
  initialData?: any;
  onBack: () => void;
  onNext: (data: any) => void; // 1. Ensure type allows data
}) => {
  return (
    <FormTemplate
      type="Sell"
      initialData={initialData}
      onBack={onBack}
      onNext={onNext} // 2. Pass the reference
    />
  );
};
export default SellForm;
