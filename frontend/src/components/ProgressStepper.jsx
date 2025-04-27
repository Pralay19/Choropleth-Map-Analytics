const ProgressStepper = ({ progress }) => {
    return (
      <div className="stepper-container">
        <div className="stepper-line" />
        {progress.map((stepObj, index) => {
          const isCompleted = stepObj.status === "completed"
          const isProcessing = stepObj.status === "processing"
          const isPending = stepObj.status === "pending"
  
          let circleClass = "step-circle"
          if (isCompleted) circleClass += " step-completed"
          if (isProcessing) circleClass += " step-processing"
          if (isPending) circleClass += " step-pending"
  
          return (
            <div className="step-item" key={index}>
              <div className={circleClass}>
                {isCompleted && <span className="check-mark">&#10003;</span>}
                {isProcessing && <span className="processing-animation" />}
              </div>
              <div className="step-label">{stepObj.label}</div>
            </div>
          )
        })}
      </div>
    )
  }
  
  export default ProgressStepper
  