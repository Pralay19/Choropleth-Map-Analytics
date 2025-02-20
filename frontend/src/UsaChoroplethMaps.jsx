import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import {Link} from "react-router-dom";

import "./UsaChoroplethMaps.css"

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';


const UsaChoroplethMaps = ({ parsedData, files=[] }) => {
    const [maps, setMaps] = useState([]);

    const [mappedFiles, setMappedFiles] = useState({});
    const [mapColorScale, setMapColorScale] = useState('Blues');


    const [fileNamesInOrder, setFileNamesInOrder] = useState([])

    const colorScaleOptionsList = [
        {label: "Reds", value: "Reds"},
        {label: "Blues", value: "Blues"},
        {label: "Viridis", value: "Viridis"},
        {label: "YlGnBu", value: "YlGnBu"},
        {label: "Hot", value: "Hot"},
        {label: "RdBu", value: "RdBu"},
        {label: "Portland", value: "Portland"},
        {label: "Picnic", value: "Picnic"},
        {label: "Jet", value: "Jet"},
        {label: "Bluered", value: "Bluered"}
    ]

    useEffect(() => {
        if(!parsedData || parsedData.length <= 0) return;

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

            const config = {
                responsive: true,
                displayModeBar: true
            }

            Plotly.newPlot(map.id, plotData, layout, config);
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
            <div className="tool-ribbon">
                <Link to="/">
                    <Button icon="pi pi-arrow-left" aria-label="Back" raised />
                </Link>
            </div>
            <div>
                <label htmlFor="colorScale">Select Color Scale: </label>
                <Dropdown
                    id="colorScale"
                    value={mapColorScale}
                    onChange={(e) => setMapColorScale(e.value)}
                    options={colorScaleOptionsList}
                    placeholder="Select a Color Scale"
                />
            </div>

            <div style={{display: 'flex', direction: 'column',gap:'20px'}}>
                <div style={{width: '50%'}}>
                    <div><h2>ORIGINAL IMAGE</h2></div>

                    <div>
                        {Object.keys(mappedFiles).length >0 && fileNamesInOrder.map((fileName, i) => (
                            <div key={i} style={{marginBottom:'55px'}} >
                                <img src={URL.createObjectURL(mappedFiles[fileName])} alt={fileName} className="original-image" />
                                <h3><u>{fileName}</u></h3>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{width: '50%'}}>
                    <div><h2>RECONSTRUCTED CHOROPLETH</h2></div>

                    <div>
                        {maps.map(map => (
                            <div id={map.id} className="map-container mb-10 h-96 reconstructed-map" style={{marginBottom:'100px'}}></div>
                        ))}
                    </div>

                </div>
            </div>

            <div className="tool-ribbon">
                <Link to="/">
                    <Button icon="pi pi-arrow-left" aria-label="Back" raised />
                </Link>
            </div>
        </div>
    );
};

export default UsaChoroplethMaps;