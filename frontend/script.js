window.addEventListener('pywebviewready', function() {
    console.log('pywebview is ready. window.pywebview:', window.pywebview);
    window.pywebview.api.get_data().then(data => {
        console.log('Data received from backend:', data);
        const parsedData = JSON.parse(data);
        visualizeData(parsedData);
    }).catch(error => {
        console.error('Error fetching data from backend:', error);
    });
    
    function visualizeData(data) {
        console.log('Visualizing data:', data);
        const svg = d3.select('#chart')
            .append('svg')
            .attr('width', 800)
            .attr('height', 400);
        
        // Define a time parser for the timestamp format
        const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

        // Process JSON Data: Convert timestamp to Date and sort by time
        const jsonData = data.json_data.map(d => ({
            ...d,
            date: parseTime(d.timestamp)
        })).sort((a, b) => d3.ascending(a.date, b.date));

        console.log('Processed JSON Data:', jsonData);

        // Create a time scale based on the range of dates
        const xScale = d3.scaleTime()
            .domain(d3.extent(jsonData, d => d.date))
            .range([50, 750]);

        // Add circles for each JSON record positioned by time (with fixed y)
        svg.selectAll('circle')
            .data(jsonData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.date))
            .attr('cy', 100)
            .attr('r', 10)
            .attr('fill', 'blue');

        // Optional: add text labels for the focused_window on each circle
        svg.selectAll('text')
            .data(jsonData)
            .enter()
            .append('text')
            .attr('x', d => xScale(d.date))
            .attr('y', 90)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .text(d => d.focused_window.split(' - ')[0]); // short label

        // Process CSV Data: Compute number of open windows for each record
        const csvData = data.csv_data.map(d => ({
            timestamp: d.timestamp,
            count: JSON.parse(d.open_windows).length
        }));

        console.log('Processed CSV Data:', csvData);

        // Create a band scale for the CSV bar chart placed at lower part of svg
        const xBand = d3.scaleBand()
            .domain(csvData.map(d => d.timestamp))
            .range([50, 750])
            .padding(0.1);

        // Create a linear scale for the count values
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(csvData, d => d.count)])
            .range([350, 200]); // bars grow upward

        // Add bars for each CSV record
        svg.selectAll('rect')
            .data(csvData)
            .enter()
            .append('rect')
            .attr('x', d => xBand(d.timestamp))
            .attr('y', d => yScale(d.count))
            .attr('width', xBand.bandwidth())
            .attr('height', d => 350 - yScale(d.count))
            .attr('fill', 'green');
            
        // Optionally: add x-axis for time
        const xAxis = d3.axisBottom(xScale);
        svg.append("g")
            .attr("transform", "translate(0,350)")
            .call(xAxis);
    }
});
