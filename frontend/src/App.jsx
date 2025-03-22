import React, {useState, useEffect, useRef} from "react";
import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import axios from "axios";
import "./App.css"; 
import UsaChoroplethMaps from "./UsaChoroplethMaps.jsx";
import GlowingButton from './GlowingButton';
import "primereact/resources/themes/lara-dark-teal/theme.css";
// import "primereact/resources/themes/lara-light-teal/fonts/InterVariable.woff2"
import "primeicons/primeicons.css"

import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import {Avatar} from "primereact/avatar";
import {Menu} from "primereact/menu";

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
  const [sessionID, setSessionID] = useState(null);


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
      setSessionID(null);
      
     const uploadResponse = await axios.post("http://localhost:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
         withCredentials: true,
      });

      const newSessionId = uploadResponse.data.session_id; // Unique session ID
      console.log("Session ID:", newSessionId," type:",typeof(newSessionId));
      setSessionID(newSessionId);
      const source = new EventSource(`http://localhost:5000/predict-stream?session_id=${newSessionId}`,{withCredentials:true});

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
    const progress_updates = [
      {"step": 1, "label": "Uploading Images to Server", "status": "completed"},
      {"step": 2, "label": "Classification of Map Legend Type", "status": "processing"},
      {"step": 3, "label": "Segmentation of Map Components", "status": "processing"},
      {"step": 4, "label": "Segmentation of State Boundaries", "status": "processing"},
      {"step": 5, "label": "Text Data Extraction using OCR", "status": "processing"},
      {"step": 6, "label": "State Color to Legend Data Mapping", "status": "processing"}
    ];
    setProgress(progress_updates);
  };

  
  const handleDownload = async () => {
    try {
      const response = await axios.get("http://localhost:5000/download", {
        responseType: "blob", // Important for handling binary data
          withCredentials: true,
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

  // ============================================
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get("http://localhost:5000/auth/status", {withCredentials: true});
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
                console.log(error)
            }
        };
        fetchUser();
    }, []);

    const handleLogin = () => {
        window.location.href = "http://localhost:5000/login";
    };

    const handleLogout = async () => {
        setUser(null)
        try {
            await axios.get("http://localhost:5000/logout", {withCredentials: true});
        } catch (error) {
            console.log(error)
        }
    }
  // ============================================

    const dropDownRef = useRef(null)

  return (
      <PrimeReactProvider value={primeReactConfig}>
    <Router>
      <div className="app-container">
          <div style={{marginBottom: 10, display: "flex", justifyContent: "end", alignItems: "center", gap: 10}}>
              {user ? (<>
                  <div><span style={{color: "var(--primary-color)"}}>Hello</span>, <span style={{fontSize: "2rem"}}>{user.name}</span></div>
                  <div style={{flexGrow: 1}}></div>
                <Avatar image={user.picture} size="xlarge" shape="circle"
                        imageFallback="http://localhost:5000/static/images/fallback_profile_image.png"
                />

                  <Menu popup ref={dropDownRef} style={{marginTop: "10px"}}
                    model={[{
                        label: "Logout",
                        icon: "pi pi-sign-out",
                        command: () => {handleLogout()},
                    }]}
                  />
                  <Button icon="pi pi-angle-down" text
                    onClick={(event) => dropDownRef.current.toggle(event)}
                  />
              </>): (
                  <></>
              )}
          </div>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div style={{ 
    textAlign: 'center', 
    fontFamily: "'Poppins', sans-serif", 
    padding: '30px',
    background: 'url("src/wall7.png") center/cover no-repeat, #1a1a1a',
    backdropFilter:'20px',
    color: 'white',
    borderRadius:'35px'
}}>

    <div style={{ 
        fontSize: '36px', 
        fontWeight: 'bold', 
        color: '#fff', 
        textShadow: '0px 0px 10px rgba(0, 255, 255, 0.8), 0px 0px 20px rgba(0, 255, 255, 0.5)',
        paddingBottom: '10px'
    }}>
        <h2>Choropleth Map Analytics</h2>
    </div>
    <div style={{ 
        fontSize: '18px', 
        marginTop: '10px', 
        maxWidth: '600px', 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        lineHeight: '1.5',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.1)', 
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        borderRadius: '10px',
    }}>
        An End-to-End System for Reverse Engineering Choropleth Map Images
    </div>
</div>
              {user ? (<>
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
                        <GlowingButton label="AI" onClick={() => {/*  */}} />
                    </div>
                  </div>
                )}
              </>) : (
                    <div style={{marginBlock: "20px"}}>
                        <Button label="Sign in with Google" icon="pi pi-google" onClick={handleLogin}></Button>
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
