import {useState, useEffect, useRef} from "react";
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

import Papa from "papaparse";

import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import {Avatar} from "primereact/avatar";
import {Menu} from "primereact/menu";
import Loader from "./components/Loader.jsx";
import Loader_Text from "./components/Loader_Text.jsx";
import {Dialog} from "primereact/dialog";
import TypewriterMarkdown from "./components/TypewriterMarkdown.jsx";
import {Toast} from "primereact/toast";

function App() {
  // confiuration for prime react
  const primeReactConfig = {
    ripple: true,
    CSSTransition: true,
  }

  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState(null);
  const [aiGenerateSummary, setAIGeneratedSummary] = useState(null)
  const [error, setError] = useState(null);
  const [sessionID, setSessionID] = useState(null);

  const [aiSummaryVisible, setAISummaryVisible] = useState(false);
  const [aiSummaryAnimate, setAISummaryAnimate] = useState(true)

  const toast = useRef(null);

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
      setAIGeneratedSummary(null)
      setSessionID(null);
      
     const uploadResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
         withCredentials: true,
      });

      const newSessionId = uploadResponse.data.session_id; // Unique session ID
      console.log("Session ID:", newSessionId," type:",typeof(newSessionId));
      setSessionID(newSessionId);
      const source = new EventSource(`${import.meta.env.VITE_BACKEND_URL}/predict-stream?session_id=${newSessionId}`,{withCredentials:true});

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received SSE data:", data);
          if (data.progress) {
            setProgress(data.progress);
          }
          
          if (data.Results) {
            setResults(data.Results);
            setAIGeneratedSummary(data.Summary);
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/static/results/${sessionID}/data.csv`, {
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
        <div style={{overflow: 'auto', maxHeight: 500, marginBlock: 20}}>
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

  const copySharableLink = () => {
    const copyLink = `${import.meta.env.VITE_FRONTEND_URL}/?session_id=${sessionID}`;
    navigator.clipboard.writeText(copyLink)
        .then(() => {
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Successfully copied link!', life: 3000 });
        })
        .catch(() => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to copy link!', life: 3000 });
        });
  };

  // ============================================
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/status`, {withCredentials: true});
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
                console.log(error)
            }
        };
        fetchUser();


        // If user opened the page from email
        const params = new URLSearchParams(window.location.search);
        const hasSessionId = params.has('session_id');

        const setupEmailedResults = async () => {
            const sessionId = params.get('session_id');
          setSessionID(sessionId)

          try {
              const resCsv = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/static/results/${sessionId}/data.csv`, { responseType: 'text' });
              // await new Promise(resolve => setTimeout(resolve, 10 * 1000));

              const result = Papa.parse(resCsv.data, { header: true }).data;
              result.pop(); // remove empty item
              // console.log(result); // JSON array


              const resAIGeneratedSummary = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/static/results/${sessionId}/ai_generated_summary.txt`, { responseType: 'text' });
              setAIGeneratedSummary(resAIGeneratedSummary.data)

              const fileNames = Object.values(result[result.length-1]);
              for(let i=1; i<=fileNames.length-1; i++) {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/static/results/${sessionId}/${fileNames[i]}`, { responseType: 'blob' });
                const file = new File([res.data], fileNames[i], { type: res.data.type });
                setFiles(prev => [...prev, file]);
              }

              setResults(result);

              setProgress([
                { step: 1, label: "Uploading Images to Server", status: "completed" },
                { step: 2, label: "Classification of Map Legend Type", status: "completed" },
                { step: 3, label: "Segmentation of Map Components", status: "completed" },
                { step: 4, label: "Segmentation of State Boundaries", status: "completed" },
                { step: 5, label: "Text Data Extraction using OCR", status: "completed" },
                { step: 6, label: "State Color to Legend Data Mapping", status: "completed" }
              ]);
            } catch (err) {
              console.log(err);
              setSessionID(null)
              setError("Your data may have been deleted from our servers due to being uploaded a long time ago, or something went wrong!")
            }
        }

        if (hasSessionId) {
          setupEmailedResults()
        }
    }, []);

    const handleLogin = () => {
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/login`;
    };

    const handleLogout = async () => {
        setUser(null)
        try {
            await axios.get(`${import.meta.env.VITE_BACKEND_URL}/logout`, {withCredentials: true});
        } catch (error) {
            console.log(error)
        }
    }
  // ============================================

    const dropDownRef = useRef(null)

  return (
      <PrimeReactProvider value={primeReactConfig}>
          <Toast ref={toast} />
    <Router>
      <div className="app-container">
          <div style={{marginBottom: 10, display: "flex", justifyContent: "end", alignItems: "center", gap: 10}}>
              {user ? (<>
                  <div><span style={{color: "var(--primary-color)"}}>Hello</span>, <span style={{fontSize: "1.5rem"}}>{user.name}</span></div>
                  <div style={{flexGrow: 1}}></div>
                <Avatar image={user.picture} size="large" shape="circle"
                        imageFallback={`/images/fallback_profile_image.png`}
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
    background: 'url("/images/wall7.png") center/cover no-repeat, #1a1a1a',
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
                  {progress.length<=0 && sessionID &&(
                      <div className="loader-container">
                          <Loader />
                          <Loader_Text />
                      </div>
                  )}

                {/* File Upload Form */}
                {progress.length<=0 && !sessionID && (<div className="form-container">
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
                    <h3 className="subtitle">Results
                        <Button label="Share" icon="pi pi-share-alt" rounded text aria-label="Share" iconPos="right" onClick={copySharableLink}
                                tooltip="Copy link to results"
                        />
                    </h3>
                    {renderTable()}

                    <div className="action-buttons">
                      <Link to="/visualize">
                        <Button label="View Visualizations" onClick={handleVisualizeClick} icon="pi pi-chart-bar" severity="info" rounded raised/>
                      </Link>

                        <Button label="Download Results" onClick={handleDownload} icon="pi pi-download" severity='success' rounded raised/>
                        <GlowingButton label="AI" onClick={() => setAISummaryVisible(true)} />
                    </div>
                  </div>
                )}
              </>) : (
                <div style={{marginBlock: "20px"}}>
                    <Button label="Sign in with Google" icon="pi pi-google" onClick={handleLogin}></Button>
                </div>
                )}

                <Dialog header="AI Generated Summary" visible={aiSummaryVisible} style={{ width: '90vw' }}
                        onHide={() => {
                            if (!aiSummaryVisible) return;
                            setAISummaryVisible(false);
                            setAISummaryAnimate(false)
                        }}
                >
                    <TypewriterMarkdown text={aiGenerateSummary} speed={50} animate={aiSummaryAnimate} />
                </Dialog>
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
