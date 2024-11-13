import { configureStore } from "@reduxjs/toolkit";
import { chatSlice } from "./slice/chatSlice";
import { authSlice } from "./slice/authSlice";
import { userSlice } from "./slice/userSlice";
import chatReducer from "./slice/chatSlice"
import authReducer from "./slice/authSlice"
import userReducer from "./slice/userSlice";

export const store = configureStore({
    reducer: {
        [userSlice.name]: userReducer,
        [chatSlice.name]: chatReducer,
        [authSlice.name]: authReducer,
    },
});