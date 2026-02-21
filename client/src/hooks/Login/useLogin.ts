import { useState } from "react"
import ApiCaller from "@/utils/ApiCaller"
import { useNavigate } from "react-router-dom"
import { useAppDispatch } from "@/store/hooks"
import { setUserDetails } from "@/store/slices/userStateSlice"

export function useLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const { ok, response } = await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "auth", "login"],
                body: { email, password }
            })

            // Check if response is successful. ApiCaller returns success: true if API responded with 2xx
            if (ok && response?.success) {
                // Dispatch user details to store
                if (response.data) {
                    dispatch(setUserDetails(response.data))
                }
                // Assuming successful login redirects to dashboard or home
                navigate("/")
            } else {
                setError(response?.message || "Login failed. Please check your credentials.")
            }
        } catch (err) {
            console.error("Login error:", err)
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleLogin
    }
}
