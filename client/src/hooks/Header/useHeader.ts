import { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { clearUserDetails } from "@/store/slices/userStateSlice"
import ApiCaller from "@/utils/ApiCaller"

export function useHeader() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "auth", "logout"],
                retry: false,
            })
        } catch {
            // Even if the API call fails, clear the client-side session
        } finally {
            dispatch(clearUserDetails())
            navigate("/login")
        }
    }

    return {
        loggingOut,
        handleLogout
    }
}
