// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svgTemperature = d3.select("#lineChart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 120) // extra space for legend
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("weather.csv").then(data => {
    const parseDate = d3.timeParse("%m/%d/%Y");
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.temp = +d.actual_mean_temp;
        d.city = d.city_full.trim();
    });

    const cityList = Array.from(new Set(data.map(d => d.city))).sort();
    const colorScale = d3.scaleOrdinal()
        .domain(["Charlotte, NC", "Chicago (Midway), IL", "Indianapolis, IN", "Jacksonville, FL", "Philadelphia, PA", "Phoenix, AZ"])
        .range(["steelblue", "orange", "green", "red", "goldenrod", "purple"]); // 👈 Change this last one to "purple"


    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.temp)])
        .range([height, 0]);

    // AXES
    svgTemperature.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")));

    svgTemperature.append("g")
        .call(d3.axisLeft(yScale));

    // LABELS
    svgTemperature.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Date");

    svgTemperature.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Actual Mean Temperature (°F)");

    // TOOLTIP
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("display", "none");

    // POPULATE DROPDOWN
    const dropdown = d3.select("#city-select");
    dropdown.selectAll("option.city-option")
        .data(["all", ...cityList])
        .enter()
        .append("option")
        .attr("class", "city-option")
        .attr("value", d => d)
        .text(d => d === "all" ? "All Cities" : d);

    // DRAW FUNCTION
    function updateChart(selectedCity) {
        svgTemperature.selectAll(".line, .legend-rect, .legend-text, .legend-box").remove();

        const filteredGroups = selectedCity === "all"
            ? d3.groups(data, d => d.city)
            : [[selectedCity, data.filter(d => d.city === selectedCity)]];

        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.temp));

        filteredGroups.forEach(([city, values]) => {
            svgTemperature.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(city))
                .attr("stroke-width", 2)
                .attr("d", line)
                .on("mousemove", function (event) {
                    const [x] = d3.pointer(event, this);
                    const xDate = xScale.invert(x);
                    const closest = values.reduce((a, b) =>
                        Math.abs(b.date - xDate) < Math.abs(a.date - xDate) ? b : a
                    );
                    tooltip
                        .style("display", "block")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px")
                        .html(`
                            <strong>${city}</strong><br>
                            ${d3.timeFormat("%b %d, %Y")(closest.date)}<br>
                            ${closest.temp} °F
                        `);
                })
                .on("mouseout", () => tooltip.style("display", "none"));
        });

        // LEGEND BELOW CHART
        const legendPadding = 10;
        const lineHeight = 20;
        const legendItemCount = filteredGroups.length;
        const legendBoxWidth = 220;
        const legendBoxHeight = legendItemCount * lineHeight + legendPadding * 2;
        const legendY = height + 60;

        svgTemperature.append("rect")
            .attr("class", "legend-box")
            .attr("x", 0)
            .attr("y", legendY)
            .attr("width", legendBoxWidth)
            .attr("height", legendBoxHeight)
            .attr("fill", "#fff")
            .attr("stroke", "#ccc")
            .attr("rx", 6)
            .attr("ry", 6);

        svgTemperature.selectAll(".legend-rect")
            .data(filteredGroups)
            .enter()
            .append("rect")
            .attr("class", "legend-rect")
            .attr("x", 10)
            .attr("y", (_, i) => legendY + legendPadding + i * lineHeight)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", ([city]) => colorScale(city));

        svgTemperature.selectAll(".legend-text")
            .data(filteredGroups)
            .enter()
            .append("text")
            .attr("class", "legend-text")
            .attr("x", 25)
            .attr("y", (_, i) => legendY + legendPadding + i * lineHeight + 9)
            .text(([city]) => city)
            .attr("font-size", "12px");

            
    }

    // INITIAL DRAW
    updateChart("all");

    // ON DROPDOWN CHANGE
    dropdown.on("change", function () {
        const selected = d3.select(this).property("value");
        updateChart(selected);
    });
});



