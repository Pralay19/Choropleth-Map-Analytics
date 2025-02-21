import {useEffect, useState} from "react";

const PlotsFromData = ({dataForPlots}) => {

    useEffect(() => {
        let x = dataForPlots.data.locations.slice(0, -1);    // state code shown
        // let x = dataForPlots.data.locationsFull.slice(0, -1);        // full state names shown

        let y = dataForPlots.data.z.slice(0, -1);
        let mapTitle = dataForPlots.title;

        Plotly.newPlot('plots-bar-chart', [{ x, y,
            type: 'bar',
        }], {
            yaxis: {
                title: {
                    text: mapTitle
                },
                showline: false
            }
        });

        Plotly.newPlot('plots-scatter', [{ x, y,
            type: 'scatter',
            mode: 'lines+markers'
        }], {
            yaxis: {
                title: {
                    text: mapTitle
                },
                showline: false
            }
        });

        Plotly.newPlot('plots-box', [{ y,
            type: 'box',
            boxpoints: 'all',
            jitter: 0.3,
            pointpos: -1.8,
        }], {
            yaxis: {
                title: {
                    text: mapTitle
                },
                showline: false
            }
        });

        Plotly.newPlot('plots-histogram', [{ "x": y,
            type: 'histogram'
        }]);

        Plotly.newPlot('plots-violin', [{ y,
            type: 'violin'
        }]);

    }, [dataForPlots]);

    return (
        <div>
            <div id='plots-bar-chart'></div>
            <div id='plots-scatter'></div>
            <div id='plots-box'></div>
            <div id='plots-histogram'></div>
            <div id='plots-violin'></div>
        </div>
    )
}

export default PlotsFromData;