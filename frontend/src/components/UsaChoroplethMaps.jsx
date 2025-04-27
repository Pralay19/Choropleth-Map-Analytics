import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import {Link} from "react-router-dom";

import "./UsaChoroplethMaps.css"

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Ripple } from 'primereact/ripple';
import { Dialog } from 'primereact/dialog';
import PlotsFromData from "./PlotsFromData";
import CombinedPlotsFromData from "./CombinedPlotsFromData";

const UsaChoroplethMaps = ({ parsedData, files=[] }) => {
    const [maps, setMaps] = useState([]);

    const [mappedFiles, setMappedFiles] = useState({});
    const [mapColorScale, setMapColorScale] = useState('Blues');

    const [fileNamesInOrder, setFileNamesInOrder] = useState([])

    const [morePlotsVisible, setMorePlotsVisible] = useState(false)
    const [morePlotsForIndex, setMorePlotsForIndex] = useState(0)

    const [combinedPlotsVisible, setCombinedPlotsVisible] = useState(false)

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
                    locationsFull: parsedData.map(row => row.State_Name || row.state_name || row.state),
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
                displayModeBar: true,
                // staticPlot: true,
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

    const handleVisualizeClick = () => {
        window.scrollTo(0, 0); // Scroll to top-left
    };

    const BackButton = () => (
        <div className="tool-ribbon">
            <Link to="/">
                <Button icon="pi pi-arrow-left" aria-label="Back" onClick={handleVisualizeClick} raised rounded/>
            </Link>
        </div>
    )

    return (
        <div className="usa-choropleth-container">
            <BackButton />
            <div style={{display: 'flex', justifyContent: 'end', alignItems: 'center', gap: '10px'}}>
                <label htmlFor="colorScale">Color Scale: </label>
                <Dropdown
                    id="colorScale"
                    value={mapColorScale}
                    onChange={(e) => setMapColorScale(e.value)}
                    options={colorScaleOptionsList}
                    placeholder="Select a Color Scale"
                />
            </div>


            <div style={{display: 'flex', flexWrap: 'wrap', marginTop: '50px'}}>
                <div style={{ flex: '1 100%', fontSize: '1.2rem', fontWeight: '600', backgroundColor: "#dfdfdf", paddingBlock: '10px', color: "#000000", borderRadius: '10px', display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                    <div>Original Map</div>
                    <div>Reconstructed Map</div>
                </div>

                {Object.keys(mappedFiles).length >0 && (() => {
                    const elements = [];

                    for(let i=0; i<maps.length; i++){
                        elements.push(
                            <div key={4*i} style={{ flex: '1 1 47%', marginRight: '1.5%', width: '47%', backgroundColor: "white", padding: '10px', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={URL.createObjectURL(mappedFiles[fileNamesInOrder[i]])} alt={fileNamesInOrder[i]} className="original-image" />
                            </div>
                        );

                        elements.push(
                            <div key={4*i+1} style={{ flex: '1 1 47%', marginLeft: '1.5%', width: '47%', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', overflow: 'hidden', padding: '10px', backgroundColor: "white", display: 'flex', alignItems: 'center', justifyContent: 'center'  }}
                            >
                                <div
                                    id={maps[i].id} className="map-container mb-10 h-96"
                                ></div>
                            </div>

                        )

                        elements.push(
                                <div key={4*i+2} style={{ flex: '1 1 47%', marginRight: '1.5%', width: '47%', marginBottom: "40px", backgroundColor: "#f59e0b", borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', paddingBlock: '5px', color: "white"}}>{fileNamesInOrder[i]}</div>
                        )

                        elements.push(
                            <div key={4*i+3} style={{ flex: '1 1 47%', marginLeft: '1.5%', width: '47%', marginBottom: "40px", backgroundColor: "#2e7dcc", borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', paddingBlock: '5px', color: "white", cursor: 'pointer'}} className='p-ripple'
                                 onClick={() => {setMorePlotsForIndex(i); setMorePlotsVisible(true)}}
                            >
                                <i className="pi pi-chart-scatter"></i> More Plots
                                <Ripple
                                    pt={{
                                        root: { style: { background: 'rgba(46,125,204,0.49)'} }
                                    }}
                                />
                            </div>
                        )
                    }

                    return elements;
                })()}
            </div>

            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Button label='Combined Plots' icon="pi pi-wave-pulse" severity="info" rounded raised
                    onClick={() => setCombinedPlotsVisible(true)}
                />
            </div>

            <BackButton />

            <Dialog header="More Plots" visible={morePlotsVisible} style={{ width: '90vw' }} onHide={() => {if (!morePlotsVisible) return; setMorePlotsVisible(false); }}>
                <PlotsFromData dataForPlots={maps[morePlotsForIndex]} />
            </Dialog>

            <Dialog header="Combined Plots" visible={combinedPlotsVisible} style={{ width: '90vw' }} onHide={() => {if (!combinedPlotsVisible) return; setCombinedPlotsVisible(false); }}>
                <CombinedPlotsFromData dataForPlots={maps} />
            </Dialog>
        </div>
    );
};

export default UsaChoroplethMaps;