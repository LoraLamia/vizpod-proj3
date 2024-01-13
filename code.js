d3.csv("ds_salaries.csv").then(data => {
    data.forEach(d => {
      d.salary_in_usd = +d.salary_in_usd;
    });
  
    // Kreiranje stupčastog grafikona za prikaz prosječnih plaća po titulama posla
    const salaryByJob = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);
  
    const margin = { top: 50, right: 50, bottom: 100, left: 100 };
  
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
  
    // Dodavanje oznake na X osi
    barChartSvg.append("text")
      .attr("class", "x-axis-label")
      .attr("x", barChartWidth / 2)
      .attr("y", barChartHeight + 40)
      .style("text-anchor", "middle")
      .text("Job Title");
  
    // Dodavanje oznake na Y osi
    barChartSvg.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -barChartHeight / 2)
      .attr("y", -70)
      .style("text-anchor", "middle")
      .text("Average Salary (USD)");
  
    barChartSvg.selectAll(".bar")
      .data(salaryByJob)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d[0]))
      .attr("y", d => yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("height", d => barChartHeight - yScale(d[1]));
  
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
        .call(d3.axisBottom(xScale));
  
      barChartSvg.selectAll(".y-axis")
        .call(d3.axisLeft(yScale)); // Ažuriranje y-osi
    };
  
    updateChart("ALL");
  
    d3.select("#experience-level").on("change", function () {
      updateChart(this.value);
    });
  });
  