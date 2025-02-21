import React, { useState } from "react";
import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import axios from "axios";
import "./App.css"; 
import UsaChoroplethMaps from "./UsaChoroplethMaps.jsx";

import "primereact/resources/themes/lara-light-amber/theme.css";
// import "primereact/resources/themes/lara-light-teal/fonts/InterVariable.woff2"
import "primeicons/primeicons.css"

import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';

function App() {
  // confiuration for prime react
  const primeReactConfig = {
    ripple: true,
    CSSTransition: true,
  }

  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);


  // Handle file selection (allow multiple files)
  const handleFileChange = (e) => {
    setFiles(Array.from(e.files));
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
        <div style={{overflowY: 'auto'}}>
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
        </div>

    );
  };

  const handleVisualizeClick = () => {
    window.scrollTo(0, 0); // Scroll to top-left
  };
  return (
      <PrimeReactProvider value={primeReactConfig}>
    <Router>
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="title">Choropleth Map Analytics</div>
                <div style={{color: '#656565'}}>An End-to-End System for Reverse Engineering Choropleth Map Images</div>

                {/* File Upload Form */}
                {progress.length<=0 && (<div className="form-container">
                  <FileUpload
                      multiple
                      accept="image/*"
                      onSelect={handleFileChange}
                      onClear={() => setFiles([])}
                      onRemove={(e) => setFiles(files.filter((f) => f !== e.file))}
                      customUpload={true}
                      uploadHandler={handleUpload}
                  />
                </div>)}

                {error && <p className="error-message">{error}</p>}

                {progress && progress.length > 0 && renderStepper()}

                {results && (
                  <div className="results-section">
                    <h3 className="subtitle">Results</h3>
                    {renderTable()}

                    <div className="action-buttons">
                      <Link to="/visualize">
                        <Button label="View Visualizations" onClick={handleVisualizeClick} icon="pi pi-chart-bar" severity="info" rounded raised/>
                      </Link>
                      <Button label="Download Results" onClick={handleDownload} icon="pi pi-download" severity='success' rounded raised/>
                    </div>
                  </div>
                )}
              </>
            }
          />
          <Route path="/visualize" element={<UsaChoroplethMaps parsedData={JSON.parse(JSON.stringify(results))} files={files} />} />
        </Routes>
      </div>
    </Router>
      </PrimeReactProvider>
  );
}

export default App;
