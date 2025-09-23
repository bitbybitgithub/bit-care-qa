import { createSlice } from "@reduxjs/toolkit";

// import { createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

interface AuthState {
  isAuthenticated: boolean;
  // token: string | null;        //  Uncomment later for JWT
  // loading: boolean;            //  Uncomment later for API loading state
  // error: string | null;        //  Uncomment later for API errors
}

const initialState: AuthState = {
  isAuthenticated: false,
  // token: localStorage.getItem("token"), //  Uncomment later
  // loading: false,
  // error: null,
};

/* 
// NodeJS Future: async thunk for login with JWT

export const login = createAsyncThunk<
  string, // return type
  { email: string; password: string }, // argument type
  { rejectValue: string } // reject type
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", credentials);
    localStorage.setItem("token", res.data.token);
    return res.data.token;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
  }
});
*/

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Dummy login 
    loginSuccess: (state) => {
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      // state.token = null;          //  Uncomment later
      // state.error = null;          //  Uncomment later
      // localStorage.removeItem("token"); //  Uncomment later
    },
  },
  // extraReducers: (builder) => {
  //   builder
  //     .addCase(login.pending, (state) => {
  //       state.loading = true;
  //       state.error = null;
  //     })
  //     .addCase(login.fulfilled, (state, action) => {
  //       state.loading = false;
  //       state.token = action.payload;
  //       state.isAuthenticated = true;
  //     })
  //     .addCase(login.rejected, (state, action) => {
  //       state.loading = false;
  //       state.error = action.payload ?? "Login failed";
  //     });
  // },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
