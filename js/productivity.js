var productivity = (function($, d3) {

	var buckets = 10;
	var colorScheme = 'warm';
	var days = [
	  { name: 'Sunday', abbr: 'Su' },
		{ name: 'Monday', abbr: 'Mo' },
		{ name: 'Tuesday', abbr: 'Tu' },
		{ name: 'Wednesday', abbr: 'We' },
		{ name: 'Thursday', abbr: 'Th' },
		{ name: 'Friday', abbr: 'Fr' },
		{ name: 'Saturday', abbr: 'Sa' }
	];
	var hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];

	var productivityData;
	var browserData;

	function setProductivityData(data) {
		productivityData = data;
	}

	function setBrowserData(data) {
		browserData = data;
	}

	function isOldBrowser(browser) {
	    var result = false;
	    if (browser.browser === 'Explorer' && browser.version < 9) {
	        result = true;
	    } else if (browser.browser === 'Firefox' && browser.version < 4) {
	        result = true;
	    }
	    return result;
	}

	function flipTiles() {
		var oldSide = d3.select('#tiles').attr('class');
		var newSide = oldSide === 'front' ? 'back' : 'front';

		var flipper = function(h, d, side) {
			return function() {
				var sel = '#d' + d + 'h' + h + ' .tile';
				var rotateY = side === 'back' ? 'rotateY(0deg)' : 'rotateY(180deg)';
				if (browserData.browser === 'Safari' || browserData.browser === 'Chrome') {
					d3.select(sel).style('-webkit-transform', rotateY);
				} else {
					d3.select(sel).select('.' + oldSide).classed('hidden', true);
					d3.select(sel).select('.' + newSide).classed('hidden', false);
				}
			};
		};

		for (var h = 0; h < hours.length; h++) {
			for (var d = 0; d < days.length; d++) {
				var side = d3.select('#tiles').attr('class');
				setTimeout(flipper(h, d, side), (h * 20) + (d * 20) + (Math.random() * 100));
			}
		}
		d3.select('#tiles').attr('class', newSide);
	}

	function getHoursHeadersHtml(hours) {
		var html = "";
		for (var h = 0; h < hours.length; h++) {
			html += '<th class="h' + h + '">' + hours[h] + '</th>';
		}
		return html;
	}

	function getDaysTilesHtml(days, hours) {
		var html = "";
		for (var d = 0; d < days.length; d++) {
			html += '<tr class="d' + d + '">';
			html += '<th>' + days[d].abbr + '</th>';
			for (var h = 0; h < hours.length; h++) {
				html += '<td id="d' + d + 'h' + h + '" class="d' + d + ' h' + h + '"><div class="tile"><div class="face front"></div><div class="face back"></div></div></td>';
			}
			html += '</tr>';
		}
		return html;
	}

	function createTiles() {
		var html = '<table id="tiles" class="front">';
		html += '<tr><th><div>&nbsp;</div></th>';
		html += getHoursHeadersHtml(hours);
		html += '</tr>';
		html += getDaysTilesHtml(days, hours);
		html += '</table>';
		d3.select('#vis').html(html);
	}

	function renderHourlyChartText(chart) {
		var text = chart.selectAll('text');
	  text.data(hours)
	      .enter()
	          .append('svg:text')
	              .attr('class', function(d, i) { return (i % 3) ? 'hidden hr' + i : 'visible hr' + i })
	              .attr("x", function(d, i) { return i * 12 })
	              .attr("y", 166)
	              .attr("text-anchor", 'left')
	              .text(String);
	}

	function renderHourlyChartGraph(chart, hourlyData) {
		var height = 150;
		var scalingFunction = d3.scale.linear()
	      .domain([0, d3.max(hourlyData)])
	      .range([0, height]);

		var rect = chart.selectAll('rect');
		rect.data(hourlyData)
	      .enter()
	          .append('svg:rect')
	              .attr('x', function(d, i) { return i * 12; })
	              .attr('y', function(d) { return height - scalingFunction(d) })
	              .attr('height', function(d) { return scalingFunction(d) })
	              .attr('width', 10)
	              .attr('class', function(d, i) { return 'hr' + i});
	}

	function renderChartFrame() {
		return d3.select('#hourly_values .svg')
	      .append('svg:svg')
	      .attr('class', 'chart')
	      .attr('width', 300)
	      .attr('height', 170);
	}

	function drawHourlyChart(day) {
		d3.selectAll('#hourly_values svg').remove();
	  var chart = renderChartFrame();
	  var hourlyData = productivityData[day];
	  renderHourlyChartGraph(chart, hourlyData);
		renderHourlyChartText(chart);
	}

	function selectHourlyChartBar(hour) {
		d3.selectAll('#hourly_values .chart rect').classed('sel', false);
		d3.selectAll('#hourly_values .chart rect.hr' + hour).classed('sel', true);
		d3.selectAll('#hourly_values .chart text').classed('hidden', true);
		d3.selectAll('#hourly_values .chart text.hr' + hour).classed('hidden', false);
	}

	function getMax() {
		var max = -1;
		for (var d = 0; d < productivityData.length; d++) {
			for (var h = 0; h < productivityData[d].length; h++) {
				var tot = productivityData[d][h];
				max = tot > max ? tot : max;
			}
		}
		return max;
	}

	function getBucketRange(buckets) {
		var range = [];

		for (var i = 1; i <= buckets; i++) {
			range.push(i);
		}
		return range;
	}

	function colorTiles() {
		var range = getBucketRange(buckets);
		var max = getMax();
		var bucket = d3.scale.quantize().domain([0, max > 0 ? max : 1]).range(range);
		var side = d3.select('#tiles').attr('class');
		side = side === 'front' ? 'back' : 'front';

		for (var d = 0; d < data.length; d++) {
			for (var h = 0; h < data[d].length; h++) {

				var sel = '#d' + d + 'h' + h + ' .tile .' + side;
				val = data[d][h];

				// erase all previous bucket designations on this cell
				for (var i = 1; i <= buckets; i++) {
					var cls = 'q' + i + '-' + buckets;
					d3.select(sel).classed(cls , false);
				}

				// set new bucket designation for this cell
				var cls = 'q' + (val > 0 ? bucket(val) : 0) + '-' + buckets;
				d3.select(sel).classed(cls, true);
			}
		}
	}

	function drawHourlyChartForDefaultDay() {
		var defaultDay = 3; // wednesday
		if (isOldBrowser(browser) === false) {
				drawHourlyChart(defaultDay);
		}
	}

	function updateHourlyChart(day, hour) {
		if (isOldBrowser(browser) === false) {
			drawHourlyChart(day);
			selectHourlyChartBar(hour);
		}
		d3.select('#hourly_values .subtitle').html('Tasks completed on ' + days[day].name + 's');
	}

	function attachTileHoverListener() {
		$('#tiles td').hover(
			function() {
				$(this).addClass('sel');
				var tmp = $(this).attr('id').split('d').join('').split('h'),
				day = parseInt(tmp[0]),
				hour = parseInt(tmp[1]);
				updateHourlyChart(day, hour);
			},
			function() {
		    $(this).removeClass('sel');
				drawHourlyChartForDefaultDay();
			}
		);
	}

	$(document).ready(function() {
		d3.select('#vis').classed(colorScheme, true);
		attachTileHoverListener();
	});

	function render() {
		createTiles();
		colorTiles();
		drawHourlyChartForDefaultDay();
		flipTiles();
	}

	var exportedModule = {};
	exportedModule.setProductivityData = setProductivityData;
	exportedModule.setBrowserData = setBrowserData;
	exportedModule.render = render;
	return exportedModule;

})(jQuery, d3);

var browser = BrowserDetect;
var data = [[0.0051, 0.0016, 0.0004, 0.0004, 0.0003, 0.0002, 0.0005, 0.0029, 0.0041, 0.0063, 0.0103, 0.0101, 0.0118, 0.0108, 0.0105, 0.011, 0.0128, 0.0086, 0.0117, 0.0097, 0.0094, 0.0119, 0.0131, 0.0129], [0.0061, 0.0009, 0.0002, 0.0, 0.0, 0.0, 0.0005, 0.0041, 0.0048, 0.0067, 0.0076, 0.0084, 0.013, 0.011, 0.0088, 0.0094, 0.0096, 0.0078, 0.0085, 0.0099, 0.0129, 0.0163, 0.0124, 0.0126], [0.0053, 0.0007, 0.0006, 0.0001, 0.0, 0.0001, 0.0004, 0.0031, 0.005, 0.0061, 0.0085, 0.0081, 0.0107, 0.0088, 0.008, 0.0078, 0.0095, 0.0066, 0.0096, 0.0106, 0.0106, 0.0127, 0.0123, 0.0099], [0.0038, 0.0009, 0.0003, 0.0001, 0.0, 0.0, 0.0004, 0.0032, 0.0047, 0.0058, 0.0081, 0.0062, 0.01, 0.0091, 0.0078, 0.0084, 0.008, 0.0072, 0.0073, 0.0082, 0.0091, 0.0099, 0.0104, 0.0095], [0.0048, 0.002, 0.0005, 0.0, 0.0001, 0.0, 0.0003, 0.0019, 0.0032, 0.005, 0.0058, 0.0066, 0.0095, 0.0085, 0.0073, 0.008, 0.0083, 0.006, 0.0057, 0.0078, 0.0057, 0.0047, 0.0059, 0.0082], [0.0054, 0.0037, 0.001, 0.001, 0.0001, 0.0001, 0.0, 0.0002, 0.0001, 0.0013, 0.0024, 0.0043, 0.0082, 0.0055, 0.0065, 0.0059, 0.0055, 0.0055, 0.005, 0.0045, 0.0033, 0.0053, 0.0085, 0.0088], [0.0087, 0.004, 0.0015, 0.0003, 0.0001, 0.0, 0.0, 0.0001, 0.0004, 0.0009, 0.0034, 0.0065, 0.0088, 0.0097, 0.0084, 0.0078, 0.0091, 0.0111, 0.0101, 0.0087, 0.0109, 0.0118, 0.0169, 0.0115]];

var productivityInstance = productivity;
productivityInstance.setProductivityData(data);
productivityInstance.setBrowserData(browser);
productivityInstance.render();
