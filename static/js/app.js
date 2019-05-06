async function buildMetadata(sample) {
  // Fetch sample metadata
  // Use d3 to select the panel with id of `#sample-metadata`
  let data = await d3.json("/metadata/" + sample);
  let metapanel = d3.select("div#sample-metadata");

  // Clear any existing metadata
  metapanel.html("");

  // Use `Object.entries` to add each key and value pair to the panel
  // Hint: Inside the loop, you will need to use d3 to append new
  // tags for each key-value in the metadata.
  let metalist = metapanel.append("ul").classed("list-group", true);
  Object.entries(data).forEach(x => {
    if (x[0] != 'WFREQ') {
      metalist.append("li")
        .classed("list-group-item", true)
        .text(x[0] + ": " + x[1]);
    }
  });

    // Build the Gauge Chart
    buildGauge(data.WFREQ);
}


// Build gauge
// Note: `SELECT MAX(WFREQ) FROM sample_metadata;` returns 9.0
function buildGauge(wfreq) {
  // Trig to calculate meter point
  let degrees = 180 - 20*wfreq,
    radius = .5;
  let radians = degrees * Math.PI / 180;
  let x = radius * Math.cos(radians);
  let y = radius * Math.sin(radians);

  // Create path
  let mainPath = 'M -.0 -0.025 L .0 0.025 L',
    pathX = String(x),
    space = ' ',
    pathY = String(y),
    pathEnd = ' Z';
  let path = mainPath.concat(pathX, space, pathY, pathEnd);

  let data = [{
      type: 'scatter',
      x: [0],
      y: [0],
      marker: {
        size: 28,
        color: '850000'
      },
      showlegend: false,
      name: 'wash frequency',
      text: wfreq,
      hoverinfo: 'text+name'
    }, {
      values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
      rotation: 90,
      text: ['8-9','7-8','6-7','5-6','4-5','3-4','2-3','1-2','0-1',''],
      textinfo: 'text',
      textposition: 'inside',
      marker: {colors:['rgba(25, 25, 22, .5)', 'rgba(51,50,44,.5)','rgba(77,75,67,.5)',
        'rgba(103,100,89,.5)', 'rgba(128,125,112,.5)', 'rgba(154,150,134,.5)', 'rgba(180,175,157,.5)',
        'rgba(206,200,179,.5)', 'rgba(232,226,202,.5)', 'rgba(255,255,255,0)']},
      labels: ['8-9','7-8','6-7','5-6','4-5','3-4','2-3','1-2','0-1',''],
      hoverinfo: 'label',
      hole: .5,
      type: 'pie',
      showlegend: false
    }
  ];

  let layout = {
    shapes: [{
        type: 'path',
        path: path,
        fillcolor: '850000',
        line: {
          color: '850000'
        }
    }],
    title: '<b>Belly Button Washing Frequency</b><br /> Scrubs per Week',
    height: 500,
    width: 500,
    xaxis: {
      zeroline: false,
      showticklabels: false,
      showgrid: false,
      range: [-1,1]
    },
    yaxis: {
      zeroline: false,
      showticklabels: false,
      showgrid: false,
      range: [-1,1]
    }
  };

  Plotly.newPlot("gauge", data, layout);
}



async function buildCharts(sample, onInit=false) {

  // Fetch the sample data for the plots from /samples/<sample>
  const route = "/samples/" + sample;
  let data = await d3.json(route);

  /* 
   * Data has the following format:
   * { otu_labels: [], otu_ids: [] sample_values: []}
   * The lists inside are all of the same length.
   * We convert this into an array of objects having the values
   * {otu_labels: , otu_ids: , sample_values: }
   * so that we can sort the array and get the top ten samples.
  */
  let samples = [];
  data.sample_values.forEach((e,i) => {
    samples.push({sample_value: e,
                  otu_label: data.otu_labels[i],
                  otu_id: data.otu_ids[i]})
  });
  samples.sort((a,b) => b.sample_value - a.sample_value);

  // Build a Bubble Chart using the sample data
  let ois = samples.map(x => x.otu_id);
  let svs = samples.map(x => x.sample_value);
  const bubbleTrace = {
    x: ois,
    y: svs,
    text: samples.map(x => x.otu_label),
    mode: 'markers',
    marker: {
      size: svs,
      color: ois,
      cmin: 0,
      cmax: Math.max(...ois),
      colorscale: 'Earth'
    }
  };
  const bubbleLayout = {
    xaxis: {title: "OTU ID"}
  };
  Plotly.newPlot("bubble", [bubbleTrace], bubbleLayout);

  // Build pie chart, taking the top ten samples
  let topTen = samples.slice(0,10);
  const pieTrace = {
    values: topTen.map(x => x.sample_value),
    labels: topTen.map(x => x.otu_id),
    hovertext: topTen.map(x => x.otu_label),
    hoverinfo: "text",
    type: "pie"
  };
  const pieLayout = {};
  Plotly.newPlot("pie", [pieTrace], pieLayout);
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
}

// Initialize the dashboard
init();
