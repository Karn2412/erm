// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

export const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<any>(() => {
    const stored = localStorage.getItem("userData");
    return stored ? JSON.parse(stored) : null;
  });

  const [company, setCompany] = useState<any>(() => {
    const stored = localStorage.getItem("company");
    return stored ? JSON.parse(stored) : null;
  });

  // persist userData
  useEffect(() => {
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
  }, [userData]);

  // persist company
  useEffect(() => {
    if (company) {
      localStorage.setItem("company", JSON.stringify(company));
    } else {
      localStorage.removeItem("company");
    }
  }, [company]);

  return (
    <UserContext.Provider value={{ userData, setUserData, company, setCompany }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
