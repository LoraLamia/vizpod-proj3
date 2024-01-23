
function createBoxPlot(data) {
    const margin = { top: 10, right: 30, bottom: 40, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#box-plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.employment_type))
        .paddingInner(1)
        .paddingOuter(.5);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.max)])
        .range([height, 0]);

        svg.append("g").call(d3.axisLeft(y).tickFormat(d3.format("~s")));
    svg.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));

    svg.append("text")
        .attr("transform", "rotate(-90)") 
        .attr("y", 0 - margin.left - 45) 
        .attr("x",0 - (height / 2)) 
        .attr("dy", "3em") 
        .style("text-anchor", "middle")
        .text("Salary");

        svg.append("text")
        .attr("x", width / 2) 
        .attr("y", height + margin.bottom - 5) 
        .style("text-anchor", "middle") 
        .text("Employment type"); 


    const boxWidth = 100;
    data.forEach(d => {

        svg.append("rect")
            .attr("x", x(d.employment_type) - boxWidth/2)
            .attr("y", y(d.q3))
            .attr("height", y(d.q1) - y(d.q3))
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .style("fill", "#69b3a2");

        svg.append("line")
            .attr("x1", x(d.employment_type) - boxWidth/2)
            .attr("x2", x(d.employment_type) + boxWidth/2)
            .attr("y1", y(d.median))
            .attr("y2", y(d.median))
            .attr("stroke", "black");
        
        svg.append("line")
            .attr("x1", x(d.employment_type))
            .attr("x2", x(d.employment_type))
            .attr("y1", y(d.min))
            .attr("y2", y(d.q1))
            .attr("stroke", "black");
        
        svg.append("line")
            .attr("x1", x(d.employment_type))
            .attr("x2", x(d.employment_type))
            .attr("y1", y(d.q3))
            .attr("y2", y(d.max))
            .attr("stroke", "black");

        svg.append("line")
            .attr("x1", x(d.employment_type) - boxWidth/4)
            .attr("x2", x(d.employment_type) + boxWidth/4)
            .attr("y1", y(d.min))
            .attr("y2", y(d.min))
            .attr("stroke", "black");
        
        svg.append("line")
            .attr("x1", x(d.employment_type) - boxWidth/4)
            .attr("x2", x(d.employment_type) + boxWidth/4)
            .attr("y1", y(d.max))
            .attr("y2", y(d.max))
            .attr("stroke", "black");
    });
}


d3.csv("ds_salaries.csv").then(data => {
    data.forEach(d => {
        d.salary_in_usd = +d.salary_in_usd;
    });

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const salaryByJob = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);

    const margin = { top: 30, right: 50, bottom: 200, left: 100 };

    const barChartWidth = 1000, barChartHeight = 800;
    const xScale = d3.scaleBand()
        .domain(salaryByJob.map(d => d[0]))
        .rangeRound([0, barChartWidth])
        .padding(0.1);
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(salaryByJob, d => d[1])])
        .range([barChartHeight, 0]);

    const barChartSvg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", barChartWidth + margin.left + margin.right)
        .attr("height", barChartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    barChartSvg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -barChartHeight / 2)
        .attr("y", -70)
        .style("text-anchor", "middle")
        .text("Average Salary (USD)");

    barChartSvg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "translate(" + (barChartWidth / 2) + "," + (barChartHeight + margin.bottom - 170) + ")")
        .style("text-anchor", "middle")
        .text("Job Description");

    const updateChart = (experienceLevel) => {
        let filteredData = experienceLevel === "ALL" ? data : data.filter(d => d.experience_level === experienceLevel);
        const salaryByJob = d3.rollups(filteredData, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);

        xScale.domain(salaryByJob.map(d => d[0]));
        yScale.domain([0, d3.max(salaryByJob, d => d[1])]);

        const bars = barChartSvg.selectAll(".bar")
            .data(salaryByJob, d => d[0]);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .on("mouseover", function (event, d) {
                d3.select(this).style("fill", "darkblue");
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d[0])
                    .style("left", event.pageX + "px")
                    .style("top", (event.pageY - 40) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", event.pageX + "px")
                    .style("top", (event.pageY - 40) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).style("fill", "steelblue");
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .merge(bars)
            .transition()
            .attr("x", d => xScale(d[0]))
            .attr("y", d => yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => barChartHeight - yScale(d[1]));

        bars.exit().remove();

        barChartSvg.selectAll(".x-axis")
            .data([0])
            .enter()
            .append("g")
            .attr("class", "x-axis");
        barChartSvg.selectAll(".y-axis")   
            .data([0])
            .enter()
            .append("g")
            .attr("class", "y-axis");
        barChartSvg.selectAll(".y-axis")
            .data([0])
            .join("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("font-size", "14px");
    };

    const lineChartMargin = { top: 10, right: 50, bottom: 50, left: 100 };
    const lineChartWidth = 960 - lineChartMargin.left - lineChartMargin.right;
    const lineChartHeight = 500 - lineChartMargin.top - lineChartMargin.bottom;

    const xScaleLine = d3.scalePoint()
        .range([0, lineChartWidth])
        .padding(0.1);
    const yScaleLine = d3.scaleLinear()
        .range([lineChartHeight, 0]);

    const line = d3.line()
        .x(d => xScaleLine(d[0]))
        .y(d => yScaleLine(d[1]));

    const lineChartSvg = d3.select("#line-chart").append("svg")
        .attr("width", lineChartWidth + lineChartMargin.left + lineChartMargin.right)
        .attr("height", lineChartHeight + lineChartMargin.top + lineChartMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + lineChartMargin.left + "," + lineChartMargin.top + ")");

    function updateLineChart(experienceLevel) {
        let filteredData = experienceLevel === "ALL" ? data : data.filter(d => d.experience_level === experienceLevel);

        const salaryByCompanySize = d3.rollups(filteredData,
            v => d3.mean(v, d => d.salary_in_usd),
            d => d.company_size)
            .sort((a, b) => a[0].localeCompare(b[0]));

        xScaleLine.domain(salaryByCompanySize.map(d => d[0]));
        yScaleLine.domain([0, d3.max(salaryByCompanySize, d => d[1])]);

        const lines = lineChartSvg.selectAll(".line")
            .data([salaryByCompanySize], d => d[0]);

        lines.enter().append("path")
            .attr("class", "line")
            .merge(lines)
            .transition()
            .duration(750)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", "2px");

        lines.exit().remove();

        const xAxisLine = d3.axisBottom(xScaleLine);
        lineChartSvg.selectAll(".x-axis-line")
            .data([0])
            .join("g")
            .attr("class", "x-axis-line")
            .attr("transform", "translate(0," + (lineChartHeight) + ")")
            .call(xAxisLine)
            .selectAll("text")
            .style("font-size", "14px");

        const yAxisLine = d3.axisLeft(yScaleLine)
            .tickFormat(d => "$" + d3.format(",")(d));
        lineChartSvg.selectAll(".y-axis-line")
            .data([0])
            .join("g")
            .attr("class", "y-axis-line")
            .attr("transform", "translate(" + ",0)")
            .call(yAxisLine)
            .selectAll("text")
            .style("font-size", "14px");

        lineChartSvg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "translate(" + (lineChartWidth / 2) + ")")
            .attr("y", lineChartHeight + lineChartMargin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Company Size");

        lineChartSvg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - (lineChartMargin.left))
            .attr("x", 0 - (lineChartHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Average Salary (USD)");
    }

    updateLineChart("EN");
    updateChart("EN");

    d3.select("#experience-level").on("change", function () {
        updateChart(this.value);
        updateLineChart(this.value);
    });

    const locations = Array.from(new Set(data.map(d => d.company_location)));

    const marginB = { top: 30, right: 50, bottom: 130, left: 100 };

    const svgWidth = 1300;
    const svgHeight = 768;

    const xScaleB = d3.scalePoint()
        .domain(['', ...locations])
        .range([0, svgWidth - margin.left - margin.right]);
    const yScaleB = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.salary_in_usd)])
        .range([svgHeight - margin.top - margin.bottom, 0]);
    const scatterPlotSvg = d3.select("#scatter-plot")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + marginB.left + "," + marginB.top + ")");

    let selectedRemoteRatio = null
    scatterPlotSvg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScaleB(d.company_location))
        .attr("cy", d => yScaleB(d.salary_in_usd))
        .attr("r", 5)
        .style("fill", "steelblue")
        .style("font-size", "14px")
        .attr("class", d => "scatter-plot-point remote-ratio-" + d.remote_ratio)
        .on("mouseover", function (event, d) {
            selectedRemoteRatio = d.remote_ratio;

            d3.select(this)
                .style("fill", "tan");
            d3.selectAll(".pie-part.remote-ratio-" + selectedRemoteRatio)
                .style("fill", "tan");
        })
        .on("mouseout", function () {

            d3.select(this)
                .style("fill", "steelblue");
            d3.selectAll(".pie-part.remote-ratio-" + selectedRemoteRatio)
                .style("fill", d => d3.schemeCategory10[d.index % 10]);
        });

    scatterPlotSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (svgHeight - margin.top - margin.bottom) + ")")
        .call(d3.axisBottom(xScaleB))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    scatterPlotSvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScaleB))
        .selectAll("text")
        .style("font-size", "14px");

    scatterPlotSvg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginB.left)
        .attr("x", 0 - (svgHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Salary (USD)");

    scatterPlotSvg.append("text")
        .attr("class", "x-axis-label")
        .style("text-anchor", "middle")
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight - marginB.bottom - 30)
        .text("Company Location");

    const pieData = d3.rollups(data, v => v.length, d => d.remote_ratio);
    const pie = d3.pie().value(d => d[1])(pieData);

    const pieWidth = 300;
    const pieHeight = 300;
    const pieRadius = pieWidth / 2;

    const legendRectSize = 20;
    const legendSpacing = 5;
    const legendHeight = legendRectSize + legendSpacing;

    const pieChartSvg = d3.select("#pie-chart")
        .append("svg")
        .attr("width", pieWidth)
        .attr("height", pieHeight + (pieData.length * legendHeight))
        .append("g")
        .attr("transform", "translate(" + pieRadius + "," + pieRadius + ")");

    const arc = d3.arc().innerRadius(0).outerRadius(pieRadius);

    d3.select("#scatter-plot").style("display", "inline-block");
    d3.select("#pie-chart")
        .style("display", "inline-block")
        .style("vertical-align", "top")
        .style("margin-left", "20px");

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    const legend = pieChartSvg.selectAll('.legend')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
            const x = -pieRadius;
            const y = pieRadius + legendSpacing + i * legendHeight;
            return `translate(${x}, ${y})`;
        });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', (d, i) => color(i))
        .style('stroke', (d, i) => color(i));

    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(d => `Remote Ratio: ${d[0]}`);

    pieChartSvg.selectAll("path")
        .data(pie)
        .enter().append("path")
        .attr("class", d => "pie-part remote-ratio-" + d.data[0])
        .attr("d", arc)
        .attr("fill", d => d3.schemeCategory10[d.index % 10])
        .on("mouseover", function (event, d) {
            scatterPlotSvg.selectAll(".scatter-plot-point")
                .style("display", function (pointData) {
                    return pointData.remote_ratio === d.data[0] ? "inline" : "none";
                });

            d3.selectAll(".scatter-plot-point.remote-ratio-" + d.data[0])
                .style("fill", "steelblue");
        })
        .on("mouseout", function () {
            scatterPlotSvg.selectAll(".scatter-plot-point")
                .style("display", "inline")
                .style("fill", "steelblue");

            d3.select(this)
                .style("fill", d => d3.schemeCategory10[d.index % 10]);
        });


    const groupedData = d3.group(data, d => d.employment_type);
    const boxPlotData = Array.from(groupedData, ([employmentType, values]) => {
        const salaries = values.map(d => d.salary_in_usd).sort(d3.ascending);
        const q1 = d3.quantile(salaries, .25);
        const median = d3.quantile(salaries, .5);
        const q3 = d3.quantile(salaries, .75);
        const interQuantileRange = q3 - q1;
        const min = d3.min(values, d => d.salary_in_usd);
        const max = d3.max(values, d => d.salary_in_usd);
        return { employment_type: employmentType, q1, median, q3, min, max };
    });

    createBoxPlot(boxPlotData);


});
