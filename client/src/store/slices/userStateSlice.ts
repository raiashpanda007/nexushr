import { createSlice } from "@reduxjs/toolkit";
import type { UserState, UserDetails } from "@/types";


export function GetUserMetaDataFromLocolStorage(): UserDetails | null {
    if (typeof window === 'undefined') return null;
    const valueFromCookie = localStorage.getItem("User_meta_data");
    try {
        return valueFromCookie ? JSON.parse(valueFromCookie) : null;
    } catch (e) {
        return null;
    }
}

const initialState: UserState = {
    userDetails: GetUserMetaDataFromLocolStorage(),
};
const userStateSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserDetails: (state, action) => {
            state.userDetails = action.payload
            try {
                localStorage.setItem("User_meta_data", JSON.stringify(action.payload));
            } catch (error) {
                console.error("UNABLE TO UPDATE USER INFO ON CLIENT SIDE :: ", error);
            }
        },

        clearUserDetails: (state) => {
            state.userDetails = null
            try {
                localStorage.removeItem("User_meta_data");
            } catch (error) {
                console.error("UNABLE TO CLEAR USER INFO ON CLIENT SIDE :: ", error);
            }
        }
    }
})

export const { setUserDetails, clearUserDetails } = userStateSlice.actions
export default userStateSlice.reducer