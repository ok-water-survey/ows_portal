/* ===================================================
 * map.js
 *  18 Dec 2012
 * ===================================================
 * Copyright (c) 2012 University of Oklahoma
 *
 * console.log();
 * =================================================== */
//Version 
var verDate = {"0": "0.01", "1": "18 December 2012"};
//Declarations
var map, nav, options, siteLayer, selectControls, siteStyles, drawLayer, filterLayer, selectFeature;
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
var stylesColor = {"0": "#0000ff", "1": "#b575b5", "2": "#f5914d", "3": "#bd2126", "4": "#8cba52", "5": "#8cc4d6", "6": "#007a63", "7": "#705421", "8": "#69c4ad", "9": "#008000", "10": "#000080", "11": "#800080", "12": "#c0c0c0"};
// use a CQL parser for easy filter creation
var format = new OpenLayers.Format.CQL();
// this rule will get a filter from the CQL text in the form
var rule = new OpenLayers.Rule({
    // We could also set a filter here.  E.g. #ff0000 #ffcccc
    // filter: format.read("Taxon >= 'S' AND Taxon <= 'U'"),
    symbolizer: {
        fillColor: "#8CBA52",
        strokeColor: "#000000",
        fillOpacity: "0.9",
        strokeWidth: "1",
        graphicZIndex: "1",
        pointRadius: "4.0"
    }
});

var sources = {'USGS': {'url': "/mongo/db_find/ows/usgs_site/{'spec':{'status':'Active'}}/",
    'mapping': {'REF_NO': 'site_no', 'Sitename': 'station_nm', 'Status': 'status',
        'SiteType': 'site_tp_cd', 'lat': 'dec_lat_va', 'lon': 'dec_long_va',
        'aquifer': 'aquifer', 'huc_4': 'huc_4', 'huc_8': 'huc_8'}
},
    'MESONET': {'url': "/mongo/db_find/ows/mesonet_site/{'spec':{'status':'Active'}}",
        'mapping': {'REF_NO': 'stid', 'Sitename': 'name', 'Status': 'status',
            'SiteType': 'cdiv', 'lat': 'nlat', 'lon': 'elon',
            'aquifer': 'aquifer', 'huc_4': 'huc_4', 'huc_8': 'huc_8' }
    },
    'OWRB': {'url': "/mongo/db_find/ows/%s/{'spec':{'COUNTY':'%s'}}",
        'mapping': {'REF_NO': 'WELL_ID', 'Sitename': 'name', 'Status': 'status',
            'SiteType': 'USE_CLASS', 'lat': 'LATITUDE', 'lon': 'LONGITUDE',
            'aquifer': 'aquifer', 'huc_4': 'huc_4', 'huc_8': 'huc_8' }
    },
    'OWRBMW': {'url': "/mongo/db_find/ows/owrb_monitor_sites/{'spec':{'status':'Active'}}",
        'mapping': {'REF_NO': 'WELL_ID', 'Sitename': 'name', 'Status': 'status',
            'SiteType': 'PROJECT', 'lat': 'LATITUDE', 'lon': 'LONGITUDE',
            'aquifer': 'aquifer', 'huc_4': 'huc_4', 'huc_8': 'huc_8' }
    }
}
var filter = {'watershed': null, 'aquifer': null, 'type': null};
var cfilter = {'watershed': null, 'aquifer': null, 'type': null};
//on window load
$(window).load(function () {
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
    //ccbasemap = new OpenLayers.Layer.XYZ("ccbasemap", "http://129.15.41.144:8080/ccbasemap/${z}/${x}/${y}.png", { 'sphericalMercator' : true });
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
    //{ fillOpacity: 0.2, fillColor: "#F6358A", graphicZIndex: 1 }

    myStyles = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({ fillOpacity: 0.2, fillColor: "#F6358A", graphicZIndex: 2 },
                {rules:[
                    new OpenLayers.Rule({
                        //filter: new OpenLayers.Filter.Function({
                        //    evaluate:function(attributes){
                        //        return attributes.STYLE_TYPE=="watershed";
                        //    }

                        filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "STYLE_TYPE", // the "foo" feature attribute
                        value: "watershed"
                        }),
                        // if a feature matches the above filter, use this symbolizer
                        symbolizer: {
                            fillColor: "#4EB3D3",
                            fillOpacity:0.6,
                            strokeColor:"#084594"
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
                            fillOpacity:0.6,
                            strokeColor:"#4EB3D3"
                        }
                    })
                ]
                }),
        "highlight": new OpenLayers.Style({ fillOpacity: 0.5, fillColor: "#F6358A", graphicZIndex: 2 }),
        "select": {fillOpacity: 1, strokeColor: "white",fillColor:"#FDBF6F", graphicZIndex: 0}
    });
    myStyles1 = new OpenLayers.StyleMap({"default": new OpenLayers.Style(null, {rules: [rule]})});
    siteLayer = new OpenLayers.Layer.Vector("Sites", {styleMap: myStyles1});

    $("#totmsg").show().html("Loading . . .");
    load_sites(siteLayer, baseurl + sources['USGS'].url, 'USGS', sources['USGS'].mapping);
    //loaded geojson files
    /*$.getJSON(baseurl + "/catalog/db_find/ows/data/{'spec':{'data_provider':'OWRB'},'fields':['sources']}/", function (fdata) {
        $.each(fdata[0]['sources'], function (key, val) {
            $.each(val, function (key1, val1) {
                $('#idstate').append('<option value=' + val1.ows_url[0] + '>' + key + '-' + key1 + '</option>');
            });

        });
    });*/
    drawLayer = new OpenLayers.Layer.Vector("Draw Layer", {styleMap: myStyles, 'displayInLayerSwitcher': false});//    new OpenLayers.Style({ fillOpacity: 1, fillColor: "#F6358A", graphicZIndex: 2 })});
    filterLayer = new OpenLayers.Layer.Vector("Filter Layer", {styleMap: myStyles});
    map.addLayer(drawLayer);//[polygonLayer,circleLayer,boxLayer]);
    map.addLayer(filterLayer);
    map.addLayer(siteLayer);
    map.addControl(new OpenLayers.Control.MousePosition({emptyString: "Oklahoma Water Survey"}));
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.addControl(new OpenLayers.Control.ScaleLine());
    map.addControl(new OpenLayers.Control.OverviewMap());
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
    //selectFeature.activate();
}); //end window Load

$(document).ready(function () {
    //console.log('Map.js ready start')
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
        $("#helpAll").append('</br><b>Please click link below:</b></br></br><a href="http://static.cybercommons.org/OklahomaWaterSurvey/ows_manual.pdf" style="color:#2175A6;" target="_blank">Help and Instructions for Data Portal</a>');
    });

    $("#advSearch").collapse()

    $('#advSrchBtn').click(function () {
        $("#advSearch").dialog('open');
    });

    $("#advSearch").dialog({ autoOpen: false, title: "Advanced Search", height: 800, width: 800, position: [400, 100],
        buttons: [
            { text: "Close", class: "btn", click: function () {
                $(this).dialog("close");
            } },
            { text: "Reset", class: "btn", click: function () {
                clearadvForm();
            } },
            { text: "Search", class: "btn btn-success", click: function () {
                alert('doAdvSearch();');
                $(this).dialog("close");
            } }
        ]
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

    $("#searchState").click(function () {
        addlayer();
    });
    $("#search_aquifer").click(function () {
        siteLayer.styleMap = myStyles1
        var temp = $('#idaquifer option:selected').text().replace(/-/g, '');
        temp = temp.replace(/\s+/g, '');
        updateFilter("aquifer ='" + temp + "'");
        siteLayer.redraw();
        //drawAquiferFeature();
    });
    $("#show_aquifer").change(function () {
        display_aquifer();
    });
    $('#idaquifer').change(function () {
        display_aquifer();
    });
    $("#show_watershed").change(function () {
        display_watershed();
    });
    $('#idwatershed').change(function () {
        display_watershed();
    });
    $('#idfilter').dblclick(function () {
        type_filter('idfilter');
    });
    $('#mesofilter').dblclick(function () {
        type_filter('mesofilter');
    });
    $('#owrbfilter').dblclick(function () {
        type_filter('owrbfilter');
    });
    $('#owrbmw').dblclick(function () {
        type_filter('owrbmw');
    });

    $('#idwatershed').dblclick(function () {
        var temp = '';// $('#idwatershed option:selected').val();
        var wshed_filter = [];//'';
        $.each($('#idwatershed option:selected'), function (key, item) {
            temp = item.value
            if (temp.length == 4) {
                //wshed_filter=  "huc_4 ='" +temp +"'"
                wshed_filter.push("huc_4 ='" + temp + "'");
            } else {
                //wshed_filter=  "huc_8 ='" +temp +"'"
                wshed_filter.push("huc_8 ='" + temp + "'");
            }
        });
        filter.watershed = wshed_filter
        //<a onclick="addFilter("' + huc + '");" href="javascript:void(0);"> '+ oval +'</a>'
        cfilter.watershed = '<li>Watershed: (Click to Remove)<br><a style="margin-left:1px;" onclick="removeFilter(0);" href="javascript:void(0);">' + $.trim($('#idwatershed option:selected').text().replace('-', ''));
        +"</a></li>"
        apply_current();
        apply_filter();
    });
    $('#idaquifer').dblclick(function () {
        var aquifer_filter = [];
        $.each($('#idaquifer option:selected'), function (key, item) {
            // var temp = $('#idaquifer option:selected').text().replace(/-/g, '');
            var temp = $(this).text().replace(/-/g, '');
            temp = temp.replace(/\s+/g, '');
            aquifer_filter.push("aquifer ='" + temp + "'");//='';

        });
        //aquifer_filter=  "aquifer ='" +temp +"'"
        filter.aquifer = aquifer_filter
        //<a onclick="addFilter("' + huc + '");" href="javascript:void(0);"> '+ oval +'</a>'
        cfilter.aquifer = '<li >Aquifer: (Click to Remove)<br><a style="margin-left:1px;"  onclick="removeFilter(1);" href="javascript:void(0);">' + $.trim($('#idaquifer option:selected').text().replace('-', ''));
        +"</a></li>"
        apply_current();
        apply_filter();

    });
    $("#search_filter").click(function () {
        siteLayer.styleMap = myStyles1
        var filt = "Source = '" + $('#select_sites').val() + "'"
        if ($('#select_sites').val() == "MESONET") {
            if ($('#mesofilter').val() !== 'ALL') {
                if ($('#mesofilter').val() !== undefined) {
                    if ($('#mesofilter').val() !== null) {
                        filt = filt + " OR SiteType = '" + $('#mesofilter').val() + "'"
                    }
                }
            }
        } else {
            if ($('#idfilter').val() !== 'ALL') {
                if ($('#idfilter').val() !== undefined) {
                    if ($('#idfilter').val() !== null) {
                        filt = filt + " OR SiteType = '" + $('#idfilter').val() + "'"
                    }
                }
            }
        }
        if ($('#idaquifer').val() !== 'ALL') {
            if ($('#idaquifer').val() !== undefined) {
                if ($('#idaquifer').val() !== null) {
                    var temp = $('#idaquifer option:selected').text().replace(/-/g, '');
                    temp = temp.replace(/\s+/g, '');
                    if (filt === '') {
                        filt = "aquifer ='" + temp + "'";
                    } else {

                        filt = filt + ' OR ' + "aquifer ='" + temp + "'";
                    }
                }
            }
        }
        if ($('#idwatershed').val() !== 'ALL') {
            if ($('#idwatershed').val() !== undefined) {
                if ($('#idwatershed').val() !== null) {
                    var temp = $('#idwatershed option:selected').val();
                    var wshed_filter = '';
                    if (temp.length == 4) {
                        wshed_filter = "huc_4 ='" + temp + "'"
                    } else {
                        wshed_filter = "huc_8 ='" + temp + "'"
                    }
                    if (filt === '') {
                        filt = wshed_filter;
                    } else {

                        filt = filt + ' OR ' + wshed_filter;
                    }
                }
            }
        }
        //alert(filt)
        if (filt === '') {
            siteLayer.styleMap = siteStyles;
            siteLayer.redraw();
        } else {
            updateFilter(filt);
            siteLayer.redraw();
        }
    });
    $("#clear_filter").click(function () {
        siteLayer.styleMap = siteStyles;
        //rule.filter = None;
        siteLayer.redraw();
    });
    $("#searchText").click(function () {
        if ($("#txtsrch").val()) {
            searchText($("#txtsrch").val());
            $("#accordText").collapse('toggle');
        }
    });

    $("#txtsrch").keypress(function (event) {
        if (event.which == 13) {
            if ($("#txtsrch").val()) {
                searchText($("#txtsrch").val());
                $("#accordText").collapse('toggle');
            }
        }
    });

    // Fix login input element click problem
    $('.dropdown input, .dropdown label').click(function (e) {
        e.stopPropagation();
    });
//console.log('Map.js ready stop')
}); //end document ready
function apply_filter () {
    var filt = "Source = '" + $('#select_sites').val() + "'";
    var wsaq = '';//'',aq='',ty='';
    if (filter.watershed !== null && filter.aquifer !== null) {
        wsaq = filter.watershed.concat(filter.aquifer);
        wsaq = ' AND (' + wsaq.join(' OR ') + ')'
    } else {
        if (filter.watershed !== null) {
            wsaq = ' AND (' + filter.watershed.join(' OR ') + ')'
        }
        if (filter.aquifer !== null) {
            wsaq = ' AND (' + filter.aquifer.join(' OR ') + ')';
        }
    }
    if (filter.type !== null) {
        ty = ' AND (' + filter.type.join(' OR ') + ')'
    } else {
        ty = ''
    }
    filt = filt + wsaq + ty
    //var aq = filter.
    //for (var prop in filter){
    //   if (filter[prop] !==null ){
    //ddif(filt==''){
    //dd    filt=filter[prop]
    //dd}else{
    //       filt = filt + ' OR ' + filter[prop];

    //dd }
    //   }
    //}
    //var filt="Source = '" + $('#select_sites').val() + "' AND ( huc_4 ='1106' " + filt.replace("undefined","")  + ")";
    console.log(filt);
    //if (filt===''){
    //    siteLayer.styleMap = siteStyles;
    //    siteLayer.redraw();
    //}else{
    // alert(filt);
    updateFilter(filt);
    siteLayer.redraw();
    var siteTotal = 0;
    $.each(siteLayer.features, function (x, y) {
        if (y.getVisibility()) {
            siteTotal = siteTotal + 1;
        }
    });
    $("#totmsg").html("<table width='100%'><tr><td>Total Sites: <b>" + siteTotal +
        "</b></td><td style='text-align:right;'><a href='#' class='btn btn-info btn-mini' onclick='window.location.reload();'>Clear Selected</a></td></tr></table>");
    //}
}
function apply_current () {
    $('#currentFilt').empty();
    for (var prop in cfilter) {
        if (cfilter[prop] !== null) {
            $('#currentFilt').append(cfilter[prop]);
        }
    }
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
function type_filter (div) {
    var type_filter = [];//'';
    var temp = '';
    $.each($('#' + div + ' option:selected'), function (key, item) {
        temp = item.value.replace(/-/g, '');
        temp = temp.replace(/\s+/g, '');
        temp = temp.replace('(', '_');
        temp = temp.replace(')', '');
        type_filter.push("SiteType ='" + temp + "'");
    });
    //var temp = $('#' + div  + ' option:selected').val().replace(/-/g, '');
    //temp = temp.replace(/\s+/g, '');
    //temp= temp.replace('(','_')
    //temp= temp.replace(')','')
    //var type_filter='';
    //type_filter=  "SiteType ='" +temp +"'"
    filter.type = type_filter
    cfilter.type = '<li >Type: (Click to Remove)<br><a style="margin-left:1px;"  onclick="removeFilter(2);" href="javascript:void(0);">' + $.trim($('#' + div + ' option:selected').text());
    +"</a></li>"
    apply_current();
    apply_filter();
}


function load_sites (layer, url, source, mapping) {
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
        $.each(fdata, function (key, val) {
            sitesTotal.push(val);

            var point = new OpenLayers.Geometry.Point(val[mapping.lon], val[mapping.lat]);
            point = point.transform(options.displayProjection, options.projection);
            var pointFeature = new OpenLayers.Feature.Vector(point, null, null);
            var modtype = val[mapping.SiteType].replace(/-/g, '');//.site_tp_cd.replace(/-/g, '');
            modtype = modtype.replace(/\s+/g, '');
	        modtype = modtype.replace(/,/g, '');
            modtype = modtype.replace('(', '_')
            modtype = modtype.replace(')', '')
            var aqui = '';
            var huc4 = '';
            var huc8 = '';
            if (val[mapping.aquifer]) {
                aqui = val[mapping.aquifer].replace(/-/g, '');//.aquifer.replace(/-/g, '');
                aqui = aqui.replace(/\s+/g, '');
            }
            if (val[mapping.huc_4]) {
                huc4 = val[mapping.huc_4];
            }//.huc_4;}
            if (val[mapping.huc_8]) {
                huc8 = val[mapping.huc_8];
            }//.huc_8;}
            pointFeature.attributes = {"REF_NO": val[mapping.REF_NO], "Sitename": val[mapping.Sitename], "State": "OK", "Status": val[mapping.Status],
                "Source": source, "SiteType": modtype, 'lat': val[mapping.lat], 'lon': val[mapping.lon],
                'aquifer': aqui, 'huc_4': huc4, 'huc_8': huc8};
            //        console.log(pointFeature.attributes);
            layer.addFeatures(pointFeature);
            sitesActive.push(val[mapping.REF_NO]);

        }); //end each
        $("#totmsg").html("<table width='100%'><tr><td>Total Sites: <b>" + sitesTotal.length +
            "</b></td><td style='text-align:right;'><a href='#' class='btn btn-info btn-mini' onclick='window.location.reload();'>Clear Selected</a></td></tr></table>");
        $.unblockUI();
    }); //end getJSON
}
/*
function addFilter (source) {
    alert(source);
}
function display_aquifer () {
    if ($('#show_aquifer').attr('checked') ? true : false) {
        drawLayer.removeAllFeatures();
        $("#idaquifer option:selected").each(function () {
            var url = baseurl + "/mongo/db_find/ows/aquifers/{'spec':{'properties.NAME':'" + $(this).text() + "'}}"
            drawFeature(url);
        });
        //drawAquiferFeature();
    } else {
        drawLayer.removeAllFeatures();
    }
}
function display_watershed () {
    if ($('#show_watershed').attr('checked') ? true : false) {
        drawLayer.removeAllFeatures();
        $("#idwatershed option:selected").each(function () {
            var url = baseurl + '/mongo/db_find/ows/watersheds/{"spec":{"properties.HUC":"' + $(this).val() + '"}}'
            drawFeature(url);
        });
        //drawAquiferFeature();
    } else {
        drawLayer.removeAllFeatures();
    }
}*/
function updateFilter (fltr) {
    var filter;
    try {
        filter = format.read(fltr);
    } catch (err) {
        alert(err.message);
    }
    if (filter) {
        //alert("apply filter");
        //output.value = "";
        rule.filter = filter;
        siteLayer.redraw();
    }
    return false;
}
/*
 function drawAquiferFeature(){
 $("#idaquifer option:selected").each(function (){
 var url = baseurl + "/mongo/db_find/ows/aquifers/{'spec':{'properties.NAME':'" + $(this).text() + "'}}"
 drawFeature(url);
 });
 }
 function drawAquiferFeature(){
 $("#idaquifer option:selected").each(function (){
 var url = baseurl + "/mongo/db_find/ows/aquifers/{'spec':{'properties.NAME':'" + $(this).text() + "'}}"
 drawFeature(url);
 });
 }
 $('#idwatershed option').each( function(){ console.log(this.value)});

 */
function removeFeature (property, value) {
    filterLayer.removeFeatures(filterLayer.getFeaturesByAttribute(property, value))
    //console.log(drawLayer.getFeatureBy('data.' + property, value))
    //drawLayer.removeFeatures(drawLayer.getFeatureBy(property, value))
    /*var feature=null;
     $.each(drawLayer.features,function(){
     console.log(this.data[property]);
     console.log(value);
     if(this.data[property]==value){
     feature=this;
     }
     });
     console.log(feature)
     if(!feature==null){
     drawlayer.removeFeatures([feature])
     }*/
}
function resetFeatures (showFilter) {
    drawLayer.removeAllFeatures();
    //showFilter.prop('checked',!showFilter.prop('checked'))
    //showFilter.prop('checked',!showFilter.prop('checked'))

}
function showFeature (feature, showFilter) {
    //console.log('showfilter');
    console.log(feature);
    //if (showFilter.attr('checked') ? true : false) {
        var in_options = {'internalProjection': map.projection, 'externalProjection': map.projection};
        var geojson_format = new OpenLayers.Format.GeoJSON(in_options);
        var pre = '{"type": "FeatureCollection","features":'
        var geosjon_str = pre + JSON.stringify(feature) + '}'
        var features = geojson_format.read(geosjon_str, "FeatureCollection");
        if (features.constructor != Array) {
            features = [features];
        }
        filterLayer.addFeatures(features);
    //} else {
    //    filterLayer.removeAllFeatures();
    //}
}
function drawFeature (url) {
    var in_options = {'internalProjection': map.projection, 'externalProjection': map.projection};
    var geojson_format = new OpenLayers.Format.GeoJSON(in_options);
    drawLayer.removeAllFeatures();
    $.getJSON(url, function (fdata) {
        var pre = '{"type": "FeatureCollection","features":'
        var geosjon_str = pre + JSON.stringify(fdata) + '}'
        var features = geojson_format.read(geosjon_str, "FeatureCollection");
        if (features.constructor != Array) {
            features = [features];
        }
        drawLayer.addFeatures(features);
        /*
         watershed = $('#idwatershed option:selected').val();
         var info =[];
         $.each(drawLayer.features, function(key,f) {
         $.each(siteLayer.features, function(key,val) {
         if(val.geometry.intersects(f.geometry)) {
         info.push(val.attributes.REF_NO)
         }
         });
         });
         console.log(JSON.stringify({'HUC':watershed,'sites':info}));*/
    });

}
function addlayer () {

    geojson_layer = new OpenLayers.Layer.Vector($("#idstate option:selected").text(), {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
            url: $("#idstate").val()[0],
            format: new OpenLayers.Format.GeoJSON()
        })
    });
    map.addLayer(geojson_layer);
}
function clearadvForm () {
    $('#advSearch :checked').each(function () {
        this.checked = false;
    });
    $('#advSearch :selected').each(function () {
        this.selected = false;
    });
    $('#advSearch :text').each(function () {
        $(this).val('');
    });
};

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
    feature = evt.feature;
    //new OpenLayers.Size(600,200)  feature.geometry.getBounds().getCenterLonLat()
    content = "<b>" + feature.attributes.Sitename + "</b><table class='table-condensed' style='margin-bottom:5px;margin-right:10px;'>" +
        "<tr><th>ID</th><td>" + feature.attributes.REF_NO + "</td></tr>" +
        "<tr><th>Type</th><td>" + feature.attributes.SiteType + "</td></tr>" +
        "<tr><th>Status</th><td>" + feature.attributes.Status + "</td></tr>" +
        "<tr><td colspan='2'><a style='color:blue;' href='#' onclick='showbib(" + '"' + feature.attributes.REF_NO + '"' + ")'>Data Access</a></td></tr>" +
        "<tr><td colspan='2'><a style='color:blue;' href='http://maps.google.com/maps?z=15&t=k&q=loc:" + feature.attributes.lat + "," + feature.attributes.lon +
        "' target='_blank'>Google Maps</a></td></tr></table>"
    popup = new OpenLayers.Popup.FramedCloud("featurePopup", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(100, 100),
        content, null, true, onPopupClose);
    popup.panMapIfOutOfView = true;

    // popup.calculateRelativePosition = function () {
    //     return 'tr';
    // }
    popup.autoSize = true;
    feature.popup = popup;
    popup.feature = feature;
    mypop = popup;
    map.addPopup(popup, true);

    //var id = (feature.attributes.loc_id) ? feature.attributes.loc_id : '';
    //$("#mapinfo").html("<input type='hidden' id='sitesel' value='" + id + "'>" + id + " - " + feature.attributes.loc_name );
}
function onFeatureUnselect (evt) {
    feature = evt.feature;
    if (feature.popup) {
        popup.feature = null;
        map.removePopup(feature.popup);
        feature.popup.destroy();
        feature.popup = null;
    }
}

function onFeatureSelect (feature) {
    fff = feature
    //map.div.style.cursor='wait';
    //setcursor();
    //setTimeout("document.body.style.cursor = 'wait'", 1);
    if (feature.getVisibility()) {
        if (jQuery.inArray(feature.attributes.REF_NO, sitesSel) < 0) {
            sitesSel.push(feature.attributes.REF_NO);
            $("#sites tbody").append("<tr>" +
                "<td>" + feature.attributes.REF_NO + "</td>" +
                "<td><a style='color:#08C;' href='#' onclick='showbib(" + '"' + feature.attributes.REF_NO + '"' + ");'>" + feature.attributes.Sitename + "</a></td>" +
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
    //setTimeout("document.body.style.cursor = 'auto'", 1);
    //setcursor();
    // map.div.style.cursor='wait';
}
function executeFunctionWithCursor () {
    document.body.style.cursor = "wait";
    map.div.style.cursor = 'wait';
    setTimeout("doAdvSearch()", 1);
    setTimeout("document.body.style.cursor = 'auto';map.div.style.cursor='default';", 1);
}
function showbib (ref_no) {
    var source = $('#select_sites').val().split("_");
    if ($("#bibAll" + ref_no).length < 1) {
        $("body").append('<div id="bibAll' + ref_no + '"></div>');
        $("#bibAll" + ref_no).dialog({ height: 'auto', width: '900px', position: [300, 100], title: "<h3>Data</h3>", close: function () {
            $("#bibAll" + ref_no).remove();
        } });
        //$("#bibAll"+ref_no).append('<iframe id="iframe'+ref_no+'" src="http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no='+ref_no+'" width="100%" height="700"></iframe>');
        //$("#bibAll"+ref_no).load("/tools/usgs_metadata/"+ref_no);
        //$("#bibAll"+ref_no).append('<div data-fragment="/tools/usgs_metadata/'+ref_no+'"</div>');
        //fragment.render();
        if ($('#select_sites').val() == 'MESONET') {
            $("#bibAll" + ref_no).append('<iframe id="iframe' + ref_no + '" src="/tools/usgs_metadata/' + ref_no + '?source=MESONET" width="100%" height="700"></iframe>');
        } else if (source[0] == 'OWRB') {
            $("#bibAll" + ref_no).append('<iframe id="iframe' + ref_no + '" src="/tools/usgs_metadata/' + ref_no + '?source=OWRB" width="100%" height="700"></iframe>');
        } else if ($('#select_sites').val() == 'OWRBMW') {
            $("#bibAll" + ref_no).append('<iframe id="iframe' + ref_no + '" src="/tools/usgs_metadata/' + ref_no + '?source=OWRBMW" width="100%" height="700"></iframe>');
        } else {
            $("#bibAll" + ref_no).append('<iframe id="iframe' + ref_no + '" src="/tools/usgs_metadata/' + ref_no + '" width="100%" height="700"></iframe>');
        }
    }
}
function setcursor () {
    if ($('body').css('cursor') == 'auto') {
        map.div.style.cursor = 'wait';
        $('body').css('cursor', 'wait');
    } else {
        map.div.style.cursor = 'default';
        $('body').css('cursor', 'auto');
    }

}
function refreshAll () {
    //refreshAll total sites
    sitesActive = [], sitesSel = [];
    $("#totmsg").show().html("Re-Loading . . .");
    siteLayer.destroyFeatures();

    $.each(sitesTotal, function (key, val) {
        var point = new OpenLayers.Geometry.Point(val.midlon, val.midlat);
        point = point.transform(options.displayProjection, options.projection);
        var pointFeature = new OpenLayers.Feature.Vector(point, null, null);
        pointFeature.attributes = {"REF_NO": val.REF_NO, "Sitename": val.Sitename, "State": val.State, "Year": val.Year, "Area": val.Area_hectares, "Taxon": val.NO_Tot_Taxa};
        siteLayer.addFeatures(pointFeature);
        sitesActive.push(pointFeature.attributes);
    });

    $("#totmsg").html("<table width='100%'><tr><td>Total Sites: <b>" + sitesTotal.length + "</b></td><td style='text-align:right;'><a href='#' class='btn btn-info btn-mini' onclick='window.location.reload();'>Clear Selected</a></td></tr></table>");
}

function savesites () {
    saveselsites[selnum] = sitesSel;
    saveseldata[selnum] = $("#sites tbody").clone();
    var name = $("#selname").val();

    if (selnum == 1) {
        $("#selAccordion").prepend("<div id='all' class='alert alert-info' style='text-align:center;'><b>ALL:</b> &nbsp; <a href='#' onclick='viewall();'>List Floras</a> &bull;  <a href='#' onclick='highlightall();'>Map Selection</a> &bull; <a href='#' onclick='plotall();'>Species-area relationship</a><div id='showPlotAll'></div></div>");
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

function viewall () {
    $("#sites tbody").empty();
    var allsites = 0;
    for (i = 0; i <= saveselsites.length; i++) {
        $.each(siteLayer.features, function (key, val) {
            if (jQuery.inArray(val.attributes.REF_NO, saveselsites[i]) > -1) {
                allsites += 1;
                $("#sites tbody").append("<tr>" +
                    "<td>" + val.attributes.REF_NO + "</td>" +
                    "<td><a style='color:#08C;' href='#' onclick='showbib(" + '"' + parseInt(val.attributes.REF_NO) + '"' + ");'>" + val.attributes.Sitename + "</a></td>" +
                    "<td style='text-align:center;'>" + val.attributes.Year + "</td>" +
                    "<td style='text-align:right;'>" + val.attributes.Area + "</td>" +
                    "<td style='text-align:right;'>" + val.attributes.Taxon + "</td>" +
                    "</tr>"
                );
            }
        });
    }
    $("#seldivname").hide();
    $("#selinfo").dialog({ title: "ALL Selected Sites : " + allsites}).dialog('open');
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

function selzoom (i) {
    var lon = [], lat = [];
    $.each(sitesTotal, function (key, val) {
        if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
            lon.push(val.midlon);
            lat.push(val.midlat);
        }
    });
    var lonmax = Math.max.apply(null, lon);
    var latmax = Math.max.apply(null, lat);
    var lonmin = Math.min.apply(null, lon);
    var latmin = Math.min.apply(null, lat);

    bounds = new OpenLayers.Bounds();
    bounds.extend(new OpenLayers.LonLat(lonmax, latmax));
    bounds.extend(new OpenLayers.LonLat(lonmin, latmin));
    bounds.transform(options.displayProjection, options.projection);
    map.zoomToExtent(bounds);
    selhighlight(i);
}

function selextent (i) {

    bbStyle = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({ fillOpacity: 0.2, fillColor: "#8CBA52" })
    });
    var name = $("#bname" + i).html();
    var bboxLayer = new OpenLayers.Layer.Vector(name, {styleMap: bbStyle});

    var points = [] , lon = [], lat = [];
    $.getJSON('http://test.cybercommons.org/mongo/db_find/flora/data/{"fields":{"REF_NO":1,"Latitude_N_edge":1,"Latitude_S_edge":1,"Longitude_E_edge":1,"Longitude_W_edge":1} }?callback=?', function (fdata) {
        $.each(fdata, function (key, val) {
            if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
                lon.push(val.Longitude_W_edge);
                lon.push(val.Longitude_E_edge);
                lat.push(val.Latitude_S_edge);
                lat.push(val.Latitude_N_edge);
                var ppoints = [new OpenLayers.Geometry.Point(val.Longitude_W_edge, val.Latitude_S_edge),
                    new OpenLayers.Geometry.Point(val.Longitude_W_edge, val.Latitude_N_edge),
                    new OpenLayers.Geometry.Point(val.Longitude_E_edge, val.Latitude_N_edge),
                    new OpenLayers.Geometry.Point(val.Longitude_E_edge, val.Latitude_S_edge)];
                var ring = new OpenLayers.Geometry.LinearRing(ppoints);
                ring = ring.transform(options.displayProjection, options.projection);
                var polygon = new OpenLayers.Geometry.Polygon([ring]);
                var bbox = new OpenLayers.Feature.Vector(polygon, null, null);
                points.push(bbox);
            }
        });
        var lonmax = Math.max.apply(null, lon);
        var latmax = Math.max.apply(null, lat);
        var lonmin = Math.min.apply(null, lon);
        var latmin = Math.min.apply(null, lat);
        bounds = new OpenLayers.Bounds();
        bounds.extend(new OpenLayers.LonLat(lonmax, latmax));
        bounds.extend(new OpenLayers.LonLat(lonmin, latmin));
        bounds.transform(options.displayProjection, options.projection);
        map.zoomToExtent(bounds);
        selhighlight(i);
        bboxLayer.addFeatures(points);
        map.addLayer(bboxLayer);
    });
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

function IsNumeric (input) {
    return (input - 0) == input && input.length > 0;
}

function plotselData (i, x1, x2, y1, y2) {
    var psel = [];
    $.each(selplot_data, function (key, val) {
        if (((x1 <= val[0]) && (x2 >= val[0])) && ((y1 <= val[1]) && (y2 >= val[1]))) {
            psel.push(plotselDesc[key].REF_NO + " " + plotselDesc[key].Sitename);
        }
    });
    $.each(plot_data, function (key, val) {
        if (((x1 <= val[0]) && (x2 >= val[0])) && ((y1 <= val[1]) && (y2 >= val[1]))) {
            if (jQuery.inArray(plotDesc[key].REF_NO + " " + plotDesc[key].Sitename, psel) < 0) {
                psel.push(plotDesc[key].REF_NO + " " + plotDesc[key].Sitename);
            }
        }
    });

    $("body").append('<div id="selplotData' + i + '"></div>');
    $("#selplotData" + i).dialog({ height: 200, width: 500, title: "Plot selection", close: function () {
        $("#selplotData" + i).remove();
    } });

    $.each(psel, function (key, val) {
        $("#selplotData" + i).append(val + "<br>");
    });

}

function selmodel (i) {
    $("body").append('\
		<div id="modeldata' + i + '">\
			<table id="model' + i + '" class="table table-striped table-bordered table-condensed">\
				<thead>\
					<tr class="ui-widget-header">\
						<th>REF NO</th>\
						<th>SITENAME</th>\
						<th style="text-align:right;">NUM SPECIES</th>\
						<th style="text-align:right;">CALCULATED SPECIES</th>\
					</tr>\
				</thead>\
				<tbody></tbody>\
			</table>\
		</div>');

    $.getJSON('http://fire.rccc.ou.edu/mongo/db_find/flora/model/{"fields":{"REF_NO":1,"Sitename":1,"NO_Species":1,"Est_NO_Species":1}}?callback=?', function (modeldata) {
        $.each(modeldata, function (key, val) {
            if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
                $("#model" + i + " tbody").append("<tr>" +
                    "<td>" + val.REF_NO + "</td>" +
                    "<td><a style='color:#08C;' href='#' onclick='showbib(" + '"' + parseInt(val.REF_NO) + '"' + ");'>" + val.Sitename + "</a></td>" +
                    "<td style='text-align:right;'>" + val.NO_Species + "</td>" +
                    "<td style='text-align:right;'>" + val.Est_NO_Species.toFixed(2) + "</td>" +
                    "</tr>"
                );
            }
        });
    });

    $("#modeldata" + i).dialog({ height: 500, width: 800, title: "Model Data - selected: " + saveselsites[i].length, close: function () {
        $("#modeldata" + i).remove();
    } });
}

function seldownld (i) {
    $("#selAccordion").append('<div id="downinfo' + i + '"></div>');
    $("#downinfo" + i).dialog({ height: 500, width: 850, title: "Download " + saveselsites[i].length + " sites", close: function () {
        $("#downinfo" + i).remove();
    } });
    $("#downinfo" + i).append('<br /><br /><b>Citations</b> &nbsp; (Use RIS for downloading to EndNote)<br /><br />');
    $("#downinfo" + i).append('<a style="color:#08C;" href="javascript:void(0);" onclick="download_post(\'ris\',' + String(i) + ');">RIS</a> &bull; ');
    $("#downinfo" + i).append('<a style="color:#08C;" href="javascript:void(0);" onclick="download_post(\'bibtex\',' + String(i) + ');">Bib Tex</a> <br/> ');
    $("#downinfo" + i).append('<br /><br /><b>Flora Data</b><br /><br />');
    $("#downinfo" + i).append('<a style="color:#08C;" href="javascript:void(0);" onclick="download_post(\'csv\',' + String(i) + ');">CSV</a> <br/> ');
}

function download_post (data_format, data_query) {
    if (data_format == 'csv') {
        var url = 'http://test.cybercommons.org/tools/get_datafile/';
        var querys = '{"spec":{"REF_NO":{"$in":[' + saveselsites[parseInt(data_query)] + ']}}}';
    } else {
        var url = 'http://test.cybercommons.org/tools/getbib/';
        var querys = '{"spec":{"label":{"$in":[' + saveselsites[parseInt(data_query)] + ']}}}';
    }
    var data = { format: data_format, query: querys}
    form_post(url, data);
}
//function download_post_data(data_format,data_query){
//    var url = 'http://test.cybercommons.org/tools/get_datafile/';
//    var querys = '{"spec":{"label":{"$in":['+saveselsites[parseInt(data_query)]+']}}}';
//    var data ={ format:data_format,query:querys}
//    form_post(url,data);
//}
function form_post (url, data) {
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", url);
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", data[key]);
            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
}
/*
 function searchState (sstates) {
 unHighlightAll();
 var sstates = sstates.join();
 $.each(siteLayer.features, function(key,val) {
 $.each(val.attributes.State, function(key2,val2) {
 val2='"'+val2+'"';
 if (sstates.indexOf(val2) > -1) {
 onFeatureSelect(val)
 selectControls.select.highlight(val);
 }
 });
 });

 }
 */
function searchText (txtsrch) {
    unHighlightAll();
    if (IsNumeric(txtsrch)) {
        $.each(siteLayer.features, function (key, val) {
            if (txtsrch == val.attributes.REF_NO) {
                onFeatureSelect(val)
                selectControls.select.highlight(val);
            }
        });
    } else {
        $.each(siteLayer.features, function (key, val) {
            if (val.attributes.Sitename.toLowerCase().indexOf(txtsrch.toLowerCase()) > -1) {
                onFeatureSelect(val)
                selectControls.select.highlight(val);
            }
        });
    }
}

/* End of map.js =========================== */
