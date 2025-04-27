const ResultsTable = ({ results }) => {
    if (!results || !Array.isArray(results) || results.length === 0) return null
  
    const headers = Object.keys(results[0])
  
    return (
      <div style={{ overflow: "auto", maxHeight: 500, marginBlock: 20 }}>
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
    )
  }
  
  export default ResultsTable
  