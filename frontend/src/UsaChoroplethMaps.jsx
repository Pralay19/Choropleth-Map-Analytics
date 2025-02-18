import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

const UsaChoroplethMaps = ({ parsedData, files=[] }) => {
    const [maps, setMaps] = useState([]);

    const [mappedFiles, setMappedFiles] = useState({});
    const [mapColorScale, setMapColorScale] = useState('Blues');


    const [fileNamesInOrder, setFileNamesInOrder] = useState([])
    console.log(files)
    useEffect(() => {
        if(!parsedData || parsedData.length <= 0) return;

        
        // console.log(Object.values(parsedData.splice(-1)[0]).slice(1)+" HELLO")
        // setFileNamesInOrder(Object.values(parsedData.splice(-1)[0]).slice(1));
        setFileNamesInOrder(Object.values(parsedData.slice(-1)[0]).slice(1));


        if (parsedData.length === 0) return;

        // Get column headers, excluding state name column
        const headers = Object.keys(parsedData[0]).filter(header =>
            header !== 'State_Name' && header !== 'state_name' && header !== 'state');

        // Set up maps array
        const mapsConfig = headers.map(column => {
            return {
                id: `map-${column.replace(/\s+/g, '-').toLowerCase()}`,
                title: column,
                data: {
                    locations: parsedData.map(row => getStateAbbreviation(row.State_Name || row.state_name || row.state)),
                    z: parsedData.map(row => row[column]),
                    text: parsedData.map(row => `${row.State_Name || row.state_name || row.state}: ${row[column]}`),
                },
            };
        });

        setMaps(mapsConfig);
    // }, [csvData]);
    }, [parsedData]);

    useEffect(() => {
        setMappedFiles(prevMappedFiles => {
            const newMappedFiles = { ...prevMappedFiles };
            files.forEach(file => {
                newMappedFiles[file.name] = file;
            });
            return newMappedFiles;
        });
    }, [files]);

    // Render each map after state update
    useEffect(() => {
        maps.forEach(map => {
            const values = map.data.z;

            const plotData = [{
                type: 'choropleth',
                locationmode: 'USA-states',
                locations: map.data.locations,
                z: values,
                text: map.data.text,
                colorscale: mapColorScale,
                colorbar: {
                    title: map.title,
                    thickness: 20
                },
                autocolorscale: false,
                zmin: Math.min(...values.filter(v => !isNaN(v))),
                zmax: Math.max(...values.filter(v => !isNaN(v)))
            }];

            const layout = {
                title: {text: map.title},
                geo: {
                    scope: 'usa',
                    showlakes: false,
                    lakecolor: 'rgb(255, 255, 255)'
                },
                margin: {
                    l: 60,
                    r: 60,
                    t: 50,
                    b: 50
                },
                height: 500
            };

            Plotly.newPlot(map.id, plotData, layout, {responsive: true});
        });
    }, [maps,mapColorScale]);

    // Helper function to convert state names to abbreviations
    function getStateAbbreviation(stateName) {
        if (!stateName) return '';

        const stateMap = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
            'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
            'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
            'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
            'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
            'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
            'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
            'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
            'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
            'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
            'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
        };
        return stateMap[stateName] || '';
    }

    return (
        <div className="usa-choropleth-container">
            <div>
              <label htmlFor="colorScale">Select Color Scale: </label>
              <select
                  id="colorScale"
                  value={mapColorScale}
                  onChange={(e) => setMapColorScale(e.target.value)}
              >
                <option value="Reds">Reds</option>
                <option value="Blues">Blues</option>
                <option value="Viridis">Viridis</option>
                <option value="YlGnBu">YlGnBu</option>
                <option value="Hot">Hot</option>
                <option value="RdBu">RdBu</option>
                <option value="Portland">Portland</option>
                <option value="Picnic">Picnic</option>
                <option value="Jet">Jet</option>
                <option value="Bluered">Bluered</option>
              </select>
            </div>
            <h3 className="text-2xl font-bold mb-6">Original Map VS Reconstructed Interactive Map</h3>
            <div style={{display: 'flex', direction: 'column',gap:'20px'}}>
                <div style={{width: '50%'}}>
                    {/* {JSON.stringify(fileNamesInOrder)}
                    {JSON.stringify(mappedFiles)} */}
                    {Object.keys(mappedFiles).length >0 && fileNamesInOrder.map((fileName, i) => (
                        <img key={i} src={URL.createObjectURL(mappedFiles[fileName])} alt={fileName} style={{marginBottom:'25px'}} />
                    ))}
                </div>
                <div style={{width: '50%'}}>
                    {maps.map(map => (
                        <div key={map.id} id={map.id} className="map-container mb-10 h-96" style={{marginBottom:'25px'}}></div>
                    ))}
                </div>
            </div>


        </div>
    );
};

export default UsaChoroplethMaps;