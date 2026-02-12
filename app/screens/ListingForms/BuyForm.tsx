import React from "react";
import FormTemplate from "./Formtemplate";

const BuyForm = ({
  initialData,
  onBack,
  onNext,
}: {
  initialData?: any;
  onBack: () => void;
  onNext: (data: any) => void;
}) => {
  return (
    <FormTemplate
      type="Buy"
      initialData={initialData}
      onBack={onBack}
      onNext={onNext}
    />
  );
};

export default BuyForm;
