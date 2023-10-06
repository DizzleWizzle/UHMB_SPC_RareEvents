define(["qlik", "jquery", "./d3.min", "./SPCArrayFunctions", "text!./UHMB-SPC_RareEvents.css"], function (qlik, $, d3) {
    //'use strict';
    return function ($element, layout) {

        var fullData;
        var numMeasure = layout.qHyperCube.qMeasureInfo.length;

        var requestPage = [{
            qTop: 0,
            qLeft: 0,
            qWidth: 10, //should be # of columns
            qHeight: this.backendApi.getRowCount()
        }
        ];
        this.backendApi.getData(requestPage).then(function (dataPages) {
            fullData = $.map(dataPages, function (obj) {
                return $.extend(true, {}, obj);
            });

            var width = $element.width();
            var height = $element.height();
            var id = "container_" + layout.qInfo.qId;
            if (document.getElementById(id)) {
                $("#" + id).empty();
            } else {

                try {
                    $element.append($('<div />;').css('display', 'inline-block').attr("id", id).width(width).height(height));
                } catch (err) {
                    console.log(err);
                }

            }

            $("#" + id).addClass('UHMB_RareEvents');
            var ChartType = layout.ChartType;
            var qMatrix = fullData[0].qMatrix;
            var fdata = qMatrix
                .filter(function (f) {
                    return f[1].qNum != 'NaN' && f[0].qNum != 'NaN';
                });
            if (numMeasure == 1) {
                var data = fdata.map(function (d) {

                    return {
                        "id": d[0].qText,
                        "dim": d[1].qNum,
                        "dimText": d[1].qText,
                        "value": d[2].qNum,
                        "valText": d[2].qText,
                        "reCalcID": ''

                    }

                });
            } else if (numMeasure == 2) {
                var data = fdata.map(function (d) {

                    return {
                        "id": d[0].qText,
                        "dim": d[1].qNum,
                        "dimText": d[1].qText,
                        "value": d[2].qNum,
                        "valText": d[2].qText,
                        "reCalcID": d[3].qText

                    }

                });

            }

            data.forEach(function (d, i) {
                d.order = i;
                if (ChartType == 't') {
                    if (i == 0) {
                        d.value = null;
                        d.valText = null;
                    }
                    else {
                        d.value = d.dim - data[i - 1].dim;
                        d.valText = (d.dim - data[i - 1].dim).toString();
                    }
                }

            });
            //if T Chart remove first null value from chart
            if (ChartType == 't') {
                data.splice(0,1);
            }

            var measureLabel = layout.qHyperCube.qMeasureInfo[0].qFallbackTitle;
            var dimLabel = layout.qHyperCube.qDimensionInfo[0].qFallbackTitle;

            var options = {
                measurelabel: measureLabel,
                dimlabel: dimLabel,
                // stdev: layout.CLStDev,
                runlength: layout.runLength,
                trendlength: layout.trendLength,
                forcedzero: layout.forcedZero,
                useBaseline: layout.BaseLineFlag,
                calcpoints: layout.CalcPoints,
                // cltype: layout.CLType,
                showtarget: layout.ShowTarget,
                targetvalue: layout.TargetValue,
                extraAssurance: layout.ExtraAssurance,
                higherbetter: layout.HigherBetter,
                showlabels: layout.showLabels,
                within1sigma: layout.runclosetomean,
                clunderzero: layout.ClUnderZero,
                dateformat: layout.dateFormat,
                tablewidth: layout.tableWidth,
                numMeasures: numMeasure,
                showRecalc: layout.showRecalc,
                HideXAxis: layout.HideXAxis,
                recalColours: layout.recalColours,
                ShowDQ: layout.ShowDQ,
                DQSignOff: layout.DQSignOff,
                DQReview: layout.DQReview,
                DQTimely: layout.DQTimely,
                DQComplete: layout.DQComplete,
                DQProcess: layout.DQProcess,
                DQSystem: layout.DQSystem,
                DQIconSize: layout.DQIconSize,
                DQTextSize: layout.DQTextSize,
                ChartType:layout.ChartType

            };

            DrawChart(data, layout, width, height, id, options);

            //needed for export
            this.$scope.selections = [];
            return qlik.Promise.resolve();
        });

    }
    function tooltipbuilder(d) {
        var output = "<ul>";
        if (d.check == 1) {
            output = output + "<li>run above mean</li>";
        }
        if (d.check == -1) {
            output = output + "<li>run below mean</li>";
        }
        if (d.asctrendcheck == 1) {
            output = output + "<li>asc. trend</li>";
        }
        if (d.desctrendcheck == 1) {
            output = output + "<li>desc. trend</li>";
        }
        if (d.value > d.currUCL) {
            output = output + "<li>above upper ctrl</li>";
        }
        if (d.value < d.currLCL) {
            output = output + "<li>below lower ctl</li>";
        }
        if (d.closetomean == 1) {
            output = output + "<li>run close to mean</li>";
        }
        if (d.nearUCLCheck == 1) {
            output = output + "<li>2/3 close to UCL</li>";
        }
        if (d.nearLCLCheck == 1) {
            output = output + "<li>2/3 close to LCL</li>";
        }
        return output + "</ul>";
    }
    //End tooltipbuilder function
    function group(arr) {
        return arr.reduce(function (res, obj) { // for each object obj in the array arr
            var key = obj.Metric; // let key be the Metric
            var newObj = obj; // create a new object based on the object obj
            if (res[key]) // if res has a sub-array for the current key then...
                res[key].push(newObj); // ... push newObj into that sub-array
            else // otherwise...
                res[key] = [newObj]; // ... create a new sub-array for this key that initially contain newObj
            return res;
        }, {});
    }
    function DrawChart(data, layout, w, h, id, opt) {

        //Use this to create the correct path for the images
        var extName = "UHMB-SPC_RareEvents";

        //Create trimmed dataset for calculation of mean and CL's on initial points (if selected)
        //var initData = JSON.parse(JSON.stringify(data));
        //if (data.length >= opt.calcpoints && opt.calcpoints > 0) {
        //    initData.length = opt.calcpoints;
        //}

        var optSD = 3; //number of Sigma for CL's
        var runlength = opt.runlength;
        var trendlength = opt.trendlength;
        var showtarget = ((opt.showtarget == 1) ? true : false);
        var targetvalue = parseFloat(opt.targetvalue);
        var higherbetter =  true ;
        var showlabels = opt.showlabels;
        var clunderzero = ((opt.clunderzero == 1) ? true : false);
        var showRecalc = opt.showRecalc;
        var higherbetternum = 1;
        var numMeasures = opt.numMeasures;
        var HideXAxis = opt.HideXAxis;

        var Holding;
        Holding = processDataArray(data, runlength, trendlength, clunderzero, opt.calcpoints, opt.within1sigma, opt.useBaseline,opt.ChartType);


        //change margins if labels are being shown

        if (showlabels == true) {
            var margin = {
                top: 30,
                right: 70,
                bottom: 90,
                left: 70
            };
        } else {
            var margin = {
                top: 30,
                right: 70,
                bottom: 70,
                left: 50
            };
        }
        if (HideXAxis == 1) {
            margin.bottom = 10;
        }
        var width = w - margin.left - margin.right - opt.tablewidth,
            height = h - margin.top - margin.bottom;

        var prevValue;



        // set the ranges
        var x = d3.scalePoint()
            .domain(data.map(function (d) {
                return d.dim
            }))
            .range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        // define the value line on the data
        var valueline = d3.line()
            .x(function (d) {
                return x(d.dim);
            })
            .y(function (d) {
                return y(d.value);
            });

        // append the svg obgect to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = d3.select("#" + id).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");



        //define the lines for target, mean and Control Limits
        var targetline = d3.line()
            .x(function (d) {
                return x(d.dim);
            })
            .y(function (d) {
                return y(targetvalue);
            });
        var avgline = d3.line()
            .x(function (d) {
                return x(d.dim);
            })
            .y(function (d) {
                return y(d.currAvg);
            });
        var UCLline = d3.line()
            .x(function (d) {
                return x(d.dim);
            })
            .y(function (d) {
                return y(d.currUCL);
            });
        var LCLline = d3.line()
            .x(function (d) {
                return x(d.dim);
            })
            .y(function (d) {
                return y(d.currLCL);
            });

        var limitpadding = (d3.max(data, function (d) {
            return d.currUCL;
        }) - d3.min(data, function (d) {
            return d.currAvg;
        })) * 0.1; // figure to pad the limits of the y-axis

        var uppery = Math.max(d3.max(data, function (d) {
            return d.currUCL;
        }), d3.max(data, function (d) {
            return d.value;
        })) + limitpadding;
        var lowery = Math.min(d3.min(data, function (d) {
            return d.currLCL;
        }), d3.min(data, function (d) {
            return d.value;
        })) - limitpadding;
        // variable for calculating the axis limits for y-axis
        if (opt.forcedzero == true) {
            lowery = 0;

        } else if (showtarget == true) {
            lowery = Math.min(lowery, targetvalue - limitpadding);
            uppery = Math.max(uppery, targetvalue + limitpadding);
        }
        //		else{
        //		var lowery = d3.min(data, function(d) { return d.currLCL; })-limitpadding;
        //		}

        if (showtarget == true) {
            uppery = Math.max(uppery, targetvalue + limitpadding);
        }

        // Scale the range of the data
        //x.domain(d3.extent(data, function (d) {
        //    return d.dim;
        //}));
        y.domain([0, Math.max(d3.max(data, function (d) {
            return d.value;
        }), uppery)]);

        //div for tooltip
        var TTWidth = Math.min(240, width / 2);
        var div = d3.select("#" + id).append("div")
            .attr('id', 'valuetooltip_'+ layout.qInfo.qId) 
            .attr("class", "UHMBtooltip")
            .style("opacity", 0)
            .style("width", TTWidth + "px");

        //recalculation windows
        if (showRecalc == 1) {
            if (opt.recalColours == '') {
                var colours = ['lightcoral', 'lightblue', 'gold', 'lightgreen', 'palevioletred', 'lavenderblush', 'lightgrey', 'mediumturquoise'];
            } else {
                var colours = opt.recalColours.split(';');
            }
            Holding.forEach((region, i) => {
                var MinX = x(d3.min(region, function (d) {
                    return d.dim;
                }));
                var MaxX = x(d3.max(region, function (d) {
                    return d.dim;
                }));

                svg.append('rect')
                    .attr('x', MinX)
                    .attr('y', 2)
                    //				.attr('rx',5)
                    //				.attr('ry',5)
                    .attr('width', MaxX - MinX)
                    .attr('height', height - 2)
                    //			.attr('stroke', 'black')
                    .attr('fill', colours[i % (colours.length)])
                    .style("opacity", 0.25);

                svg.append("text")
                    .attr("transform", "translate(" + (MaxX - ((MaxX - MinX) / 2)) + "," + 0 + ")")
                    .attr("dy", "0em")
                    .attr("text-anchor", "middle")
                    .style("fill", 'black')
                    .style("font-size", "10px")

                    .text(region[0].reCalcID);
            });
        }

        // Add the valueline path.
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline);
        //add mean
        svg.append("path")
            .data([data])
            .attr("class", "avgline")
            .attr("d", avgline);
        //add UCL
        svg.append("path")
            .data([data])
            .attr("class", "CLline")
            .attr("d", UCLline);
        //add LCL
        // svg.append("path")
        //     .data([data])
        //     .attr("class", "CLline")
        //     .attr("d", LCLline);
        //add target (if selected)
        if (showtarget == true) {
            svg.append("path")
                .data([data])
                .attr("class", "targetline")
                .attr("d", targetline);
        }

        try {
            svg.selectAll(".dot")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .classed("positive", function (d) {
                    if (posiCheck(higherbetter, d) == "Positive" && higherbetternum < 2) {
                        return true;
                    }
                    return false;
                })
                .classed("negative", function (d) {
                    if (posiCheck(higherbetter, d) == "Negative" && higherbetternum < 2) {
                        return true;
                    }
                    return false;
                })
                .classed("purple", function (d) {
                    if (posiCheck(higherbetternum, d) == "Purple" && higherbetternum > 1) {
                        return true;
                    }
                    return false;
                })
                .attr("cx", valueline.x())
                .attr("cy", valueline.y())
                .attr("r", 3.5)

                .on("mouseover", function (d) {

                    var TTValue = d.valText;
                    var TTLeft = Math.min((margin.left + width - TTWidth), d3.mouse(this)[0] + margin.left);

                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html(opt.dimlabel + ": " + d.dimText + "<br/>" + //d.dim.getFullYear() + "-" + (d.dim.getMonth() + 1) + "-" + d.dim.getDate() + "<br/>" +
                        opt.measurelabel + ": " + TTValue + "<br/>"
                        + tooltipbuilder(d))
                        .style("left",  TTLeft + "px"); //(d3.mouse(this)[0]+ margin.left)

                    var tooltipoffset;
                    if (parseInt(d3.select(this).attr("cy")) < height / 2) {
                        tooltipoffset = (parseInt(d3.select(this).attr("cy")) + 30 +5 + "px");
                    } else {
                        tooltipoffset = (y(d.value) + 30 - document.getElementById('valuetooltip_'+ layout.qInfo.qId).clientHeight  -5 + "px");
                    }
                    div.style("top", tooltipoffset);
                    d3.select(this).classed("highlight", true);
                })
                .on("mouseout", function (d) {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                    d3.select(this).classed("highlight", false);
                });
        } catch (err) {
            console.log(err);
        }

        var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat(opt.dateformat));
        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        if (showlabels == true && HideXAxis == 0) {
            // Add the x Axis label

            svg.append("text")
                .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height + margin.top + margin.bottom - 40) + ")")
                .style("text-anchor", "middle")
                .text(opt.dimlabel);
        }
        // Add the Y Axis

        var formatTest = data[data.length - 1].valText;

        if (formatTest.charAt(formatTest.length - 1) == '%') {

            var yAxis = d3.axisLeft(y).tickFormat(d3.format('~%'));

        } else {
            var yAxis = d3.axisLeft(y);
        }
        svg.append("g")
            .call(yAxis);
        if (showlabels == true) {
            //Add the Y axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(opt.measurelabel);
        }
        //Title Text
        var highertext = "lower is better";
        if (higherbetter == true) {
            highertext = "higher is better";
        }
        if (higherbetternum > 1) {
            highertext = "neither higher or lower is better";
        }

        var titletext = "*Mean and Control Limits calculated on full dataset within recalculation window, " + highertext;
        if (data.length >= opt.calcpoints && opt.calcpoints > 0) {
            titletext = "*Mean and Control Limits (re)calculated on first " + opt.calcpoints + " points of data, " + highertext;
        }
        svg.append("text")
            .attr("transform", "translate(" + (2 - margin.left) + "," + (5 - margin.top) + ")")
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "grey")
            .attr("font-size", "10px")
            .text(titletext);
        if (formatTest.charAt(formatTest.length - 1) == '%') {

            //UCL text
            svg.append("text")
                .attr("transform", "translate(" + (width + 3) + "," + y(data[data.length - 1].currUCL) + ")")
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "grey")
                .text("(" + d3.format('.2~%')(data[data.length - 1].currUCL) + ")");

            //LCL text
            // svg.append("text")
            //     .attr("transform", "translate(" + (width + 3) + "," + y(data[data.length - 1].currLCL) + ")")
            //     .attr("dy", ".35em")
            //     .attr("text-anchor", "start")
            //     .style("fill", "grey")
            //     .text("(" + d3.format('.2~%')(data[data.length - 1].currLCL) + ")");

            //Mean text
            svg.append("text")
                .attr("transform", "translate(" + (width + 3) + "," + y(data[data.length - 1].currAvg) + ")")
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "black")
                .text("(" + d3.format('.2~%')(data[data.length - 1].currAvg) + ")");

            //Target Text
            if (showtarget == true) {
                svg.append("text")
                    .attr("transform", "translate(" + (30) + "," + y(targetvalue) + ")")
                    .attr("dy", "1em")
                    .attr("text-anchor", "start")
                    .style("fill", "red")
                    .text("target:(" + d3.format('.2~%')(targetvalue) + ")");
            }
        } else {

            //UCL text
            svg.append("text")
                .attr("transform", "translate(" + (width + 3) + "," + y(data[data.length - 1].currUCL) + ")")
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "grey")
                .text("(" + data[data.length - 1].currUCL.toFixed(2) + ")");

            //LCL text
            // svg.append("text")
            //     .attr("transform", "translate(" + (width + 3) + "," + y(data[data.length - 1].currLCL) + ")")
            //     .attr("dy", ".35em")
            //     .attr("text-anchor", "start")
            //     .style("fill", "grey")
            //     .text("(" + data[data.length - 1].currLCL.toFixed(2) + ")");

            //Mean text
            svg.append("text")
                .attr("transform", "translate(" + (width + 3) + "," + y(data[data.length - 1].currAvg) + ")")
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "black")
                .text("(" + data[data.length - 1].currAvg.toFixed(2) + ")");

            //Target Text
            if (showtarget == true) {
                svg.append("text")
                    .attr("transform", "translate(" + (30) + "," + y(targetvalue) + ")")
                    .attr("dy", "1em")
                    .attr("text-anchor", "start")
                    .style("fill", "red")
                    .text("target:(" + targetvalue + ")");
            }
        }

        //key setup
        var key = d3.select("#" + id).append("div")
            .attr('id', 'SPCKey')
            .attr("class", "key")
            .style("opacity", 0)
            .style("top", margin.top + "px")
            .style("left", margin.left + "px");
        var keysvg = key.append("svg")
            .attr("width", width)
            .attr("height", height);

        //	  var triangles = [];
        //	  triangles.push({
        //  		x: width/4,
        //		y: height/2 +45
        //	  });

        //	  var arc = d3.symbol().type(d3.symbolTriangle);

        //	  var TriLine = keysvg.selectAll('path')
        //  		.data(triangles)
        //  		.enter()
        //  		.append('path')
        //  		.attr('d', arc)
        //  		.attr('fill', 'red')
        //  		.attr('stroke', 'red')
        //  		.attr('stroke-width', 1)
        //  		.attr('transform', function(d) {
        //    		return "translate(" + d.x + "," +d.y +")";
        //  		});

        if (higherbetternum > 1) {
            keysvg.append("circle").attr("cx", width / 4).attr("cy", height / 2 - 15).attr("r", 6).attr("class", "dot").attr("class", "purple");
            keysvg.append("circle").attr("cx", width / 4).attr("cy", height / 2 + 15).attr("r", 6).attr("class", "dot");
            keysvg.append("text").attr("x", 20 + width / 4).attr("y", height / 2 - 15).text("Special Cause - Neither").style("font-size", "15px").attr("alignment-baseline", "middle").attr("class", "keytext");
            keysvg.append("text").attr("x", 20 + width / 4).attr("y", height / 2 + 15).text("Normal Variation").style("font-size", "15px").attr("alignment-baseline", "middle").attr("class", "keytext");

        } else {

            keysvg.append("circle").attr("cx", width / 4).attr("cy", height / 2 - 45).attr("r", 6).attr("class", "dot").attr("class", "negative");
            keysvg.append("circle").attr("cx", width / 4).attr("cy", height / 2 - 15).attr("r", 6).attr("class", "dot").attr("class", "positive");
            keysvg.append("circle").attr("cx", width / 4).attr("cy", height / 2 + 15).attr("r", 6).attr("class", "dot");

            keysvg.append("text").attr("x", 20 + width / 4).attr("y", height / 2 - 45).text("Special Cause - Concern").style("font-size", "15px").attr("alignment-baseline", "middle").attr("class", "keytext");
            keysvg.append("text").attr("x", 20 + width / 4).attr("y", height / 2 - 15).text("Special Cause - Improvement").style("font-size", "15px").attr("alignment-baseline", "middle").attr("class", "keytext");
            keysvg.append("text").attr("x", 20 + width / 4).attr("y", height / 2 + 15).text("Normal Variation").style("font-size", "15px").attr("alignment-baseline", "middle").attr("class", "keytext");
        }
        //	  keysvg.append("text").attr("x", 20 + width/4).attr("y", height/2 +45).text("Outside of Control Limits").style("font-size", "15px").attr("alignment-baseline","middle").attr("class", "keytext");

        var showkey = 0;
        var keyimage = svg.append('image')
            .attr('xlink:href', '/extensions/' + extName + '/' + 'KeySmall.png')
            .attr('width', 20)
            .attr('height', 20)
            .attr('x', width + margin.right - 40)
            .attr('y', height + margin.top)
            .on("click", function (d) {
                if (showkey == 0) {
                    key.transition()
                        .duration(500)
                        .style("opacity", 0.75);
                    showkey = 1;
                } else {
                    key.transition()
                        .duration(500)
                        .style("opacity", 0);
                    showkey = 0;

                }
            });

        
        if (opt.tablewidth > 0) {
            var defTable = d3.select("#" + id).append("table")
                .style("width", (opt.tablewidth - 10) + 'px')
                .style("height", h & 'px')
                .style("position", 'absolute')
                .style("top", '5px')
                .style("right", '5px')
                .attr("class", 'defList');
            defTable.append("tr").append("th").text('Chart Type');
            defTable.append("tr").append("td").text((opt.ChartType.toUpperCase()) + ' Chart');
            defTable.append("tr").append("th").text('Latest Value');
            defTable.append("tr").append("td").text(data[data.length - 1].valText);  
            defTable.append("tr").append("th").text('Latest Event');
            defTable.append("tr").append("td").text(data[data.length - 1].dimText);
            if (opt.ShowDQ == 1) {
                var DQSCol = 'grey';
                var DQTCol = 'grey';
                var DQPCol = 'grey';

                var DQRed = 'red';
                var DQAmber = 'Orange';
                var DQGreen = 'YellowGreen';
                var DQSText = `Sign Off & Review: ${opt.DQSignOff + opt.DQReview}\nSign Off: ${opt.DQSignOff}\nReview: ${opt.DQReview}`;
                var DQTText = `Timely & Complete: ${opt.DQTimely + opt.DQComplete}\nTimely: ${opt.DQTimely}\nComplete: ${opt.DQComplete}`;
                var DQPText = `Process & System: ${opt.DQProcess + opt.DQSystem}\nProcess: ${opt.DQProcess}\nSystem: ${opt.DQSystem}`;

                if (opt.DQIconSize == null) {
                    opt.DQIconSize = 15;
                }

                if (opt.DQTextSize == null) {
                    opt.DQTextSize = '1.2em';
                }

                if (opt.DQSignOff > 0 && opt.DQReview > 0) {
                    if (opt.DQSignOff + opt.DQReview > 4) {
                        DQSCol = DQGreen;
                    }
                    else if (opt.DQSignOff + opt.DQReview > 2) {
                        DQSCol = DQAmber;
                    }
                    else {
                        DQSCol = DQRed;
                    }
                }
                if (opt.DQTimely > 0 && opt.DQComplete > 0) {
                    if (opt.DQTimely + opt.DQComplete > 4) {
                        DQTCol = DQGreen;
                    }
                    else if (opt.DQTimely + opt.DQComplete > 2) {
                        DQTCol = DQAmber;
                    }
                    else {
                        DQTCol = DQRed;
                    }
                }
                if (opt.DQProcess > 0 && opt.DQSystem > 0) {
                    if (opt.DQProcess + opt.DQSystem > 4) {
                        DQPCol = DQGreen;
                    }
                    else if (opt.DQProcess + opt.DQSystem > 2) {
                        DQPCol = DQAmber;
                    }
                    else {
                        DQPCol = DQRed;
                    }
                }


                defTable.append("tr").append("th").text('DQ Indicators');
                var DQIsvg = defTable.append("tr").append("td").append("svg")
                    .attr("width", "100%")
                    .attr("height", 2 * opt.DQIconSize + "px")
                    .append("g");

                // DQIsvg.append('rect')
                // .attr('x',0)
                // .attr('y',0)
                // .attr('width','100%')
                // .attr('height','100%')
                // .attr('rx',3)
                // .attr('ry',3)
                // .attr('fill','gainsboro');
                DQIsvg.append('circle')
                    .attr('cx', '16%')
                    .attr('cy', '50%')
                    .attr('r', opt.DQIconSize + "px")
                    .attr('stroke', 'darkgrey')
                    .attr('stroke-width', '1px')
                    .attr('fill', DQSCol)
                    .attr('shape-rendering', "geometricPrecision")
                    .append('title')
                    .text(DQSText);
                DQIsvg.append('text')
                    .attr('x', '16%')
                    .attr('y', '50%')
                    .attr('font-size', opt.DQTextSize)
                    .attr('font-weight', 'Bold')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .attr('fill', 'white')
                    .text('S')
                    .append('title')
                    .text(DQSText);
                ;
                DQIsvg.append('circle')
                    .attr('cx', '50%')
                    .attr('cy', '50%')
                    .attr('r', opt.DQIconSize + "px")
                    .attr('stroke', 'darkgrey')
                    .attr('stroke-width', '1px')
                    .attr('fill', DQTCol)
                    .attr('shape-rendering', "geometricPrecision")
                    .append('title')
                    .text(DQTText);
                DQIsvg.append('text')
                    .attr('x', '50%')
                    .attr('y', '50%')
                    .attr('font-size', opt.DQTextSize)
                    .attr('font-weight', 'Bold')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .attr('fill', 'white')
                    .text('T')
                    .append('title')
                    .text(DQTText);
                DQIsvg.append('circle')
                    .attr('cx', '83%')
                    .attr('cy', '50%')
                    .attr('r', opt.DQIconSize + "px")
                    .attr('stroke', 'darkgrey')
                    .attr('stroke-width', '1px')
                    .attr('fill', DQPCol)
                    .attr('shape-rendering', "geometricPrecision")
                    .append('title')
                    .text(DQPText);
                DQIsvg.append('text')
                    .attr('x', '83%')
                    .attr('y', '50%')
                    .attr('font-size', opt.DQTextSize)
                    .attr('font-weight', 'Bold')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .attr('fill', 'white')
                    .text('P')
                    .append('title')
                    .text(DQPText);


            }
        }

    }




});
