import React, { useState } from "react";
import axios from "axios";
import "./App.css"; 

function App() {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Handle file selection (allow multiple files)
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  
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

      
      await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      
      const source = new EventSource("http://127.0.0.1:5000/predict-stream");

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received SSE data:", data);
          if (data.progress) {
            setProgress(data.progress);
          }
          
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
    } catch (err) {
      console.error(err);
      setError("Error uploading file(s)");
    }
  };

  
  const handleDownload = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/download", {
        responseType: "blob", // Important for handling binary data
      });
      
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

  
  const renderStepper = () => {
  
    return (
      <div className="stepper-container">
        
        <div className="stepper-line" />
        {/* Render each step */}
        {progress.map((stepObj, index) => {
          const isCompleted = stepObj.status === "completed";
          const isProcessing = stepObj.status === "processing";
          const isPending = stepObj.status === "pending";

          let circleClass = "step-circle";
          if (isCompleted) circleClass += " step-completed";
          if (isProcessing) circleClass += " step-processing";
          if (isPending) circleClass += " step-pending";

          return (
            <div className="step-item" key={index}>
              <div className={circleClass}>
                {isCompleted && <span className="check-mark">&#10003;</span>}
                {isProcessing && <span className="processing-animation" />}
              </div>
              <div className="step-label">{stepObj.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  
  const renderTable = () => {
    if (!results || !Array.isArray(results) || results.length === 0) return null;
    const headers = Object.keys(results[0]); 

    return (
      <table className="results-table">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 ? "row-odd" : "row-even"}>
              {headers.map((header, cellIndex) => (
                <td key={cellIndex}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="app-container">
      <h2 className="title">Choropleth Map Analytics</h2>

      {/* File Upload Form */}
      <div className="form-container">
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleUpload} className="gradient-button upload-btn">
          Upload
        </button>
      </div>

      
      {error && <p className="error-message">{error}</p>}

      {progress && progress.length > 0 && renderStepper()}

      {results && (
        <div className="results-section">
          <h3 className="subtitle">Results</h3>
          {renderTable()}
          <button onClick={handleDownload} className="gradient-button download-btn">
            Download Results
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
