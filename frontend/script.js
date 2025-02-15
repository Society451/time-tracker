window.addEventListener('pywebviewready', function() {
    console.log('pywebview is ready. window.pywebview:', window.pywebview);

    function fetchDataAndVisualize() {
        window.pywebview.api.get_data().then(data => {
            console.log('Data received from backend:', data);
            const parsedData = JSON.parse(data);
            visualizeData(parsedData);
        }).catch(error => {
            console.error('Error fetching data from backend:', error);
        });
    }

    function visualizeData(data) {
        console.log('Visualizing data:', data);
        d3.select('#chart').selectAll('*').remove(); // Clear previous chart

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
            const app = jsonData[i].focused_window.split(" - ").pop();
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

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => color(i))
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

        // Create color guide
        const colorGuide = d3.select('#color-guide').selectAll('.color-item')
            .data(pieData)
            .enter()
            .append('div')
            .attr('class', 'color-item');

        colorGuide.append('div')
            .attr('class', 'color-box')
            .style('background-color', (d, i) => color(i));

        colorGuide.append('span')
            .attr('class', 'color-text')
            .text(d => `${d.app}: ${d.duration.toFixed(2)}s`);
    }

    function copyChartToClipboard() {
        const svgElement = document.querySelector('#chart svg');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = function() {
            const colorItems = document.querySelectorAll('.color-item');
            const legendHeight = colorItems.length * 20 + 20; // Calculate height needed for the legend
            canvas.width = img.width;
            canvas.height = img.height + legendHeight; // Extra space for color guide
            ctx.fillStyle = 'white'; // Set background to white
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Draw color guide
            colorItems.forEach((item, index) => {
                const colorBox = item.querySelector('.color-box');
                const text = item.querySelector('.color-text').textContent;
                ctx.fillStyle = colorBox.style.backgroundColor;
                ctx.fillRect(10, img.height + 10 + index * 20, 20, 20);
                ctx.fillStyle = 'black';
                ctx.fillText(text, 40, img.height + 25 + index * 20);
            });

            canvas.toBlob(blob => {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    const copyButton = document.getElementById('copy-button');
                    copyButton.textContent = 'Image Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy Chart to Clipboard';
                    }, 2000);
                });
            });
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }

    document.getElementById('copy-button').addEventListener('click', copyChartToClipboard);

    // Fetch data and visualize every 5 seconds
    setInterval(fetchDataAndVisualize, 5000);
    fetchDataAndVisualize(); // Initial fetch
});
