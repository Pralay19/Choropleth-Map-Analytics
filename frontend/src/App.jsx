//--------------------------------------------------------------------------------------
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [eventSource, setEventSource] = useState(null);

  // Handle file selection (allow multiple files)
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Handle file upload and set up SSE for updates from the backend
  const handleUpload = async () => {
    if (!files || files.length === 0) {
      alert("Please select one or more files.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setError(null);
      setProgress([]);
      setResults(null);

      // Upload the files to the backend
      await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Set up Server-Sent Events (SSE) to receive progress updates and final results
      const source = new EventSource("http://127.0.0.1:5000/predict-stream");

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received SSE data:", data);
          if (data.progress) {
            setProgress(data.progress);
          }
          // When final results are available, update state and close the SSE connection
          if (data.Results) {
            setResults(data.Results);
            source.close();
          }
        } catch (err) {
          console.error("Error parsing SSE data", err);
        }
      };

      source.onerror = () => {
        source.close();
        setError("Error receiving updates");
      };

      setEventSource(source);
    } catch (err) {
      console.error(err);
      setError("Error uploading file(s)");
    }
  };

  // Handle the download button click to trigger the download route on the backend
  const handleDownload = async () => {
    try {
      // Send a GET request to the backend download route
      const response = await axios.get("http://127.0.0.1:5000/download", {
        responseType: "blob", // Important for handling binary data
      });
      // Create a URL for the blob and simulate a click to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading file", err);
      setError("Error downloading file");
    }
  };

  // Dynamically render the table based on the results data (keys and values)
  const renderTable = () => {
    if (!results || !Array.isArray(results) || results.length === 0) return null;
    const headers = Object.keys(results[0]); // Extract column names dynamically

    return (
      <table
        style={{
          margin: "auto",
          borderCollapse: "collapse",
          width: "90%",
          marginTop: "20px",
        }}
        border="1"
      >
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} style={{ padding: "8px", background: "#f2f2f2" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, cellIndex) => (
                <td key={cellIndex} style={{ padding: "8px" }}>
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Flask AI Prediction</h2>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
        Upload
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Progress</h3>
      <ul>
        {progress.map((step, index) => (
          <li
            key={index}
            style={{ color: step.status === "completed" ? "green" : "black" }}
          >
            {step.label}: {step.status}
          </li>
        ))}
      </ul>

      {results && (
        <div>
          <h3>Results</h3>
          {renderTable()}
          {/* Show Download Results button only when results are available */}
          <button onClick={handleDownload} style={{ marginTop: "20px" }}>
            Download Results
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

