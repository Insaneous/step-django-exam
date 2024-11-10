import { configureStore } from "@reduxjs/toolkit";
import { chatSlice } from "./slice/chatSlice";
import { authSlice } from "./slice/authSlice";
import chatReducer from "./slice/chatSlice"
import authReducer from "./slice/authSlice"

export const store = configureStore({
    reducer: {
        [chatSlice.name]: chatReducer,
        [authSlice.name]: authReducer,
    },
});