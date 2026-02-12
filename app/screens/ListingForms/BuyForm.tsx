import React from "react";
import FormTemplate from "./Formtemplate";

const BuyForm = ({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (data: any) => void;
}) => {
  return <FormTemplate type="Buy" onBack={onBack} onNext={onNext} />;
};

export default BuyForm;
