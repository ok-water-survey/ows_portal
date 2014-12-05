/* ===================================================
 * map.js
 *  25 April 2014
 * ===================================================
 * Copyright (c) 2012 University of Oklahoma
 *
 * console.log();
 * =================================================== */
//Version 
var verDate = {"0": "1.0", "1": "25 April 2014"};
//Declarations
var map, nav, options, siteLayer, selectControls, siteStyles, drawLayer, filterLayer, selectFeature;
var evt_bool = true;
var lay_osm, glayers, mypop;
var sitesTotal = [], sitesActive = [], sitesSel = [];
var baseurl = "";  //"http://test.cybercommons.org";
var selnum = 0, saveselsites = [], saveseldata = [];
var plot_data = [], selplot_data = [], plotDesc = [], plotselDesc = [];
var loaded_sources = []
var savflg = 0;
var qry = '';
var enqry = '';
var fff;
var i =0;
var colorcount = 0
var stylesColor = {0: "#0000ff", 1: "#b575b5", 2: "#f5914d", 3: "#bd2126", 4: "#8cba52", 5: "#8cc4d6", 6: "#007a63", 7: "#705421", 8: "#69c4ad", 9: "#008000", 10: "#000080", 11: "#800080", 12: "#c0c0c0"};
// use a CQL parser for easy filter creation
var format = new OpenLayers.Format.CQL();

var rule = new OpenLayers.Rule({
	// We could also set a filter here.  E.g. #ff0000 #ffcccc
	// filter: format.read("Taxon >= 'S' AND Taxon <= 'U'"),
	//Green color "#8CBA52",
	//"#5258ba"
	symbolizer: {
		fillColor: '${color}',
		strokeColor: "#000000",
		fillOpacity: "0.9",
		strokeWidth: "1",
		graphicZIndex: "1",
		pointRadius: "4.0"
	}
});
var myStyles1 = new OpenLayers.StyleMap({"default": new OpenLayers.Style(null, {rules: [rule]})});
//var newRule = myStyles1.addUniqueValueRules("default","Source",colorlookup)
//Default load of USGS Initital load
var sources = {'USGS': {'url': "/mongo/db_find/ows/usgs_site/{'spec':{'status':'Active'},'fields':{'parameter':0}}/?callback=?",
	'mapping': {'REF_NO': 'site_no', 'Sitename': 'station_nm', 'Status': 'status',
		'SiteType': 'site_tp_cd', 'lat': 'dec_lat_va', 'lon': 'dec_long_va',
		'aquifer': 'aquifer', 'huc_4': 'huc_4', 'huc_8': 'huc_8'}
	}}
var filter = {'source': null, 'watershed': null, 'aquifer': null, 'type': null,'last_activity':null};
var cfilter = {'source': null, 'watershed': null, 'aquifer': null, 'type': null};
//on window load
$(window).ready(function () {
	//dialog filter
	$("#dialog-filter").dialog({
		autoOpen: false,
		height: 750,
		width: 350,
		position: [340, 150],
		title: "<b>Data Source Filter</b>",
		close: function () {
			//$("#bibAll" + ref_no).remove();
		}
	});
	//dialog Data Sources
	$("#dialog-data").dialog({
		autoOpen: false,
		height: 750,
		width: 350,
		position: [340, 150],
		title: '<span class="icon-plus"></span><b>Add Data Source </b>',
		close: function () {
			//$("#bibAll" + ref_no).remove();
		}
	});

	//dialog Data Sources
	$("#dialog-geo").dialog({
		autoOpen: false,
		height: 750,
		width: 350,
		position: [340, 150],
		title: '<span class="icon-filter"><b>Add Data Source </b>',
		close: function () {
			//$("#bibAll" + ref_no).remove();
		}
	});
	//dialog Last Activity Sources
	$("#dialog-last-act").dialog({
		autoOpen: false,
		width: 325,
		position: [340, 350],
		title: '<span class="icon-filter"><b>=Last Activity Date</b>',
		close: function () {
			//$("#bibAll" + ref_no).remove();
		}
	});
	$('#set-last-date').click(function(){
		if ($('#set_date').val()!==""){
			temp =$('#set_date').val().split('/')
			filter.last_activity = temp[2] + temp[0] + temp[1];
			setFilter.set();
			$('#setact a').text('Site Activity >=' + $('#set_date').val());
			$('#setact').show()
			$("#dialog-last-act").dialog("close");
		}else{
			alert("Error, Please enter Filter Date.");
		}

	});
	$('#setact').click(function(){
		filter.last_activity = null;
		setFilter.set();
		$('#setact').hide();
	});
	$("#last-act-btn").click(function (){
		console.log(i);
		$('#dp3 input').datepicker({defaultDate:"-1m", maxDate: new Date(), changeYear: true });
		$("#dialog-last-act")
				.dialog('option','title', "<b>Last Activity</b>")
				.dialog('open');


	});
	$("#data-btn").click(function (){
		$("#dialog-data")
				.dialog('option','title', "<b>Add Data Source</b>")
				.dialog('open');

	});
	$("#watershed-btn").click(function (){
		$('.HIDE_ALL').hide();
		$('.WSHED').show();
		$("#dialog-geo")
				.dialog('option','title', "<b>Watershed Filter</b>")
				.dialog('open');

	});
	$("#aquifer-btn").click(function (){
		$('.HIDE_ALL').hide();
		$('.AQRS').show();
		$("#dialog-geo")
				.dialog('option','title', "<b>Aquifer Filter</b>")
				.dialog('open');

	});
	//console.log('Map.js start')
	options = {
		spericalMercator: true,
		projection: new OpenLayers.Projection("EPSG:900913"),
		maxResolution: 156543.0339,
		maxZoomLevels: 18,
		fractionalZoom: true,
		displayProjection: new OpenLayers.Projection("EPSG:4326"),
		units: "m",
		//maxExtent : new OpenLayers.Bounds([ -9803292.13,-5205054.49, 547896.95, 15497748.74 ])
		maxExtent: new OpenLayers.Bounds([ -19803292.13, -3405054.49, 547896.95, 15497748.74 ])
	}
	map = new OpenLayers.Map('map', options);
	glayers = [
		new OpenLayers.Layer.Google(
			"Google Physical",
			{type: google.maps.MapTypeId.TERRAIN}
		),
		new OpenLayers.Layer.Google(
			"Google Streets", // the default
			{numZoomLevels: 20}
		),
		new OpenLayers.Layer.Google(
			"Google Hybrid",
			{type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20}
		),
		new OpenLayers.Layer.Google(
			"Google Satellite",
			{type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
		),

	];
	map.addLayers(glayers); //[ccbasemap,lay_osm] );
	center = new OpenLayers.LonLat(-98.5, 35);
	center = center.transform(options.displayProjection, options.projection);
	map.setCenter(center, 7);

	map.zoomToMaxExtent = function () {
		map.setCenter(center, 7);	//re-center if globe clicked
	};

	siteStyles = new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({ fillOpacity: 1, pointRadius: 3.5, strokeWidth: 1, fillColor: "#8CBA52", graphicZIndex: 1 }),
		"select": new OpenLayers.Style({ fillOpacity: 0.2, fillColor: "#F6358A", graphicZIndex: 1 })
	});

	myStyles = new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({ fillOpacity: 0.2, fillColor: "#F6358A", graphicZIndex: 2 },
			{rules: [
				new OpenLayers.Rule({
					filter: new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.EQUAL_TO,
						property: "STYLE_TYPE", // the "foo" feature attribute
						value: "watershed"
					}),
					// if a feature matches the above filter, use this symbolizer
					symbolizer: {
						fillColor: "#4EB3D3",
						fillOpacity: 0.6,
						strokeColor: "#084594"
					}
				}),
				new OpenLayers.Rule({
					filter: new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.EQUAL_TO,
						property: "STYLE_TYPE", // the "foo" feature attribute
						value: "aquifer"
					}),
					// if a feature matches the above filter, use this symbolizer
					symbolizer: {
						fillColor: "#084594",
						fillOpacity: 0.6,
						strokeColor: "#4EB3D3"
					}
				})
			]
			}),
		"highlight": new OpenLayers.Style({ fillOpacity: 0.5, fillColor: "#F6358A", graphicZIndex: 2 }),
		"select": {fillOpacity: 1, strokeColor: "white", fillColor: "#8CBA52", graphicZIndex: 0}
	});
	var ss = {"default": new OpenLayers.Style(null, {rules: [rule]}), "select": new OpenLayers.Style({fillColor: "#F6358A"}, {rules: [rule]})
	}

	siteLayer = new OpenLayers.Layer.Vector("Sites", {styleMap: myStyles1});

	$("#totmsg").show().html("Loading . . .");
	load_sites(siteLayer, baseurl + sources['USGS'].url, 'USGS', sources['USGS'].mapping,"#00BB22");// "#FFFF66"); // "#437C17");
	filter['USGS_type']=[];
	drawLayer = new OpenLayers.Layer.Vector("Draw Layer", {styleMap: myStyles, 'displayInLayerSwitcher': false});//    new OpenLayers.Style({ fillOpacity: 1, fillColor: "#F6358A", graphicZIndex: 2 })});
	filterLayer = new OpenLayers.Layer.Vector("Filter Layer", {styleMap: myStyles});
	map.addLayer(drawLayer);//[polygonLayer,circleLayer,boxLayer]);
	map.addLayer(filterLayer);
	map.addLayer(siteLayer);
	map.addControl(new OpenLayers.Control.MousePosition({emptyString: "Oklahoma Water Survey"}));
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.ScaleLine());
	//map.addControl(new OpenLayers.Control.OverviewMap());
	selStyle = new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({ display: 'none' })
	});

	selectControls = { polygon: new OpenLayers.Control.DrawFeature(drawLayer, OpenLayers.Handler.Polygon),
		circle: new OpenLayers.Control.DrawFeature(drawLayer, OpenLayers.Handler.RegularPolygon, { handlerOptions: { sides: 40 } }),
		box: new OpenLayers.Control.DrawFeature(drawLayer, OpenLayers.Handler.RegularPolygon, { handlerOptions: { sides: 4, irregular: true } }),
		select: new OpenLayers.Control.SelectFeature(siteLayer, { toggle: true })
	};
	siteLayer.events.on({
		'featureselected': onFeatureSelectNav,
		'featureunselected': onFeatureUnselect
	});
	for (var key in selectControls) {
		map.addControl(selectControls[key]);
		selectControls[key].events.register("featureadded", this, function (f) {
			$.each(siteLayer.features, function (key, val) {
				if (val.geometry.intersects(f.feature.geometry)) {
					onFeatureSelect(val);
					selectControls.select.highlight(val);
				}
			});
		});
	}

	document.getElementById("noneToggle").checked = true;
	selectControls.select.activate();

	//Disable zoomWheel
	controls = map.getControlsByClass('OpenLayers.Control.Navigation');
	for (var i = 0; i < controls.length; ++i)
		controls[i].disableZoomWheel();
	selectFeature = new OpenLayers.Control.SelectFeature(filterLayer);

	$("#map").resizable();


	$('#about').click(function () {
		$("body").append('<div id="aboutAll" ></div>');
		$("#aboutAll").dialog({ height: 700, width: 850, title: "<h3>Oklahoma Water Survey Data Portal</h3><h4>Version: " + verDate[0] + "</h4><h5>" + verDate[1] + "</h5>", close: function () {
			$("#aboutAll").remove();
		} });
		$('#aboutAll').load('about.html');
	});

	$('#contact').click(function () {
		$("body").append('<div id="contactAll"></div>');
		$("#contactAll").dialog({ height: 500, width: 850, title: "<h3>Oklahoma Water Survey Data Portal Contact</h3><h4>Version: " + verDate[0] + "</h4><h5>" + verDate[1] + "</h5>", close: function () {
			$("#contactAll").remove();
		} });
		$("#contactAll").load('contact.html');
		//$("#contactAll").load('contact.html');
	});

	$('#help').click(function () {
		$("body").append('<div id="helpAll"></div>');
		$("#helpAll").dialog({ height: 500, width: 850, title: "<h3>How To Use Data Portal</h3><h4>Version: " + verDate[0] + "</h4><h5>" + verDate[1] + "</h5>", close: function () {
			$("#helpAll").remove();
		} });
		$("#helpAll").append('</br><b>Please click link below:</b></br></br><a href="http://oklahomawatersurvey.org/pdf/owsportalhelp.pdf" style="color:#2175A6;" target="_blank">Help and Instructions for Data Portal</a>');
	});

	$("#selinfo").dialog({ autoOpen: false, height: 500, width: 800, position: [40, 50],
		close: function () {
			closesites();
		},
		buttons: [
			{ text: "Close", class: "btn", click: function () {
				$(this).dialog("close");
			} },
			{ text: "Save", class: "btn btn-success", click: function () {
				savesites();
				$(this).dialog("close");
			} }
		]
	});
}); //end document ready

function apply_current () {

	var siteTotal = 0;
	$.each(siteLayer.features, function (x, y) {
		if (y.getVisibility()) {
			siteTotal = siteTotal + 1;
		}
	});
	//console.log(siteTotal)
	$("#totmsg").html("<table width='100%'><tr><td>Total Sites: <b>" + siteTotal +
		"</b></td><td style='text-align:right;'><a href='#' class='btn btn-info btn-mini' onclick='window.location.reload();'>Clear Selected</a></td></tr></table>");

}
function removeFilter (item) {
	if (item == 0) {
		filter.watershed = null;
		cfilter.watershed = null;
	} else if (item == 1) {
		filter.aquifer = null;
		cfilter.aquifer = null;
	} else if (item == 2) {
		filter.type = null;
		cfilter.type = null;
	}
	apply_current();
	apply_filter();
}
function padStr(i) {
    return (i < 10) ? "0" + i : "" + i;
}

function load_sites (layer, url, source, mapping, color) {
	loaded_sources.push(source);
	var mess = 'Loading.... ' + $('#select_sites option:selected').text()
	$.blockUI({ message: mess, css: {
		border: 'none',
		padding: '15px',
		backgroundColor: '#000',
		'-webkit-border-radius': '10px',
		'-moz-border-radius': '10px',
		opacity: .5,
		color: '#fff'
	} });
	$.getJSON(url, function (fdata) {
		var ct =0;
		$.each(fdata, function (key, val) {
			sitesTotal.push(val);

			var point = new OpenLayers.Geometry.Point(val[mapping.lon], val[mapping.lat]);
			point = point.transform(options.displayProjection, options.projection);
			var pointFeature = new OpenLayers.Feature.Vector(point, null, null);
			var modtype = val[mapping.SiteType].replace(/-/g, '');
			modtype = modtype.replace(/\s+/g, '');
			modtype = modtype.replace(/,/g, '');
			modtype = modtype.replace('(', '_')
			modtype = modtype.replace(':', '')
			modtype = modtype.replace('/', '')
			modtype = modtype.replace(')', '')
			var last_activity = '';
			var aqui = '';
			var huc4 = '';
			var huc8 = '';
			var aquifers =[];
			if('aquifers' in val){
				$.each(val['aquifers'],function(k,v){
					//console.log(v)
					aquifers.push(v.name.replace(/\s+/g, '').replace(/-/g, '').replace(/,/g, ''))
				})
				//console.log(aquifers)
			}
			if ('last_activity' in val){
                                if (source == 'USGS'){
                                    if (val['webservice'].indexOf("uv")>-1 || val['webservice'].indexOf("iv")>-1 || val['webservice'].indexOf("rt")>-1){
                                        var temp = new Date();
                                        var dateStr = padStr(temp.getFullYear()) + padStr(1 + temp.getMonth()) + padStr(temp.getDate())
                                        last_activity = dateStr
                                    
                                    }else{
                                        last_activity =val['last_activity'].replace(/\s+/g, '').replace(/-/g, '');
                                    } 
                                }else{
				last_activity =val['last_activity'].replace(/\s+/g, '').replace(/-/g, '');
                                }

			}else{
				if (source == 'MESONET'){
					var temp = new Date();
					var dateStr = padStr(temp.getFullYear()) + padStr(1 + temp.getMonth()) + padStr(temp.getDate())
					last_activity = dateStr
				}
				if (source == 'OWRBMW'){
					var temp = val['endDT'].replace(/\s+/g,'')
					//last_activity =
					if(temp== 'present'){
						var temp = new Date();
						var dateStr = padStr(temp.getFullYear()) + padStr(1 + temp.getMonth()) + padStr(temp.getDate())
						last_activity = dateStr
					}else{
						var ltemp=temp.split('/')
						last_activity = ltemp[2] + padStr(parseInt(ltemp[0])) + padStr(parseInt(ltemp[1]))
					}
					//console.log(last_activity)
				}
				if (source.split('_')[0]=='OWRB'){
					if (val['CONST_DATE']!== null){
						last_activity = val['CONST_DATE'].replace(/\//g,'').replace(/\s+/g,'')
					}
				}
			}


			if (val[mapping.aquifer]) {
				aqui = val[mapping.aquifer].replace(/-/g, '');
				aqui = aqui.replace(/\s+/g, '');
			}
			if (val[mapping.huc_4]) {
				huc4 = val[mapping.huc_4];
			}//.huc_4;}
			if (val[mapping.huc_8]) {
				huc8 = val[mapping.huc_8];
			}//.huc_8;}
			if (huc4 == '' && huc8.length >= 4) {
				huc4 = huc8.substring(0, 4);
			}
			pointFeature.attributes = {"REF_NO": val[mapping.REF_NO], "Sitename": val[mapping.Sitename], "State": "OK", "Status": val[mapping.Status],
				"Source": source.replace(/-/g, ''), "SiteType": modtype, 'lat': val[mapping.lat], 'lon': val[mapping.lon],
				'aquifer': aqui, 'huc_4': huc4, 'huc_8': huc8, 'color': color,'aquifers':aquifers,'last_activity':last_activity}; //"#5258ba"};
			layer.addFeatures(pointFeature);
			sitesActive.push(val[mapping.REF_NO]);

		}); //end each
		apply_current();
		$.unblockUI();
	}); //end getJSON
}
function updateFilter (fltr) {
	var filter;
	try {
		filter = format.read(fltr);
	} catch (err) {
		alert(err.message);
	}
	if (filter) {
		//newRule.filter = filter;
		rule.filter = filter;
		siteLayer.redraw();
	}
	return false;
}
function removeFeature (property, value) {
	filterLayer.removeFeatures(filterLayer.getFeaturesByAttribute(property, value))
}

function showFeature (feature, showFilter) {
	//console.log('showfilter');
	console.log(feature);
	var in_options = {'internalProjection': map.projection, 'externalProjection': map.projection};
	var geojson_format = new OpenLayers.Format.GeoJSON(in_options);
	var pre = '{"type": "FeatureCollection","features":'
	var geosjon_str = pre + JSON.stringify(feature) + '}'
	var features = geojson_format.read(geosjon_str, "FeatureCollection");
	if (features.constructor != Array) {
		features = [features];
	}
	filterLayer.addFeatures(features);
}
function toggleControl (element) {
	for (key in selectControls) {
		var control = selectControls[key];
		if (element.value == key && element.checked) {
			control.activate();
		} else {
			control.deactivate();
		}
	}
	drawLayer.removeAllFeatures();
}
function onPopupClose (evt) {
	// 'this' is the popup.
	var feature = this.feature;
	if (feature.layer) { // The feature is not destroyed
		selectControls.select.unselect(feature);
	} else { // After "moveend" or "refresh" events on POIs layer all
		//     features have been destroyed by the Strategy.BBOX
		this.destroy();
	}
}
function onFeatureSelectNav (evt) {
	if (evt_bool == true) {
		feature = evt.feature;
		//new OpenLayers.Size(600,200)  feature.geometry.getBounds().getCenterLonLat()
		content = "<b>" + feature.attributes.Sitename + "</b><table class='table-condensed' style='margin-bottom:5px;margin-right:10px;'>" +
			"<tr><th>ID</th><td>" + feature.attributes.REF_NO + "</td></tr>" +
			"<tr><th>Type</th><td>" + feature.attributes.SiteType + "</td></tr>" +
			"<tr><th>Status</th><td>" + feature.attributes.Status + "</td></tr>" +
			"<tr><td colspan='2'><a style='color:blue;' href='#' onclick='showbib(" + '"' + feature.attributes.REF_NO + '"' + ',"' + feature.attributes.Source + '"' + ")'>Data Access</a></td></tr>" +
			"<tr><td colspan='2'><a style='color:blue;' href='http://maps.google.com/maps?z=15&t=k&q=" + feature.attributes.lat + "," + feature.attributes.lon +
			"' target='_blank'>Google Maps</a></td></tr></table>"
		//new OpenLayers.Size(100, 100)
		popup = new OpenLayers.Popup.FramedCloud("featurePopup", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(100, 100),
			content, null, true, onPopupClose);
		popup.panMapIfOutOfView = true;
		feature.popup = popup;
		popup.feature = feature;
		map.addPopup(popup, true);
	}
}
function onFeatureUnselect (evt) {
	if (evt_bool == true) {
		feature = evt.feature;
		if (feature.popup) {
			popup.feature = null;
			map.removePopup(feature.popup);
			feature.popup.destroy();
			feature.popup = null;
		}
	}
}

function onFeatureSelect (feature) {
	fff = feature
	if (feature.getVisibility()) {
		if (jQuery.inArray(feature.attributes.REF_NO, sitesSel) < 0) {
			sitesSel.push(feature.attributes.REF_NO);
			$("#sites tbody").append("<tr>" +
				"<td>" + feature.attributes.REF_NO + "</td>" +
				"<td><a style='color:#08C;' href='#' onclick='showbib(" + '"' + feature.attributes.REF_NO + '","' + feature.attributes.Source + '"' + ");'>" + feature.attributes.Sitename + "</a></td>" +
				"<td style='text-align:center;'>" + feature.attributes.Status + "</td>" +
				"<td style='text-align:right;'>" + feature.attributes.Source + "</td>" +
				"<td style='text-align:right;'>" + feature.attributes.SiteType + "</td>" +
				"</tr>"
			);
			$("#selname").val("Selected Sites " + sitesSel.length);
			$("#selinfo").dialog({ title: "" }).dialog('open');
		}
		drawLayer.removeAllFeatures();
	}
}
function showbib (ref_no, source) {
	//var source = $('#select_sites').val().split("_");
	var refid2 = ref_no.replace(/./g,'');
	if ($("#bibAll" + refid2).length < 1) {
		$("body").append('<div id="bibAll' + refid2 + '"></div>');
		$("#bibAll" + refid2).dialog({ height: 'auto', width: '900px', position: [300, 100], title: "<h3>Data</h3>", close: function () {
			$("#bibAll" + refid2).remove();
		} });
		//var srce = source.split("_")[0]
		$("#bibAll" + refid2).append('<iframe id="iframe' + refid2 + '" src="/tools/usgs_metadata/' + ref_no + '?source=' + source + '" width="100%" height="700"></iframe>');
	}
}
function savesites () {
	saveselsites[selnum] = sitesSel;
	saveseldata[selnum] = $("#sites tbody").clone();
	var name = $("#selname").val();

	if (selnum == 1) {
		$("#selAccordion").prepend("<div id='all' class='alert alert-info' style='text-align:center;'><b>ALL:</b><a href='#' onclick='highlightall();'>Map Selection</a> &bull; <a href='#' onclick='plotall();'>Species-area relationship</a><div id='showPlotAll'></div></div>");
	}

	$("#selAccordion").append('\
			<div class="btn-toolbar">\
				<a class="close" data-dismiss="alert" onclick="closeSel(' + selnum + ');">x</a> \
				<div class="btn-group">\
					<button id="bname' + selnum + '" class="btn" style="color:' + stylesColor[selnum] + ';width:140px;">' + name + '</button>\
						<button class="btn dropdown-toggle" data-toggle="dropdown">\
						<span class="caret"></span>\
					</button>\
					<ul class="dropdown-menu">\
						<li><a href="#" onclick="selview(' + selnum + ');">List Selection</a></li>\
						<li><a href="#" onclick="selhighlight(' + selnum + ');">Map Selection</a></li>\
						<li><a href="#" onclick="selplot(' + selnum + ');">Plot(Not implemented)</a></li>\
	    			</ul>\
	    		</div>\
			</div>');

	selnum += 1;
	savflg = 1;
	unHighlightAll();
}

function closesites () {
	if (savflg) {
		//selected sites saved
		savflg = 0;
		sitesSel = [];
		$("#sites tbody").empty();
	} else {
		//selected sites closed
		sitesSel = [];
		$("#sites tbody").empty();
		unHighlightAll();
	}
}

function closeSel (i) {
	delete saveselsites[i];
	selnum -= 1;

	if (selnum == 1) {
		$("#all").hide();
	}
	if (selnum == 0) {
		saveselsites = [];
		unHighlightAll();
	}
}

function selview (i) {
	$("#sites tbody").empty();
	$("#sites").append(saveseldata[i]);
	$("#seldivname").hide();
	$("#selinfo").dialog({ title: $("#bname" + i).html() }).dialog('open');
}

function highlightall () {
	unHighlightAll();
	for (i = 0; i <= saveselsites.length; i++) {
		siteStyles.styles.select.defaultStyle.fillColor = stylesColor[i];
		$.each(siteLayer.features, function (key, val) {
			if (jQuery.inArray(val.attributes.REF_NO, saveselsites[i]) > -1) {
				selectControls.select.highlight(val);
			}
		});
	}
	siteStyles.styles.select.defaultStyle.fillColor = "#F6358A";
}

function selhighlight (i) {
	unHighlightAll();
	siteStyles.styles.select.defaultStyle.fillColor = stylesColor[i];
	$.each(siteLayer.features, function (key, val) {
		if (jQuery.inArray(val.attributes.REF_NO, saveselsites[i]) > -1) {
			selectControls.select.highlight(val);
		}
	});
	siteStyles.styles.select.defaultStyle.fillColor = "#F6358A";
}
function plotall () {
	plot_data = [], selplot_data = [], plotDesc = [], plotselDesc = [];
	$.each(sitesTotal, function (key, val) {
		var lh = Math.log(parseFloat(val.Area_hectares)) / Math.log(10);
		var ls = Math.log(parseFloat(val.NO_Species)) / Math.log(10);
		plotDesc.push(val);
		plot_data.push([ lh, ls ]);

		for (i = 0; i <= saveselsites.length; i++) {
			if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
				plotselDesc.push(val);
				selplot_data.push([ lh, ls ]);
			}
		}
	});

	var plot_options = {lines: { show: false }, points: { show: true }, grid: {hoverable: true}, selection: { mode: "xy" },
		yaxis: { show: true, axisLabel: 'log10(NO_Species)', position: 'left' },
		xaxis: { show: true, axisLabel: 'log10(area)'} };

	var d1 = {color: "#8CBA52", data: plot_data };
	var d2 = {color: stylesColor[0], data: selplot_data };

	$("#selAccordion").append('<div id="plotinfoAll"><div id="plotAll" style="width:800px; height:450px;"></div></div>');
	$("#plotinfoAll").dialog({ height: 500, width: 850, title: "Plot All Data - total: " + plot_data.length + "  selected: " + selplot_data.length, close: function () {
		$("#plotinfoAll").remove();
	} });

	$("#plotAll").bind("plothover", function (event, pos, item) {
		if (item) {
			$("#tooltip").remove();
			var pinfo = '';
			if (item.seriesIndex == 0) {
				pinfo = "ID: " + plotDesc[item.dataIndex].REF_NO + "  " + plotDesc[item.dataIndex].Sitename;
			}
			if (item.seriesIndex == 1) {
				pinfo = "ID: " + plotselDesc[item.dataIndex].REF_NO + "  " + plotselDesc[item.dataIndex].Sitename;
			}
			showTooltip(item.pageX, item.pageY, pinfo);
		} else {
			$("#tooltip").remove();
		}
	});

	$("#plotAll").bind("plotselected", function (event, ranges) {
		plotselData(i, ranges.xaxis.from, ranges.xaxis.to, ranges.yaxis.from, ranges.yaxis.to);
	});

	$.plot($("#plotAll"), [d1, d2], plot_options);
}

function selplot (i) {
	plot_data = [], selplot_data = [], plotDesc = [], plotselDesc = [];
	$.each(sitesTotal, function (key, val) {
		var lh = Math.log(parseFloat(val.Area_hectares)) / Math.log(10);
		var ls = Math.log(parseFloat(val.NO_Species)) / Math.log(10);
		plotDesc.push(val);
		plot_data.push([ lh, ls ]);

		if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
			plotselDesc.push(val);
			selplot_data.push([ lh, ls ]);
		}
	});

	var plot_options = {lines: { show: false }, points: { show: true }, grid: {hoverable: true}, selection: { mode: "xy" },
		yaxis: { show: true, axisLabel: 'log10(NO_Species)', position: 'left' },
		xaxis: { show: true, axisLabel: 'log10(area)'} };

	var d1 = {color: "#8CBA52", data: plot_data };
	var d2 = {color: stylesColor[i], data: selplot_data };

	$("#selAccordion").append('<div id="plotinfo' + i + '"><div id="plot' + i + '" style="width:800px; height:450px;"></div></div>');
	$("#plotinfo" + i).dialog({ height: 500, width: 850, title: "Plot Data - total: " + plot_data.length + "  selected: " + selplot_data.length, close: function () {
		$("#plotinfo" + i).remove();
	} });

	$("#plot" + i).bind("plothover", function (event, pos, item) {
		if (item) {
			$("#tooltip").remove();
			var pinfo = '';
			if (item.seriesIndex == 0) {
				pinfo = "ID: " + plotDesc[item.dataIndex].REF_NO + "  " + plotDesc[item.dataIndex].Sitename;
			}
			if (item.seriesIndex == 1) {
				pinfo = "ID: " + plotselDesc[item.dataIndex].REF_NO + "  " + plotselDesc[item.dataIndex].Sitename;
			}
			showTooltip(item.pageX, item.pageY, pinfo);
		} else {
			$("#tooltip").remove();
		}
	});

	$("#plot" + i).bind("plotselected", function (event, ranges) {
		plotselData(i, ranges.xaxis.from, ranges.xaxis.to, ranges.yaxis.from, ranges.yaxis.to);
	});

	$.plot($("#plot" + i), [d1, d2], plot_options);
}

function showTooltip (x, y, contents) {
	$('<div id="tooltip" style="z-index:3000">' + contents + '</div>').css({
		position: 'absolute',
		display: 'none',
		top: y + 5,
		left: x + 5,
		border: '1px solid #fdd',
		padding: '2px',
		'background-color': '#fee',
		opacity: 0.80
	}).appendTo("body").fadeIn(200);
}

function unHighlightAll () {
	$.each(siteLayer.features, function (key, val) {
		selectControls.select.unhighlight(val);
	});
}
/* End of map.js =========================== */
