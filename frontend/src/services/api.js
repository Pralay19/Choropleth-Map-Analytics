import axios from "axios"

const API_URL = import.meta.env.VITE_BACKEND_URL

export const fetchUserStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/status`, { withCredentials: true })
    return response.data.user
  } catch (error) {
    console.error("Error fetching user status:", error)
    return null
  }
}

export const logout = async () => {
  try {
    await axios.get(`${API_URL}/logout`, { withCredentials: true })
    return true
  } catch (error) {
    console.error("Error logging out:", error)
    return false
  }
}

export const uploadFiles = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error("Error uploading files:", error)
    throw error
  }
}

export const downloadResults = async (sessionID) => {
  try {
    const response = await axios.get(`${API_URL}/static/results/${sessionID}/data.csv`, {
      responseType: "blob",
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error("Error downloading results:", error)
    throw error
  }
}

export const fetchResultsFromSession = async (sessionId) => {
  try {
    const resCsv = await axios.get(`${API_URL}/static/results/${sessionId}/data.csv`, {
      responseType: "text",
    })

    const resAIGeneratedSummary = await axios.get(`${API_URL}/static/results/${sessionId}/ai_generated_summary.txt`, {
      responseType: "text",
    })

    return {
      csvData: resCsv.data,
      aiSummary: resAIGeneratedSummary.data,
    }
  } catch (error) {
    console.error("Error fetching results from session:", error)
    throw error
  }
}
