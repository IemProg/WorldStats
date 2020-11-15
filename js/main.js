var ctx = {
    w: 960,
    h: 484,
    undefinedColor: "#AAA",
    YEAR: "2015",
    panZoomMode: true,
    TRANSITION_DURATION: 2000,
    percapita: [],
    countries: [],
    population: [],
    life_exp: []
};

const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(ctx.h / Math.PI),
    IM: d3.geoInterrupt(d3.geoMollweideRaw,
         [[ // northern hemisphere
           [[-180,   0], [-100,  90], [ -40,   0]],
           [[ -40,   0], [  30,  90], [ 180,   0]]
         ], [ // southern hemisphere
           [[-180,   0], [-160, -90], [-100,   0]],
           [[-100,   0], [ -60, -90], [ -20,   0]],
           [[ -20,   0], [  20, -90], [  80,   0]],
           [[  80,   0], [ 140, -90], [ 180,   0]]
         ]])
         .scale(165)
         .translate([ctx.w / 2, ctx.h / 2])
         .precision(.1),
};

var makeMap = function(svgEl){
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map");
    // bind and draw geographical features to <path> elements
    addCountries(svgEl);
    addBublePlot();
    addLinePlot();
    //fadeWaterIn();
    // panning and zooming
    svgEl.append("rect")
         .attr("width", ctx.w)
         .attr("height", ctx.h)
         .style("fill", "none")
         .style("pointer-events", "all")
         .call(d3.zoom()
                 .scaleExtent([1, 8])
                 .on("zoom", zoomed)
         );
    function zoomed(event, d) {
        if (ctx.panZoomMode){
            ctx.mapG.attr("transform", event.transform);
        }
    }
};

// TO-DO
//min = d3.min(ctx.countries, (d) => (d3.min(d["properties"]["dw"])))
//max = d3.max(ctx.countries, (d) => (d3.max(d["properties"]["dw"])))

var addCountries = function(){
  var min = 0;
  var max = 0;
  var values = []

  for (let [ind, info] of ctx.percapita.entries()){
      if (ctx.percapita["pop"] != null){
          //console.log("GDP: ", info["GDP"])
          values.push(parseInt(info["pop"]))
      }
    }

  min = d3.min(values)
  max = d3.max(values)
  //console.log("Min: ", min)
  //console.log("Max: ", max)
  //console.log(ctx.infos)

    var tooltipMap = d3.select("#main")
                       .append("div")
                       .style("opacity", 0)
                       .attr("class", "tooltipMap")
                       .style("background-color", "black")
                       .style("border-radius", "5px")
                       .style("padding", "10px")
                       .style("color", "white")

    var color = d3.scaleDiverging()
                  .domain([-min, 0, max])
                  .interpolator(d3.interpolatePuOr)


    var geoPathGen = d3.geoPath()
                       .projection(getCurrentProjection());

      ctx.mapG.selectAll("path")
         .data(ctx.countries)
         .enter()
         .append("path")
              // TO-DO : Class attribute
             .attr("class", "country")
             .attr("d", geoPathGen)
             .attr("stroke", "gray")
             .style("fill", function(i, d){
                 if (i["properties"]["brk_name"] == undefined){
                   return "#DFDFDF"
                 }else{
                   name_country = i["properties"]["brk_name"]
                   var index = ctx.percapita.findIndex(function(obj) {
                      return obj["country"] === name_country;
                   });
                   console.log()
                   if (parseInt(index) != -1){
                     return color(ctx.percapita[index]["pop"])
                   }
                 }
             })
             .on("mouseover", function(i, d){
                     tooltipMap.transition()
                               .duration(200)
                     tooltipMap.style("opacity", 1)
                               .html("Country: " + d["properties"]["brk_name"])
                               .style("left", d3.select(this).attr("cx") + "px")
                               .style("top", d3.select(this).attr("cy") + "px")
             })
             .on("mousemove", function(i, d) {
                     tooltipMap.style("left", d3.select(this).attr("cx") + "px")
                               .style("top", d3.select(this).attr("cy") + "px")
             })
             .on("mouseleave", function(i, d) {
                     tooltipMap.transition()
                               .duration(200)
                               .style("opacity", 0)
             })
};

var addBublePlot = function(){
    // set the dimensions and margins of the graph
    var margin = {top: 40, right: 150, bottom: 60, left: 30},
      width = 500 - margin.left - margin.right,
      height = 420 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var bubble = d3.select("#BubblePlot")
                   .append("svg")
                   .attr("width", width + margin.left + margin.right)
                   .attr("height", height + margin.top + margin.bottom)
                   .append("g")
                   .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")");

            // Add X axis
            var x = d3.scaleLinear()
                      .domain([0, 50000])
                      .range([ 0, width+40]);
          bubble.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).ticks(5));
          // Add X axis label:
          bubble.append("text")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", height+50)
                .text("GDP per Capita");

            // Add Y axis
            var y = d3.scaleLinear()
                      .domain([35, 85])
                      .range([height, 0])
            bubble.append("g")
                  .call(d3.axisLeft(y))
            // Add Y axis label:
            bubble.append("text")
                  .attr("text-anchor", "end")
                  .attr("x", 0)
                  .attr("y", -20 )
                  .text("Life expectancy")
                  .attr("text-anchor", "start")

            // Add a scale for bubble size
            var z = d3.scaleSqrt()
                      .domain([200000, 1310000000])
                      .range([ 3, 30]);

            // Add a scale for bubble color
            var myColor = d3.scaleOrdinal()
                            .domain(["Asia", "Europe", "Americas", "Africa", "Oceania"])
                            .range(d3.schemeSet1);

            var tooltipBubble = d3.select("#BubblePlot")
                                  .append("div")
                                  .style("opacity", 0)
                                  .attr("class", "tooltip")
                                  .style("background-color", "black")
                                  .style("border-radius", "5px")
                                  .style("padding", "10px")
                                  .style("color", "white")
                                  .style("height", "55px")
                                  .style("width", "160px")

            // Add a clipPath: everything out of this area won't be drawn.
            var clip = bubble.append("defs")
                             .append("svg:clipPath")
                             .attr("id", "clip")
                             .append("svg:rect")
                             .attr("width", width )
                             .attr("height", height )
                             .attr("x", 0)
                             .attr("y", 0);

          // Add brushing
          var brush = d3.brushX()
                        .extent( [[0,0], [width,height] ] )
                        .on("end", updateChart)

          var showToolTip = function(i, d){
                  tooltipBubble.transition()
                               .duration(200)
                  tooltipBubble.style("opacity", 1)
                               .html("Country: " + d["country"]
                                     +"<br/>" + "GPDPerCap: " + d["gdpPercap"]
                                     +"<br/>" + "Life Expec: " + d["lifeExp"]
                                     +"<br/>" + "Population: " + d["pop"]
                                   )
                               //console.log(d["country"])
                               .style("left", d3.select(this).attr("cx") + "px")
                               .style("top", d3.select(this).attr("cy") + "px")
          }

          var moveToolTip = function(i, d) {
                  tooltipBubble.style("left", d3.select(this).attr("cx") + "px")
                               .style("top", d3.select(this).attr("cy") + "px")
          }
          var hideToolTip = function(i, d) {
                  tooltipBubble.transition()
                               .duration(200)
                               .style("opacity", 0)
          }

          // Create the scatter variable: where both the circles and the brush take place
          var scatter = bubble.append('g')
                              .attr("clip-path", "url(#clip)")
          // TODO Hover over continetns does not work properly
          // Add dots
          bubble.append('g')
                .selectAll("dot")
                .data(ctx.percapita)
                .enter()
                .append("circle")
                    .attr("class", function(d) {
                      // console.log("bubbles " + d["continent"])
                      return "bubbles " + d["continent"] })
                    .attr("cx", function (d) {return x(d["gdpPercap"]); } )
                    .attr("cy", function (d) {return y(d["lifeExp"]); } )
                    .attr("r", function (d) {return z(d["pop"]); })
                    .style("fill", function (d) { return myColor(d["continent"])})
                    .style("opacity", "0.7")
                    .attr("stroke", "black")
                    // -3- Trigger the functions
                    .on("mouseover", showToolTip)
                    .on("mousemove", moveToolTip)
                    .on("mouseleave", hideToolTip)

                  // Add the brushing
                  scatter.append("g")
                         .attr("class", "brush")
                         .call(brush);

                  // A function that set idleTimeOut to null
                  var idleTimeout
                  function idled() { idleTimeout = null;}

                  // A function that update the chart for given boundaries
                  //TODO: Brushing does not work properly due to line 274
                  function updateChart() {
                        var extent = d3.event.selection
                        // If no selection, back to initial coordinate. Otherwise, update X axis domain
                        if(!extent){
                          if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                          x.domain([4,8])
                        }else{
                          x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                          scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                        }

                        // Update axis and circle position
                        xAxis.transition().duration(700).call(d3.axisBottom(x))

                        scatter.selectAll("dot")
                          .transition().duration(700)
                          .attr("cx", function (d) { return x(d["gdpPercap"]); } )
                          .attr("cy", function (d) { return y(d["lifeExp"]); } )
                    }

                  // Add legend: circles
                  var valuesToShow = [10000000, 100000000, 1000000000]
                  var xCircle = 390
                  var xLabel = 440
                  bubble.selectAll("legend")
                        .data(valuesToShow)
                        .enter()
                        .append("circle")
                            .attr("cx", xCircle)
                            .attr("cy", function(d){ return height - 100 - z(d) } )
                            .attr("r", function(d){ return z(d)})
                            .style("fill", "none")
                            .attr("stroke", "black")
                  // Add legend: segments
                  bubble.selectAll("legend")
                        .data(valuesToShow)
                        .enter()
                        .append("line")
                            .attr('x1', function(d){ return xCircle + z(d) } )
                            .attr('x2', xLabel)
                            .attr('y1', function(d){ return height - 100 - z(d) } )
                            .attr('y2', function(d){ return height - 100 - z(d) } )
                            .attr('stroke', 'black')
                            .style('stroke-dasharray', ('2,2'))
                  // Add legend: labels
                  bubble.selectAll("legend")
                        .data(valuesToShow)
                        .enter()
                        .append("text")
                            .attr('x', xLabel)
                            .attr('y', function(d){ return height - 100 - z(d) } )
                            .text( function(d){ return d/1000000 } )
                            .style("font-size", 10)
                            .attr('alignment-baseline', 'middle')
                  // Legend title
                  bubble.append("text")
                        .attr('x', xCircle)
                        .attr("y", height - 100 +30)
                        .text("Population (M)")
                        .attr("text-anchor", "middle")

                  // Add one dot in the legend for each name.
                  var size = 20
                  var allgroups = ["Asia", "Europe", "Americas", "Africa", "Oceania"]
                  bubble.selectAll("myrect")
                    .data(allgroups)
                    .enter()
                    .append("circle")
                      .attr("cx", 390)
                      .attr("cy", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
                      .attr("r", 7)
                      .style("fill", function(d){ return myColor(d)})
                      .on("mouseover", function(i, d){
                            // reduce opacity of all groups
                            d3.selectAll(".bubbles")
                              .style("opacity", .05)
                            // expect the one that is hovered
                            d3.selectAll("."+d)
                              .style("opacity", 1)
                      })
                      .on("mouseleave", function(i, d){
                            d3.selectAll(".bubbles")
                              .style("opacity", 1)
                      })

                  // Add labels beside legend dots
                  bubble.selectAll("mylabels")
                        .data(allgroups)
                        .enter()
                        .append("text")
                            .attr("x", 390 + size*.8)
                            .attr("y", function(d,i){
                                  return i * (size + 5) + (size/2)})
                            .style("fill", function(d){
                                  return myColor(d)})
                            .text(function(d){
                                  return d})
                            .attr("text-anchor", "left")
                            .style("alignment-baseline", "middle")
                            .on("mouseover", function(i, d){
                                  // reduce opacity of all groups
                                  d3.selectAll(".bubbles")
                                    .style("opacity", .05)
                                  // expect the one that is hovered
                                  d3.selectAll("."+d)
                                    .style("opacity", 1)
                            })
                            .on("mouseleave", function(i, d){
                                  d3.selectAll(".bubbles")
                                    .style("opacity", 1)
                            })
}

var addLinePlot = function(){
     var margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = 420 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;
            // append the svg object to the body of the page
      var line = d3.select("#LinePlot")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
              //.domain(d3.extent(ctx.population, function(d) {return d["date"]}))
              .domain([1900, 2018])
              .range([0, width]);
    line.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))

    var max = d3.max(ctx.population["value"])
    // Add Y axis
    var y = d3.scaleLinear()
              .domain([0, max])
              .range([height, 0]);
    line.append("g")
        .call(d3.axisLeft(y))
    //TODO: Draw Lines
    // Add the line
    line.selectAll("lines")
        .data(ctx.population)
        .enter()
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
                .x(function(d) { return x(d["date"])})
                .y(function(d) { return y(d["value"])})
        )
}

var fadeWaterIn = function(){
    var path4proj = d3.geoPath()
                      .projection(getCurrentProjection());

    var rivers = d3.select("g#map")
                   .append("g")
                   .attr("id", "rivers")


    rivers.selectAll("path")
         .data(ctx.rivers)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .classed("river", true)
         //.attr("stroke", "#FFFFFF")

   var lakes = d3.select("g#map")
                  .append("g")
                  .attr("id", "lakes")

    lakes.selectAll("path")
        .data(ctx.lakes)
        .enter()
        .append("path")
        .attr("d", path4proj)
        .classed("lake", true)
         //TODO: ID and Class for rivers

    // clipping
    var defs = d3.select("svg").insert("defs", "#map");
    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path4proj);
    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "clipSphere")
        .attr("d", path4proj);
    defs.append("clipPath")
        .attr("id", "clip")
        .append("use")
        .attr("xlink:href", "#clipSphere");
    d3.select("svg")
        .insert("use", "#map")
        .attr("class", "sphereBounds")
        .attr("xlink:href", "#sphere")
        .attr("opacity", 1);
};

var getCurrentProjection = function(){
    return (ctx.panZoomMode) ? PROJECTIONS.ER : PROJECTIONS.IM;
};

var switchProjection = function(toER){
    // toER = true => enabling pan-zoom => moving to EquiRectangular proj
    // toER = false => disabling pan-zoom => moving to Interrupted Mollweide proj
    if (toER){
        fadeWaterOutBeforeProjSwitch(PROJECTIONS.IM, PROJECTIONS.ER);
    }
    else {
        // toIM
        fadeWaterOutBeforeProjSwitch(PROJECTIONS.ER, PROJECTIONS.IM);
    }
}

var animateProjection = function(sourceProj, targetProj){
    var transCount = 0;
    getGlobalView();
    d3.select("svg").selectAll("path").transition()
      .duration(ctx.TRANSITION_DURATION)
      .attrTween("d", projectionTween(sourceProj, targetProj))
      .on("start", function(){transCount++;})
      .on("end", function(d){
          if (--transCount === 0){fadeWaterIn();}
      });
};

var projectionTween = function(sourceProj, targetProj){
    return function(d) {
        var t = 0;
        var h_offset = (sourceProj == PROJECTIONS.ER) ? 8 : 0;
        var projection = d3.geoProjection(project)
                           .scale(1)
                           .translate([ctx.w / 2, ctx.h / 2 + h_offset]);
        var path = d3.geoPath()
                     .projection(projection);
        function project(λ, φ) {
            λ *= 180 / Math.PI;
            φ *= 180 / Math.PI;
            var p0 = sourceProj([λ, φ]);
            var p1 = targetProj([λ, φ]);
            return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
        }
        return function(_) {
            t = _;
            return path(d);
        };
    };
}

var createViz = function(){
    console.log("Using D3 v"+d3.version);
    d3.select("body")
      .on("keydown", function(event,d){handleKeyEvent(event);});
    Object.keys(PROJECTIONS).forEach(function(k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // ... load data, transform it, store it in ctx
    // ... then call makeMap(svgEl)

    Promise.all([d3.json("js/countries.geojson"), d3.csv("js/data/GDPPerCapita.csv"), d3.csv("js/data/population_total.csv")]
                ).then(function(data){
      ctx.countries = data[0]["features"]
      ctx.percapita = data[1]
      var dates = []
      var value = []
      var valuesExp = []
      //Sum Up the values of Population for each year
      for (column of data[2].columns){
            sum = d3.sum(data[2].map(function(d){return d[column]}))
            dates.push(column)
            value.push(sum)
      }
      /*
      for (column of data[3].columns){
            valuesExp[column] = d3.sum(data[3].map(function(d){return d[column]}))
      }
      */
      //Remove the first item "Country"
      dates = dates.slice(1, dates.length)
      value = value.slice(1, value.length)
      var valuesPop = []
      valuesPop["date"] = dates
      valuesPop["value"] = value
      ctx.population = valuesPop
      //ctx.life_exp = valuesExp
      //console.log(data[2].columns)
      //console.log(ctx.population)
      return makeMap(svgEl);
      }
    )
};

var togglePZMode = function(){
    ctx.panZoomMode = !ctx.panZoomMode;
    switchProjection(ctx.panZoomMode);
};
