d3.csv("ds_salaries.csv").then(data => {
    data.forEach(d => {
        d.salary_in_usd = +d.salary_in_usd;
    });

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    // Kreiranje stupčastog grafikona za prikaz prosječnih plaća po titulama posla
    const salaryByJob = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);

    const margin = {top: 30, right: 50, bottom: 130, left: 100};

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

    // Dodavanje oznake na Y osi
    barChartSvg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -barChartHeight / 2)
        .attr("y", -70)
        .style("text-anchor", "middle")
        .text("Average Salary (USD)");


    // mislim da je dobra funckija
    const updateChart = (experienceLevel) => {
        let filteredData = experienceLevel === "ALL" ? data : data.filter(d => d.experience_level === experienceLevel);
        const salaryByJob = d3.rollups(filteredData, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);

        // Ponovno postavljanje domene za X i Y osi
        xScale.domain(salaryByJob.map(d => d[0]));
        yScale.domain([0, d3.max(salaryByJob, d => d[1])]);

        // Selektiranje i ažuriranje barova
        const bars = barChartSvg.selectAll(".bar")
            .data(salaryByJob, d => d[0]); // Dodajte ključ za stabilno ažuriranje

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .style("fill", "darkblue");
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d[0]) // Postavite naziv posla kao sadržaj tooltip-a
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            // Dodajte event listener za mousemove
            .on("mousemove", function (event, d) {
                tooltip.style("left", (event.pageX) + "px")
                    .style(".top", (event.pageY - 28) + "px");
            })
            // Dodajte event listener za mouseout
            .on("mouseout", function (d) {
                d3.select(this)
                    .style("fill", "steelblue");
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .merge(bars) // Spajanje nove i postojeće selekcije
            .transition() // Dodajte tranziciju za glađe ažuriranje
            .attr("x", d => xScale(d[0]))
            .attr("y", d => yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => barChartHeight - yScale(d[1]));

        bars.exit().remove(); // Uklonite stare barove

        // Ažurirajte osi ako već nisu dodane
        barChartSvg.selectAll(".x-axis").data([0]).enter().append("g").attr("class", "x-axis");
        barChartSvg.selectAll(".y-axis").data([0]).enter().append("g").attr("class", "y-axis");

        barChartSvg.selectAll(".x-axis")
            .attr("transform", "translate(0," + barChartHeight + ")")
            .call(d3.axisBottom(xScale))
            .selectAll("text") // Selektiramo sve tekstualne elemente oznake x-osi
            .attr("text-anchor", "end") // Poravnavamo tekst s kraja
            .attr("transform", "rotate(-90)") // Rotiramo tekst za -90 stupnjeva
            .attr("dx", "-.8em") // Pomičemo tekst udesno
            .attr("dy", "em");

        barChartSvg.selectAll(".y-axis")
            .call(d3.axisLeft(yScale)); // Ažuriranje y-osi
    };

    const lineChartMargin = {top: 10, right: 50, bottom: 30, left: 100};
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

    // Function to update the Line Chart
    function updateLineChart(experienceLevel) {
        let filteredData = experienceLevel === "ALL" ? data : data.filter(d => d.experience_level === experienceLevel);

        // Group and average salary by company size
        const salaryByCompanySize = d3.rollups(filteredData,
            v => d3.mean(v, d => d.salary_in_usd),
            d => d.company_size)
            .sort((a, b) => a[0].localeCompare(b[0]));

        xScaleLine.domain(salaryByCompanySize.map(d => d[0]));
        yScaleLine.domain([0, d3.max(salaryByCompanySize, d => d[1])]);

        // Bind the data to the line
        const lines = lineChartSvg.selectAll(".line")
            .data([salaryByCompanySize], d => d[0]);

        lines.enter().append("path")
            .attr("class", "line")
            .merge(lines)
            .transition()
            .duration(750)
            .attr("d", line)
            .attr("fill", "none") // Ensures the area under the line isn't filled
            .attr("stroke", "blue") // Sets the line color
            .attr("stroke-width", "2px");

        lines.exit().remove();

        const xAxisLine = d3.axisBottom(xScaleLine);
        lineChartSvg.selectAll(".x-axis-line")
            .data([0])
            .join("g")
            .attr("class", "x-axis-line")
            .attr("transform", "translate(0," + lineChartHeight + ")")
            .call(xAxisLine);

        // Create or update the Y Axis
        const yAxisLine = d3.axisLeft(yScaleLine)
            .tickFormat(d => "$" + d3.format(",")(d)); // Format as currency
        lineChartSvg.selectAll(".y-axis-line")
            .data([0])
            .join("g")
            .attr("class", "y-axis-line")
            .call(yAxisLine);
    }

    updateLineChart("ALL");
    updateChart("ALL");

    d3.select("#experience-level").on("change", function () {
        updateChart(this.value);
        updateLineChart(this.value);
    });
});


// d3.csv("ds_salaries.csv").then(data => {
//     data.forEach(d => {
//         d.salary_in_usd = +d.salary_in_usd; // Convert salary to number
//     });
//
//     // Existing Bar Chart setup and functions
//     // ...
//
//     // Line Chart Setup
//
//
// });


