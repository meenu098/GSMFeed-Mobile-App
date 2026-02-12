import React, { createContext, useContext, useState } from "react";

const RegistrationContext = createContext<any>(null);

export const RegistrationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [formData, setFormData] = useState({
    account_type: "", // "business" or "individual"
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
    phone_country_code: null,
    country: "",
    username: "",
    password: "",
    isLead: false,
    otp_token: "",
    dob: "",
    company_id: null,
    position: null,
    company_name: "",
    company_category_id: null,
    est_year: null,
    representative_first_name: "",
    representative_last_name: "",
    representative_email: "",
    representative_phone: "",
    representative_phone_country_code: null,
  });

  const updateFormData = (newData: any) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <RegistrationContext.Provider value={{ formData, updateFormData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => useContext(RegistrationContext);
