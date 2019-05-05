async function buildMetadata(sample) {

  // @TODO: Complete the following function that builds the metadata panel

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
    metalist.append("li")
      .classed("list-group-item", true)
      .text(x[0] + ": " + x[1]);
  });

    // BONUS: Build the Gauge Chart
    // buildGauge(data.WFREQ);
}

// Optional parameter for use by init() function
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
      cmax: ois.reduce((a,e) => a>e ? a : e),
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
