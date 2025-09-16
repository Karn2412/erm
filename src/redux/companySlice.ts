import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CompanyState {
  id: string | null;
  name: string;
  logo_url?: string | null;
}

const initialState: CompanyState = {
  id: null,
  name: "",
  logo_url: null,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompany(state, action: PayloadAction<CompanyState>) {
      return { ...state, ...action.payload };
    },
    updateCompany(state: CompanyState, action: PayloadAction<Partial<CompanyState>>) {
      return { ...state, ...action.payload };
    },
    clearCompany() {
      return initialState;
    },
  },
});

export const { setCompany, updateCompany, clearCompany } = companySlice.actions;
export default companySlice.reducer;
