import { apiClient } from "@/api/apiClient"
import { useNavigate } from "react-router-dom"

/**
 * Logout the current user and clear all auth data
 */
export const logout = () => {
  // Clear token and user data
  apiClient.clearAuth()
  
  // Clear any other stored data if needed
  // localStorage.clear() // Uncomment if you want to clear everything
  
  // Redirect to login
  window.location.href = '/login'
}

