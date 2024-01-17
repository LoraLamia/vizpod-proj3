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
                d3.select(this)
                    .style("fill", "darkblue");
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d[0])
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event, d) {
                tooltip.style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");

            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .style("fill", "steelblue");
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

        barChartSvg.selectAll(".x-axis").data([0]).enter().append("g").attr("class", "x-axis");
        barChartSvg.selectAll(".y-axis").data([0]).enter().append("g").attr("class", "y-axis");

        barChartSvg.selectAll(".x-axis")
            .attr("transform", "translate(0," + barChartHeight + ")")
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("dx", "-.8em")
            .attr("dy", "em");

        barChartSvg.selectAll(".y-axis")
            .call(d3.axisLeft(yScale));
    };


    updateChart("ALL");

    d3.select("#experience-level").on("change", function () {
        updateChart(this.value);
    });

    // Scatter plot
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
        .call(d3.axisLeft(yScaleB));


    // Pie Chart za 'remote_ratio'
    const pieData = d3.rollups(data, v => v.length, d => d.remote_ratio);
    const pie = d3.pie().value(d => d[1])(pieData);

    const pieWidth = 300;
    const pieHeight = 300;
    const pieRadius = pieWidth / 2;

    const pieChartSvg = d3.select("#pie-chart")
        .append("svg")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", "translate(" + pieRadius + "," + pieRadius + ")");

    const arc = d3.arc().innerRadius(0).outerRadius(pieRadius);

    d3.select("#scatter-plot").style("display", "inline-block");
    d3.select("#pie-chart")
        .style("display", "inline-block")
        .style("vertical-align", "top")
        .style("margin-left", "20px");

    pieChartSvg.selectAll("path")
        .data(pie)
        .enter().append("path")
        .attr("class", d => "pie-part remote-ratio-" + d.data[0])
        .attr("d", arc)
        .attr("fill", d => d3.schemeCategory10[d.index % 10])
        .on("mouseover", function (event, d) {
            d3.select(this)
                .style("fill", "tan");
            d3.selectAll(".scatter-plot-point.remote-ratio-" + d.data[0])
                .style("fill", "tan");
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("fill", d => d3.schemeCategory10[d.index % 10]);
            d3.selectAll(".scatter-plot-point")
                .style("fill", "steelblue");
        });
});
