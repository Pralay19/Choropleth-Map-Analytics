"use client"

import { useState, useEffect, useRef, lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import axios from "axios"
import "./App.css"
import Papa from "papaparse"

import { PrimeReactProvider } from "primereact/api"
import { Toast } from "primereact/toast"
import { Messages } from "primereact/messages"
import { Button } from "primereact/button"

// Import components
import Header from "./components/Header"
import UserProfile from "./components/UserProfile"
import FileUploadForm from "./components/FileUploadForm"
import ProgressStepper from "./components/ProgressStepper"
import ResultsTable from "./components/ResultsTable"
import ResultsActions from "./components/ResultsActions"
import AISummaryDialog from "./components/AISummaryDialog"
import Loader from "./components/Loader"
import Loader_Text from "./components/Loader_Text"

// Import services
import { fetchUserStatus, logout, uploadFiles, downloadResults, fetchResultsFromSession } from "./services/api"

// Lazy load the visualization component
const UsaChoroplethMaps = lazy(() => import("./UsaChoroplethMaps.jsx"))

function App() {
  // Configuration for prime react
  const primeReactConfig = {
    ripple: true,
    CSSTransition: true,
  }

  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState([])
  const [results, setResults] = useState(null)
  const [aiGenerateSummary, setAIGeneratedSummary] = useState(null)
  const [error, setError] = useState(null)
  const [sessionID, setSessionID] = useState(null)
  const [aiSummaryVisible, setAISummaryVisible] = useState(false)
  const [aiSummaryAnimate, setAISummaryAnimate] = useState(true)
  const [user, setUser] = useState(null)

  const toast = useRef(null)
  const msg = useRef(null)

  // Handle file upload
  const handleUpload = async (formData) => {
    try {
      setError(null)
      setProgress([])
      setResults(null)
      setAIGeneratedSummary(null)
      setSessionID(null)

      const uploadResponse = await uploadFiles(formData)
      const newSessionId = uploadResponse.session_id
      setSessionID(newSessionId)

      const source = new EventSource(`${import.meta.env.VITE_BACKEND_URL}/predict-stream?session_id=${newSessionId}`, {
        withCredentials: true,
      })

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.progress) {
            setProgress(data.progress)
          }

          if (data.Results) {
            setResults(data.Results)
            setAIGeneratedSummary(data.Summary)
            source.close()
          }

          if (data.status === "fail") {
            setResults(null)
            setError("Image uploaded is not a valid choropleth map image. Please upload a valid image.")
            showMsg("Image uploaded is not a valid choropleth map image. Please upload a valid image.")
            setAIGeneratedSummary(data.Summary)
            source.close()
          }
        } catch (err) {
          console.error("Error parsing SSE data", err)
        }
      }

      source.onerror = () => {
        source.close()
        setError("Error receiving updates")
      }

      // Initial progress update
      const progress_updates = [
        { step: 1, label: "Uploading Images to Server", status: "completed" },
        { step: 2, label: "Classification of Map Legend Type", status: "processing" },
        { step: 3, label: "Segmentation of Map Components", status: "processing" },
        { step: 4, label: "Segmentation of State Boundaries", status: "processing" },
        { step: 5, label: "Text Data Extraction using OCR", status: "processing" },
        { step: 6, label: "State Color to Legend Data Mapping", status: "processing" },
      ]
      setProgress(progress_updates)
    } catch (err) {
      console.error(err)
      setError("Error uploading file(s)")
    }
  }

  // Handle download results
  const handleDownload = async () => {
    try {
      const blob = await downloadResults(sessionID)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "results.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError("Error downloading file")
    }
  }

  // Copy sharable link
  const copySharableLink = () => {
    const copyLink = `${import.meta.env.VITE_FRONTEND_URL}/?session_id=${sessionID}`
    navigator.clipboard
      .writeText(copyLink)
      .then(() => {
        toast.current.show({ severity: "success", summary: "Success", detail: "Successfully copied link!", life: 3000 })
      })
      .catch(() => {
        toast.current.show({ severity: "error", summary: "Error", detail: "Failed to copy link!", life: 3000 })
      })
  }

  // Show error message
  const showMsg = (error) => {
    msg.current.show({ id: "1", sticky: true, severity: "error", summary: "Error", detail: error, closable: false })
  }

  // Handle visualization click
  const handleVisualizeClick = () => {
    window.scrollTo(0, 0)
  }

  // Handle logout
  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      setUser(null)
    }
  }

  // Handle login
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/login`
  }

  // Setup results from shared link
  const setupEmailedResults = async (sessionId) => {
    setSessionID(sessionId)

    try {
      const { csvData, aiSummary } = await fetchResultsFromSession(sessionId)

      const result = Papa.parse(csvData, { header: true }).data
      result.pop() // remove empty item

      setAIGeneratedSummary(aiSummary)

      const fileNames = Object.values(result[result.length - 1])
      const newFiles = []

      for (let i = 1; i <= fileNames.length - 1; i++) {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/static/results/${sessionId}/${fileNames[i]}`, {
          responseType: "blob",
        })
        const file = new File([res.data], fileNames[i], { type: res.data.type })
        newFiles.push(file)
      }

      setFiles(newFiles)
      setResults(result)

      setProgress([
        { step: 1, label: "Uploading Images to Server", status: "completed" },
        { step: 2, label: "Classification of Map Legend Type", status: "completed" },
        { step: 3, label: "Segmentation of Map Components", status: "completed" },
        { step: 4, label: "Segmentation of State Boundaries", status: "completed" },
        { step: 5, label: "Text Data Extraction using OCR", status: "completed" },
        { step: 6, label: "State Color to Legend Data Mapping", status: "completed" },
      ])
    } catch (err) {
      console.log(err)
      setSessionID(null)
      setError(
        "Your data may have been deleted from our servers due to being uploaded a long time ago, or something went wrong!",
      )
    }
  }

  // Fetch user data and handle session from URL
  useEffect(() => {
    const loadUserData = async () => {
      const userData = await fetchUserStatus()
      setUser(userData)
    }

    loadUserData()

    // If user opened the page from email
    const params = new URLSearchParams(window.location.search)
    const hasSessionId = params.has("session_id")

    if (hasSessionId) {
      setupEmailedResults(params.get("session_id"))
    }
  }, [])

  return (
    <PrimeReactProvider value={primeReactConfig}>
      <Toast ref={toast} />

      <Router>
        <div className="app-container">
          <UserProfile user={user} onLogout={handleLogout} />

          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Header />

                  {user ? (
                    <>
                      {progress.length <= 0 && sessionID && (
                        <div className="loader-container">
                          <Loader />
                          <Loader_Text />
                        </div>
                      )}

                      {progress.length <= 0 && !sessionID && (
                        <FileUploadForm onUpload={handleUpload} setFiles={setFiles} />
                      )}

                      {progress && progress.length > 0 && !error && <ProgressStepper progress={progress} />}

                      {results && (
                        <div className="results-section">
                          <h3 className="subtitle">
                            Results
                            <Button
                              label="Share"
                              icon="pi pi-share-alt"
                              rounded
                              text
                              aria-label="Share"
                              iconPos="right"
                              onClick={copySharableLink}
                              tooltip="Copy link to results"
                            />
                          </h3>

                          <ResultsTable results={results} />

                          <ResultsActions
                            onDownload={handleDownload}
                            onAISummary={() => setAISummaryVisible(true)}
                            onVisualizeClick={handleVisualizeClick}
                          />
                        </div>
                      )}

                      <Messages ref={msg} />

                      {error && (
                        <div>
                          <Button
                            label="Try Again"
                            icon="pi pi-refresh"
                            onClick={() => window.location.reload()}
                            severity="danger"
                            rounded
                            raised
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ marginBlock: "20px" }}>
                      <Button label="Sign in with Google" icon="pi pi-google" onClick={handleLogin} />
                    </div>
                  )}

                  <AISummaryDialog
                    visible={aiSummaryVisible}
                    onHide={() => {
                      if (!aiSummaryVisible) return
                      setAISummaryVisible(false)
                      setAISummaryAnimate(false)
                    }}
                    summary={aiGenerateSummary}
                    animate={aiSummaryAnimate}
                  />
                </>
              }
            />
            <Route
              path="/visualize"
              element={
                <Suspense
                  fallback={
                    <div className="loader-container">
                      <Loader />
                      <Loader_Text />
                    </div>
                  }
                >
                  <UsaChoroplethMaps parsedData={JSON.parse(JSON.stringify(results))} files={files} />
                </Suspense>
              }
            />
          </Routes>
        </div>
      </Router>
    </PrimeReactProvider>
  )
}

export default App
