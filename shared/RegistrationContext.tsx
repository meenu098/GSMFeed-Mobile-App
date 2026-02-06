import React, { createContext, useContext, useState } from "react";

const RegistrationContext = createContext<any>(null);

export const RegistrationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [formData, setFormData] = useState({
    account_type: "",
    company_category_id: null,
    country: "",
    email: "",
    est_year: null,
    first_name: "",
    isLead: false,
    otp_token: "",
    password: "",
    phone: "",
    phone_country_code: null,
    position: "",
    representative_email: "",
    representative_first_name: "",
    representative_last_name: "",
    representative_phone: "",
    representative_phone_country_code: null,
    username: "",
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
