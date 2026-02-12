// import React, { useState } from "react";
// import ListingSummary from "./ListingSummary"; // Step 2
// import SellForm from "./SellForm";

// // CreateListingScreen.tsx
// const CreateListingScreen = () => {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState(null);

//   const handleNextStep = (data: any) => {
//     console.log("Parent received:", data);
//     setFormData(data); // 3. Store the data
//     setStep(2); // 4. Switch the view
//   };
//   return (
//     <>
//       {step === 1 && (
//         <SellForm // FormTemplate inside SellForm handles both Buy/Sell toggles
//           onNext={handleNextStep}
//           onBack={() => console.log("Exit flow")}
//         />
//       )}

//       {step === 2 && (
//         <ListingSummary
//           listingData={formData}
//           onNext={() => console.log("Final submission", formData)}
//           onBack={() => setStep(1)}
//         />
//       )}
//     </>
//   );
// };

// export default CreateListingScreen;
import React, { useState } from "react";
import FormTemplate from "./Formtemplate";
import ListingSummary from "./ListingSummary";

const CreateListingScreen = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  console.log("here");
  const handleNextStep = (data: any) => {
    console.log("CRITICAL: handleNextStep triggered with data:", data);
    setFormData(data);

    // Using a timeout ensures the state update is processed
    // before the screen re-renders
    setTimeout(() => {
      setStep(2);
    }, 100);
  };

  return (
    <>
      {step === 1 && (
        <FormTemplate
          key="step1-form"
          type="Sell"
          onNext={handleNextStep}
          onBack={() => console.log("Exit flow")}
        />
      )}

      {step === 2 && formData && (
        <ListingSummary
          key="step2-summary"
          listingData={formData}
          onNext={() => console.log("Final Flow", formData)}
          onBack={() => setStep(1)}
        />
      )}
    </>
  );
};

export default CreateListingScreen;
