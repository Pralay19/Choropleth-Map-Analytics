"use client"
import { Link } from "react-router-dom"
import { Button } from "primereact/button"
import GlowingButton from "./GlowingButton"

const ResultsActions = ({ onDownload, onAISummary, onVisualizeClick }) => {
  return (
    <div className="action-buttons">
      <Button
        label="New Analysis"
        onClick={() => window.location.reload()}
        icon="pi pi-refresh"
        severity="help"
        rounded
        raised
      />
      <Link to="/visualize">
        <Button
          label="View Visualizations"
          onClick={onVisualizeClick}
          icon="pi pi-chart-bar"
          severity="info"
          rounded
          raised
        />
      </Link>
      <Button label="Download Results" onClick={onDownload} icon="pi pi-download" severity="success" rounded raised />
      <GlowingButton label="AI" onClick={onAISummary} />
    </div>
  )
}

export default ResultsActions
