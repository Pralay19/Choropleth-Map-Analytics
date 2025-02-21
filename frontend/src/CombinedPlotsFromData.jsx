import {useEffect, useState} from "react";

const PlotsFromData = ({dataForPlots}) => {
    useEffect(() => {
        Plotly.newPlot('combined-plots-scatter',
            dataForPlots.map(plot => ({
                x: plot.data.locations.slice(0, -1),
                y: plot.data.z.slice(0, -1),
                type: 'scatter',
                mode: 'lines+markers',
                name: plot.title
            }))
        );

        Plotly.newPlot('combined-plots-scatter-log',
            dataForPlots.map(plot => ({
                x: plot.data.locations.slice(0, -1),
                y: plot.data.z.slice(0, -1),
                type: 'scatter',
                mode: 'lines+markers',
                name: plot.title
            })),
            {
                yaxis: {
                    type: 'log',
                    autorange: true
                }
            }
        );

        Plotly.newPlot('combined-plots-bar',
            dataForPlots.map(plot => ({
                x: plot.data.locations.slice(0, -1),
                y: plot.data.z.slice(0, -1),
                type: 'bar',
                name: plot.title
            }))
        );

    }, [dataForPlots]);

    return (
        <div>
            <div id='combined-plots-scatter'></div>
            <div id='combined-plots-scatter-log'></div>
            <div id='combined-plots-bar'></div>

        </div>
    )
}

export default PlotsFromData;