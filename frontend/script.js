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
            .attr('height', 400)
            .append('g')
            .attr('transform', 'translate(400,200)');
        
        // Define a time parser for the timestamp format
        const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

        // Process JSON Data: Convert timestamp to Date and calculate durations
        const jsonData = data.json_data.map(d => ({
            ...d,
            date: parseTime(d.timestamp)
        })).sort((a, b) => d3.ascending(a.date, b.date));

        const durations = {};
        for (let i = 0; i < jsonData.length - 1; i++) {
            const app = jsonData[i].focused_window;
            const duration = (jsonData[i + 1].date - jsonData[i].date) / 1000; // duration in seconds
            if (durations[app]) {
                durations[app] += duration;
            } else {
                durations[app] = duration;
            }
        }

        const pieData = Object.entries(durations).map(([key, value]) => ({ app: key, duration: value }));

        console.log('Pie Data:', pieData);

        // Create a pie chart
        const pie = d3.pie().value(d => d.duration);
        const arc = d3.arc().innerRadius(0).outerRadius(150);

        const arcs = svg.selectAll('arc')
            .data(pie(pieData))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
            .on('mouseover', function(event, d) {
                d3.select(this).transition().duration(200).attr('d', d3.arc().innerRadius(0).outerRadius(170));
                svg.append('text')
                    .attr('class', 'tooltip')
                    .attr('x', 0)
                    .attr('y', -180)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '14px')
                    .attr('font-weight', 'bold')
                    .text(`${d.data.app}: ${d.data.duration.toFixed(2)}s`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this).transition().duration(200).attr('d', arc);
                svg.select('.tooltip').remove();
            });

        // Remove the text labels from the arcs
        // arcs.append('text')
        //     .attr('transform', d => `translate(${arc.centroid(d)})`)
        //     .attr('text-anchor', 'middle')
        //     .attr('font-size', '10px')
        //     .text(d => d.data.app); // full label
    }
});
