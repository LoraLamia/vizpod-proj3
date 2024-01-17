d3.csv("ds_salaries.csv").then(data => {
    data.forEach(d => {
        d.salary_in_usd = +d.salary_in_usd;
    });

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    // Kreiranje stupčastog grafikona za prikaz prosječnih plaća po titulama posla
    const salaryByJob = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);

    const margin = { top: 30, right: 50, bottom: 130, left: 100 };

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


    updateChart("ALL");

    d3.select("#experience-level").on("change", function () {
        updateChart(this.value);
    });


    const locations = Array.from(new Set(data.map(d => d.company_location)));
    const locationScale = d3.scaleOrdinal()
        .domain(locations)
        .range(d3.range(locations.length));


    // Scatter Plot za 'salary_in_usd' i kodiranu 'company_location'
    const marginB = { top: 30, right: 50, bottom: 130, left: 100 };

    const svgWidth = 1300; // Povećajte ovo prema potrebi
    const svgHeight = 768; // Visina može ostati ista ili se prilagoditi

    const xScaleB = d3.scalePoint()
        .domain(['', ...locations]) // Dodavanje praznog stringa na početak niza
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

    let selectedLocation = null;
    let selectedRemoteRatio = null
    scatterPlotSvg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScaleB(d.company_location))
        .attr("cy", d => yScaleB(d.salary_in_usd))
        .attr("r", 5)
        .style("fill", "blue")
        .on("mouseover", function (event, d) {
            selectedLocation = d.company_location;
            selectedRemoteRatio = d.remote_ratio;

            // Ažurirajte boju odgovarajućeg slice-a u Pie Chartu
            pieChartSvg.selectAll("path")
                .attr("fill", pieData => (pieData.data[0] === selectedRemoteRatio) ? "red" : "gray");

            // Ažurirajte boje točaka u Scatter Plota koje odgovaraju odabranoj lokaciji i omjeru daljinskog rada
        })
        .on("mouseout", function () {
            // Poništite označavanje i vrati boje na prethodne vrijednosti
            selectedLocation = null;
            pieChartSvg.selectAll("path")
                .attr("fill", d => d3.schemeCategory10[d.index % 10]);
        });

    // Dodajte osi za Scatter Plot
    scatterPlotSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (svgHeight - margin.top - margin.bottom) + ")")
        .call(d3.axisBottom(xScaleB))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Dodavanje y-osi
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
        .attr("width", pieWidth) // Smanjena širina
        .attr("height", pieHeight) // Smanjena visina
        .append("g")
        .attr("transform", "translate(" + pieRadius + "," + pieRadius + ")"); // Centriranje Pie Charta

    const arc = d3.arc().innerRadius(0).outerRadius(pieRadius);

    d3.select("#scatter-plot").style("display", "inline-block");
    d3.select("#pie-chart")
        .style("display", "inline-block")
        .style("vertical-align", "top")// Dodajte malo margine za razmak
        .style("margin-left", "20px");

    pieChartSvg.selectAll("path")
        .data(pie)
        .enter().append("path")
        .attr("d", arc)
        .attr("fill", d => d3.schemeCategory10[d.index % 10])
        .on("mouseover", function (event, d) {
  
        })
        .on("mouseout", function () {

        });
});
