/* ===================================================
 * map.js
 *  18 Dec 2012
 * ===================================================
 * Copyright (c) 2012 University of Oklahoma
 *
 * console.log();
 * =================================================== */
//Version 
var verDate={"0":"0.01","1":"18 December 2012"};
//Declarations
var map, options, siteLayer, selectControls, siteStyles,drawLayer;
var lay_osm,glayers
var sitesTotal=[], sitesActive=[], sitesSel=[];
var baseurl = "http://test.cybercommons.org";
var selnum=0, saveselsites=[], saveseldata=[];
var plot_data=[], selplot_data=[], plotDesc=[], plotselDesc=[];
var savflg=0;
var qry='';
var enqry='';
var fff;
var stylesColor={"0":"#0000ff","1":"#b575b5","2":"#f5914d","3":"#bd2126","4":"#8cba52","5":"#8cc4d6","6":"#007a63","7":"#705421","8":"#69c4ad","9":"#008000","10":"#000080","11":"#800080","12":"#c0c0c0"};
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



//on window load
$(window).load(function() {

	options = {
		spericalMercator : true,
		projection : new OpenLayers.Projection("EPSG:900913"),
		maxResolution : 156543.0339,
		maxZoomLevels : 18,
                fractionalZoom: true,
		displayProjection : new OpenLayers.Projection("EPSG:4326"),
		units : "m",
		//maxExtent : new OpenLayers.Bounds([ -9803292.13,-5205054.49, 547896.95, 15497748.74 ])
                maxExtent : new OpenLayers.Bounds([ -19803292.13,-3405054.49, 547896.95, 15497748.74 ])
	}
	map = new OpenLayers.Map('map', options);
	//ccbasemap = new OpenLayers.Layer.XYZ("ccbasemap", "http://129.15.41.144:8080/ccbasemap/${z}/${x}/${y}.png", { 'sphericalMercator' : true });
        glayers= [
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
	center = center.transform(options.displayProjection,options.projection);
	map.setCenter(center, 7);
	
	map.zoomToMaxExtent= function(){
		map.setCenter(center, 7);	//re-center if globe clicked
    };

	siteStyles = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({ fillOpacity: 1, pointRadius: 3.5, strokeWidth: 1, fillColor: "#8CBA52", graphicZIndex: 1 }),
        "select": new OpenLayers.Style({ fillOpacity: 1, fillColor: "#F6358A", graphicZIndex: 2 })
    });
        myStyles = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({ fillOpacity: 1, fillColor: "#F6358A", graphicZIndex: 2 })
    });
    myStyles1 = new OpenLayers.StyleMap({"default": new OpenLayers.Style(null, {rules: [rule]})});
    siteLayer = new OpenLayers.Layer.Vector("USGS Active Sites", {styleMap: myStyles1});

	$("#totmsg").show() .html("Loading . . .");
	var st=[];
	$.getJSON(baseurl + "/mongo/db_find/ows/usgs_site/{'spec':{'status':'Active'}}/", function(fdata) {
		$.each(fdata, function(key,val) {
			sitesTotal.push(val);
			
			var point = new OpenLayers.Geometry.Point(val.dec_long_va, val.dec_lat_va);
			point = point.transform(options.displayProjection,options.projection);
			var pointFeature = new OpenLayers.Feature.Vector(point, null, null);
                        var modtype = val.site_tp_cd.replace(/-/g, ''); 
                        var aqui='';
                        var huc4='';
                        var huc8='';
                        if(val.aquifer){
                         aqui = val.aquifer.replace(/-/g, '');
                         aqui=aqui.replace(/\s+/g, '');
                        }
                        if(val.huc_4){ huc4=val.huc_4;}
                        if(val.huc_8){ huc8=val.huc_8;}
			pointFeature.attributes = {"REF_NO": val.site_no, "Sitename": val.station_nm, "State": "OK", "Year": val.status, "Area": val.agency_cd, "Taxon":modtype,'lat':val.dec_lat_va,'lon':val.dec_long_va,'aquifer':aqui,'huc_4':huc4,'huc_8':huc8};//al.aquifer};
			siteLayer.addFeatures(pointFeature);
			sitesActive.push(val.site_no);
			
			//$.each({"state":"OK"}, function(skey,sval) {
			//	if (sval && $.inArray(sval, st)===-1) {
			//		st.push(sval);
			//	}
			//});
			
		}); //end each
				
		
		$("#totmsg").html("<table width='100%'><tr><td>Total Sites: <b>"+sitesTotal.length+"</b></td><td style='text-align:right;'><a href='#' class='btn btn-info btn-mini' onclick='window.location.reload();'>Clear Selected</a></td></tr></table>");

	}); //end getJSON
         $.getJSON(baseurl + "/catalog/db_find/ows/data/{'spec':{'data_provider':'OWRB'},'fields':['sources']}/", function(fdata) {
            $.each(fdata[0]['sources'], function(key,val) {
                $.each(val,function (key1,val1){
                    $('#idstate').append('<option value='+val1.ows_url[0]+'>'+key + '-' + key1 +'</option>');
                });

            });
        });
        //set the select with Aquifer Names
        $.getJSON(baseurl +"/mongo/distinct/ows/aquifers/properties.NAME/{}/", function(fdata){
            fdata.sort();
            $.each(fdata, function(key,val) {
                $('#idaquifer').append('<option value='+ val + '>'+ val +'</option>');
            });


        });
        //Set the select with Sub Watershed
        $.getJSON(baseurl +"/mongo/distinct/ows/watersheds/properties.HUC/{}/", function(fdata){
            fdata.sort();
            var objdata;
            $.getJSON(baseurl +"/mongo/db_find/ows/watersheds/{'fields':['properties']}/", function(objdata){
                //console.log(odata);
                //objdata=odata;
                
            //});
                //console.log(objdata);
                $.each(fdata, function(key,val) {
                $.each(objdata, function(okey,oval) {
                    //console.log(val);
                    //console.log(oval);
                    if(val == oval.properties.HUC){
                        $('#idwatershed').append('<option value='+ oval.properties.HUC + '>'+ oval.properties.NAME +'</option>');
                    }
                });
                });
            });


        });

	map.addLayer( siteLayer );

	map.addControl( new OpenLayers.Control.MousePosition({emptyString:"Floras Explorer"} ) );
	map.addControl( new OpenLayers.Control.LayerSwitcher() );
	map.addControl( new OpenLayers.Control.ScaleLine() );
	map.addControl( new OpenLayers.Control.OverviewMap());
//"default": new OpenLayers.Style({ display: 'none' })	
	selStyle = new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({ display: 'none' })
        });	
        //selStyle1 =new OpenLayers.Style({ fillOpacity: 1, fillColor: "#F6358A", graphicZIndex: 2 })
    drawLayer = new OpenLayers.Layer.Vector("Draw Layer", {styleMap: myStyles});//    new OpenLayers.Style({ fillOpacity: 1, fillColor: "#F6358A", graphicZIndex: 2 })});
    
    //var circleLayer =  new OpenLayers.Layer.Vector("Circle layer", {styleMap: selStyle});
    //var boxLayer =     new OpenLayers.Layer.Vector("Box layer", {styleMap: selStyle});
    map.addLayer(drawLayer);//[polygonLayer,circleLayer,boxLayer]);
    //polygonLayer
    selectControls = { polygon: new OpenLayers.Control.DrawFeature(drawLayer, OpenLayers.Handler.Polygon),
    				 circle:  new OpenLayers.Control.DrawFeature(drawLayer,  OpenLayers.Handler.RegularPolygon, { handlerOptions: { sides: 40 } }),
    				 box:     new OpenLayers.Control.DrawFeature(drawLayer,     OpenLayers.Handler.RegularPolygon, { handlerOptions: { sides: 4, irregular: true } }),
    				 select:  new OpenLayers.Control.SelectFeature( siteLayer, { toggle: true } )
    };
   siteLayer.events.on({
            'featureselected': onFeatureSelectNav,
            'featureunselected': onFeatureUnselect
        }); 
    for(var key in selectControls) {
        map.addControl(selectControls[key]);
        selectControls[key].events.register("featureadded", this, function (f) {
                //OpenLayers.Element.addClass(map.viewPortDiv, "olCursorWait");
                //map.div.style.cursor='wait';
    		$.each(siteLayer.features, function(key,val) {
    			if(val.geometry.intersects(f.feature.geometry)) {
    				onFeatureSelect(val);
    				selectControls.select.highlight(val);
    			}
    		});
               // map.div.style.cursor='default';
               // OpenLayers.Element.removeClass(map.viewPortDiv, "olCursorWait");
        }); 
    }
    
	document.getElementById("noneToggle").checked=true;
	selectControls.select.activate();
   
}); //end window Load

$(document).ready( function() {

	$("#map").resizable();

	$('#about').click(function(){
		$("body").append('<div id="aboutAll"></div>');
		$("#aboutAll").dialog({ height:700, width:850, title: "<h3>Oklahoma Water Survey Data Portal</h3><h4>Version: "+verDate[0]+"</h4><h5>"+verDate[1]+"</h5>", close: function() { $("#aboutAll").remove(); } });
		$('#aboutAll').load('about.html');
    });
	
	$('#contact').click(function(){
		$("body").append('<div id="contactAll"></div>');
		$("#contactAll").dialog({ height:500, width:850, title: "<h3>Oklahoma Water Survey Data Portal Contact</h3><h4>Version: "+verDate[0]+"</h4><h5>"+verDate[1]+"</h5>", close: function() { $("#contactAll").remove(); } });
		$("#contactAll").load('contact.html');
                //$("#contactAll").load('contact.html');
	});
	
	$('#help').click(function(){
		$("body").append('<div id="helpAll"></div>');
		$("#helpAll").dialog({ height:500, width:850, title: "<h3>How To Use Data Portal</h3><h4>Version: "+verDate[0]+"</h4><h5>"+verDate[1]+"</h5>", close: function() { $("#helpAll").remove(); } });
            $("#helpAll").append('</br><b>Please click link below:</b></br></br><a href="http://static.cybercommons.org/OklahomaWaterSurvey/ows_manual.pdf" style="color:#2175A6;" target="_blank">Help and Instructions for Data Portal</a>');
	});
	
	$("#advSearch").collapse()
	
	$('#advSrchBtn').click(function(){
		$("#advSearch").dialog('open');
	});

	$("#advSearch").dialog({ autoOpen:false, title: "Advanced Search", height:800, width:800, position: [400,100],
		 buttons: [
		           { text: "Close", class: "btn", click: function() { $(this).dialog("close"); } },
		           { text: "Reset", class: "btn", click: function() { clearadvForm(); } },
		           { text: "Search",  class: "btn btn-success", click: function() { alert('doAdvSearch();'); $(this).dialog("close"); } } ] 
	});

	$("#selinfo").dialog({ autoOpen:false, height:500, width:800, position: [40,50],
		close: function() { closesites(); },
		buttons: [{ text: "Close", class: "btn", click: function() { $(this).dialog("close"); } },
		          { text: "Save",  class: "btn btn-success", click: function() { savesites(); $(this).dialog("close"); } } ] 
	});
	
	$("#searchState").click(function() {
    	//var selStates = $("#idstate").val() || [];   	
    	//var sstates=[];
    	//if (selStates != "") {
	//    	$.each(selStates, function(key, value) {
	//    		sstates.push('"'+value+'"');
	//    	});
	//    	searchState (sstates);
	//    	$("#accordState").collapse('toggle');
    	//}
        addlayer();
	});
        $("#search_aquifer").click(function() {
            siteLayer.styleMap = myStyles1
            var temp = $('#idaquifer option:selected').text().replace(/-/g, '');
            temp = temp.replace(/\s+/g, '');
            updateFilter("aquifer ='" +temp +"'");
            siteLayer.redraw();
            //drawAquiferFeature();
        });
        $("#show_aquifer").change(function() {
            display_aquifer();
        });
        $('#idaquifer').change(function(){
            display_aquifer();
        });
        $("#show_watershed").change(function() {
            display_watershed();
        });
        $('#idwatershed').change(function(){
            display_watershed();
        });
        $("#search_filter").click(function(){
            siteLayer.styleMap = myStyles1
            var filt = ''
            if($('#idfilter').val()!=='ALL'){
                if($('#idfilter').val()!== undefined){
                    if($('#idfilter').val()!== null){
                        filt = "Taxon = '" + $('#idfilter').val() +"'"
                    }
                }               
            }
            if($('#idaquifer').val()!=='ALL'){
                if( $('#idaquifer').val()!==undefined ){
                    if ( $('#idaquifer').val()!==null ){
                        var temp = $('#idaquifer option:selected').text().replace(/-/g, '');
                        temp = temp.replace(/\s+/g, '');
                        if(filt===''){
                            filt = "aquifer ='" +temp +"'";
                        }else{

                            filt=filt + ' AND ' + "aquifer ='" +temp +"'";
                        }
                    }
                }
            }
            if($('#idwatershed').val()!=='ALL'){
                if( $('#idwatershed').val()!==undefined ){
                    if ( $('#idwatershed').val()!==null ){
                        var temp = $('#idwatershed option:selected').val();
                        var wshed_filter='';
                        if (temp.length == 4){
                            wshed_filter=  "huc_4 ='" +temp +"'"
                        }else{
                            wshed_filter=  "huc_8 ='" +temp +"'"
                        }
                        if(filt===''){
                            filt = wshed_filter;
                        }else{

                            filt=filt + ' AND ' + wshed_filter;
                        }
                    }
                }
            }
            //alert(filt)
            if (filt===''){
                siteLayer.styleMap = siteStyles;
                siteLayer.redraw();
            }else{
                updateFilter(filt);
                siteLayer.redraw();
            }
        });
        $("#clear_filter").click(function(){
            siteLayer.styleMap = siteStyles;
            //rule.filter = None;
            siteLayer.redraw();
        });
	$("#searchText").click(function() {
		if ( $("#txtsrch").val() ) {
			searchText($("#txtsrch").val());
			$("#accordText").collapse('toggle');
		}
	});

	$("#txtsrch").keypress(function(event) {
		  if ( event.which == 13 ) {
				if ( $("#txtsrch").val() ) {
					searchText($("#txtsrch").val());
					$("#accordText").collapse('toggle');
				}
		   }
	});

	// Fix login input element click problem
	$('.dropdown input, .dropdown label').click(function(e) {
		e.stopPropagation();
	});

}); //end document ready
function display_aquifer(){
   if($('#show_aquifer').attr('checked')?true:false){
        drawLayer.removeAllFeatures();
        $("#idaquifer option:selected").each(function (){
            var url = baseurl + "/mongo/db_find/ows/aquifers/{'spec':{'properties.NAME':'" + $(this).text() + "'}}"
            drawFeature(url);
        });
        //drawAquiferFeature();
   }else{
        drawLayer.removeAllFeatures();
   }
}
function display_watershed(){
   if($('#show_watershed').attr('checked')?true:false){
        drawLayer.removeAllFeatures();
        $("#idwatershed option:selected").each(function (){
            var url = baseurl + '/mongo/db_find/ows/watersheds/{"spec":{"properties.HUC":"' + $(this).val() + '"}}'
            drawFeature(url);
        });
        //drawAquiferFeature();
   }else{
        drawLayer.removeAllFeatures();
   }
}
function updateFilter(fltr) {
    var filter;
    try {
        filter = format.read(fltr);
    } catch (err) {
        alert(err.message);
    }
    if (filter) {
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
function drawFeature(url){
    var in_options = {'internalProjection': map.projection,'externalProjection': map.projection};
    var geojson_format = new OpenLayers.Format.GeoJSON(in_options);
    drawLayer.removeAllFeatures();
    $.getJSON(url, function(fdata) {
            var pre='{"type": "FeatureCollection","features":'
            var geosjon_str = pre + JSON.stringify(fdata) + '}'
            var features = geojson_format.read(geosjon_str, "FeatureCollection");
            if(features.constructor != Array) {
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
function addlayer(){
    
    geojson_layer = new OpenLayers.Layer.Vector( $("#idstate option:selected").text() , {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: $("#idstate").val()[0],
                format: new OpenLayers.Format.GeoJSON()
            })
        });
    map.addLayer(geojson_layer);
}
function clearadvForm() {
	$('#advSearch :checked').each(function() {
		this.checked = false;
	});
	$('#advSearch :selected').each(function() {
		this.selected = false;
	});
	$('#advSearch :text').each(function() {
		$(this).val('');
	});
};

function toggleControl(element) {
    for(key in selectControls) {
        var control = selectControls[key];
        if(element.value == key && element.checked) {
            control.activate();
        } else {
            control.deactivate();
        }
    }
    drawLayer.removeAllFeatures();
}
function onPopupClose(evt) {
        // 'this' is the popup.
        var feature = this.feature;
        if (feature.layer) { // The feature is not destroyed
            selectControls.select.unselect(feature);
        } else { // After "moveend" or "refresh" events on POIs layer all 
             //     features have been destroyed by the Strategy.BBOX
            this.destroy();
        }
    }
function onFeatureSelectNav(evt) {
        feature = evt.feature;
        //new OpenLayers.Size(600,200)  feature.geometry.getBounds().getCenterLonLat()
        popup = new OpenLayers.Popup.FramedCloud("featurePopup", feature.geometry.getBounds().getCenterLonLat(),new OpenLayers.Size(100,100),
                "<b>"+feature.attributes.Sitename + "</b><table class='table-condensed' style='margin:5px;'>" +
                "<tr><th>ID</th><td>"+feature.attributes.REF_NO + "</td></tr>" +
                "<tr><th>Type</th><td>"+feature.attributes.Taxon + "</td></tr>" +
                "<tr><th>Status</th><td>"+feature.attributes.Year + "</td></tr>" +
                "<tr><td colspan='2'><a style='color:blue;' href='#' onclick='showbib("+'"'+feature.attributes.REF_NO+'"'+")'>Data Access</a></td></tr>" +
                "<tr><td colspan='2'><a style='color:blue;' href='http://maps.google.com/maps?z=15&t=k&q=loc:"+feature.attributes.lat+","+feature.attributes.lon+"' target='_blank'>Google Maps</a></td></tr></table>" ,
                null, true, onPopupClose);
        popup.panMapIfOutOfView = true;
        popup.autoSize = true;
        feature.popup = popup;
        popup.feature = feature;
        map.addPopup(popup, true);

        //var id = (feature.attributes.loc_id) ? feature.attributes.loc_id : '';
        //$("#mapinfo").html("<input type='hidden' id='sitesel' value='" + id + "'>" + id + " - " + feature.attributes.loc_name );
    }
    function onFeatureUnselect(evt) {
        feature = evt.feature;
        if (feature.popup) {
            popup.feature = null;
            map.removePopup(feature.popup);
            feature.popup.destroy();
            feature.popup = null;
        }
    }

function onFeatureSelect(feature) {
        fff=feature
        //map.div.style.cursor='wait';
        //setcursor();
        //setTimeout("document.body.style.cursor = 'wait'", 1);
    if(feature.getVisibility()){
	if (jQuery.inArray(feature.attributes.REF_NO, sitesSel) < 0) {
		sitesSel.push(feature.attributes.REF_NO);
		$( "#sites tbody" ).append( "<tr>" + 
				"<td>" + feature.attributes.REF_NO + "</td>" + 
				"<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+feature.attributes.REF_NO+'"'+");'>" + feature.attributes.Sitename + "</a></td>" +
				"<td style='text-align:center;'>" + feature.attributes.Year + "</td>" + 
				"<td style='text-align:right;'>" + feature.attributes.Area + "</td>" + 
				"<td style='text-align:right;'>" + feature.attributes.Taxon + "</td>" + 
				"</tr>"
		); 
		$("#selname").val("Selected Sites "+sitesSel.length);
		$("#selinfo").dialog({ title: "" }).dialog('open');
	}
        drawLayer.removeAllFeatures();
    }
        //setTimeout("document.body.style.cursor = 'auto'", 1);
        //setcursor();
       // map.div.style.cursor='wait';
}
function executeFunctionWithCursor(){
    document.body.style.cursor = "wait";
    map.div.style.cursor='wait';
    setTimeout("doAdvSearch()", 1);
    setTimeout("document.body.style.cursor = 'auto';map.div.style.cursor='default';", 1);
}
function showbib(ref_no) {
	if ($("#bibAll"+ref_no).length < 1) {
		$("body").append('<div id="bibAll'+ref_no+'"></div>');
		$("#bibAll"+ref_no).dialog({ height:'auto', width:'900px', position: [300,100], title: "<h3>Data</h3>", close: function() { $("#bibAll"+ref_no).remove(); } });
		//$("#bibAll"+ref_no).append('<iframe id="iframe'+ref_no+'" src="http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no='+ref_no+'" width="100%" height="700"></iframe>');
                $("#bibAll"+ref_no).append('<iframe id="iframe'+ref_no+'" src="/tools/usgs_metadata/'+ref_no+'" width="100%" height="700"></iframe>');
	}
}
function setcursor(){
    if ($('body').css('cursor') == 'auto'){
        map.div.style.cursor='wait';
        $('body').css('cursor', 'wait');
    }else{
        map.div.style.cursor='default';
        $('body').css('cursor', 'auto');
    }

}
function refreshAll() {
	//refreshAll total sites
	sitesActive=[], sitesSel=[];
	$("#totmsg").show() .html("Re-Loading . . .");
	siteLayer.destroyFeatures();
	
	$.each(sitesTotal, function(key,val) {
		var point = new OpenLayers.Geometry.Point(val.midlon, val.midlat);
		point = point.transform(options.displayProjection,options.projection);
		var pointFeature = new OpenLayers.Feature.Vector(point, null, null);
		pointFeature.attributes = {"REF_NO": val.REF_NO, "Sitename": val.Sitename, "State": val.State, "Year": val.Year, "Area": val.Area_hectares, "Taxon": val.NO_Tot_Taxa};
		siteLayer.addFeatures(pointFeature);
		sitesActive.push(pointFeature.attributes);
	}); 

	$("#totmsg").html("<table width='100%'><tr><td>Total Sites: <b>"+sitesTotal.length+"</b></td><td style='text-align:right;'><a href='#' class='btn btn-info btn-mini' onclick='window.location.reload();'>Clear Selected</a></td></tr></table>");
}

function savesites() {
	saveselsites[selnum]=sitesSel;
        saveseldata[selnum]=$("#sites tbody").clone();
	var name = $("#selname").val();
	
	if (selnum == 1) {
		$("#selAccordion").prepend("<div id='all' class='alert alert-info' style='text-align:center;'><b>ALL:</b> &nbsp; <a href='#' onclick='viewall();'>List Floras</a> &bull;  <a href='#' onclick='highlightall();'>Map Selection</a> &bull; <a href='#' onclick='plotall();'>Species-area relationship</a><div id='showPlotAll'></div></div>");
	}
	
	$("#selAccordion").append('\
			<div class="btn-toolbar">\
				<a class="close" data-dismiss="alert" onclick="closeSel('+selnum+');">x</a> \
				<div class="btn-group">\
					<button id="bname'+selnum+'" class="btn" style="color:'+stylesColor[selnum]+';width:140px;">'+name+'</button>\
						<button class="btn dropdown-toggle" data-toggle="dropdown">\
						<span class="caret"></span>\
					</button>\
					<ul class="dropdown-menu">\
						<li><a href="#" onclick="selview('+selnum+');">List Selection</a></li>\
						<li><a href="#" onclick="selhighlight('+selnum+');">Map Selection</a></li>\
						<li><a href="#" onclick="selplot('+selnum+');">Plot(Not implemented)</a></li>\
	    			</ul>\
	    		</div>\
			</div>');

	selnum += 1;
	savflg=1;
	unHighlightAll();
}	

function closesites() {
	if (savflg){
		//selected sites saved
		savflg=0;
		sitesSel=[];
		$("#sites tbody").empty();
	}else{
		//selected sites closed
		sitesSel=[];
		$("#sites tbody").empty();
		unHighlightAll();
	}
}	

function closeSel(i) {
	delete saveselsites[i];
	selnum -= 1;

	if (selnum == 1) {
		$("#all").hide();
	}
	if (selnum == 0) {
		saveselsites=[];
		unHighlightAll();
	}
}

function viewall() {
	$("#sites tbody").empty();
	var allsites=0;
	for (i=0;i<=saveselsites.length;i++) {
		$.each(siteLayer.features, function(key,val) {
			if (jQuery.inArray(val.attributes.REF_NO, saveselsites[i]) > -1) {
				allsites += 1;
				$( "#sites tbody" ).append( "<tr>" + 
						"<td>" + val.attributes.REF_NO + "</td>" + 
						"<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+parseInt(val.attributes.REF_NO)+'"'+");'>" + val.attributes.Sitename + "</a></td>" +
						"<td style='text-align:center;'>" + val.attributes.Year + "</td>" + 
						"<td style='text-align:right;'>" + val.attributes.Area + "</td>" + 
						"<td style='text-align:right;'>" + val.attributes.Taxon + "</td>" + 
						"</tr>"
				); 
			}
		});
	}
	$("#seldivname").hide();
	$("#selinfo").dialog({ title: "ALL Selected Sites : "+allsites}).dialog('open');
}

function selview(i) {
        //alert (saveselsites[i]);
        //alert(saveseldata[i]);
        //map.div.style.cursor  = 'wait'; 
	$("#sites tbody").empty();
        $("#sites").append(saveseldata[i]);
	//$.each(saveselsites[i], function(key,val) {
                /*
		var found=0;
                alert(val);
		$.each(siteLayer.features, function(key2,val2) {
			if (val===val2.attributes.REF_NO) {
				found=1;
                                alert('found');
				$( "#sites tbody" ).append( "<tr>" + 
						"<td>" + val2.attributes.REF_NO + "</td>" + 
						"<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+parseInt(val2.attributes.REF_NO)+'"'+");'>" + val2.attributes.Sitename + "</a></td>" +
						"<td style='text-align:center;'>" + val2.attributes.Year + "</td>" + 
						"<td style='text-align:right;'>" + val2.attributes.Area + "</td>" + 
						"<td style='text-align:right;'>" + val2.attributes.Taxon + "</td>" + 
						"</tr>"
				); 
			}
		});
		if (! found) {
                    alert('not found');*/
                    /*var durl ="http://test.cybercommons.org/mongo/db_find/flora/adv_search/{'spec':{'Label':"+parseInt(val)+"},'fields':['Label','ShortTitle','REF_NO','Sitename','Year','NO_Species','Area_hectares']}/?callback=?";
                    $.getJSON(durl, function(data) {
                        $.each(data, function(key3,val3) {
                            if (val3.REF_NO == null){
                            $( "#sites tbody" ).append( "<tr>" + 
                                          "<td>" + parseInt(val) + "</td>" + 
                                          "<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+parseInt(val)+'"'+");'>" + val3.ShortTitle + "</a></td>" +
                                          "<td style='text-align:center;'>" + val3.Year  + "</td>" +
                                          "<td style='text-align:right;'>N/A</td>" +
                                          "<td style='text-align:right;'>N/A</td>" +
                                          "</tr>"
                          );
                            }else{
                            $( "#sites tbody" ).append( "<tr>" +
                                          "<td>" + parseInt(val) + "</td>" +
                                          "<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+parseInt(val)+'"'+");'>" + val3.Sitename + "</a></td>" +
                                          "<td style='text-align:center;'>" + val3.Year  + "</td>" +
                                          "<td style='text-align:right;'>" + val3.Area_hectares + "</td>" +
                                          "<td style='text-align:right;'>" + val3.NO_Species +"</td>" +
                                          "</tr>"
                          );
                            }

                        });
                    });*/
	/*		$( "#sites tbody" ).append( "<tr>" + 
					"<td>" + val + "</td>" + 
					"<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+parseInt(val)+'"'+");'>" + val + "</a></td>" +
					"<td style='text-align:center;'>N/A</td>" + 
					"<td style='text-align:right;'>N/A</td>" + 
					"<td style='text-align:right;'>N/A</td>" + 
					"</tr>"
			);*/ 
		//}
	//});
	$("#seldivname").hide();
	$("#selinfo").dialog({ title: $("#bname"+i).html() }).dialog('open');
        //map.div.style.cursor  = 'default';
}

function highlightall() {
	unHighlightAll();
	for (i=0;i<=saveselsites.length;i++) {
		siteStyles.styles.select.defaultStyle.fillColor=stylesColor[i];
		$.each(siteLayer.features, function(key,val) {
			if (jQuery.inArray(val.attributes.REF_NO, saveselsites[i]) > -1) {
				selectControls.select.highlight(val);
			}
		});
	}
	siteStyles.styles.select.defaultStyle.fillColor="#F6358A";
}

function selhighlight(i) {
	unHighlightAll();
	siteStyles.styles.select.defaultStyle.fillColor=stylesColor[i];
	$.each(siteLayer.features, function(key,val) {
		if (jQuery.inArray(val.attributes.REF_NO, saveselsites[i]) > -1) {
			selectControls.select.highlight(val);
		}
	});
	siteStyles.styles.select.defaultStyle.fillColor="#F6358A";
}

function selzoom(i) {
	var lon=[], lat=[];
	$.each(sitesTotal, function(key,val) {
		if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
			lon.push(val.midlon);
			lat.push(val.midlat);
		}
	}); 
	var lonmax = Math.max.apply( null, lon );
	var latmax = Math.max.apply( null, lat );
	var lonmin = Math.min.apply( null, lon );
	var latmin = Math.min.apply( null, lat );

	bounds = new OpenLayers.Bounds();
	bounds.extend(new OpenLayers.LonLat(lonmax,latmax));
	bounds.extend(new OpenLayers.LonLat(lonmin,latmin));
	bounds.transform(options.displayProjection,options.projection);
	map.zoomToExtent(bounds);
	selhighlight(i);
}

function selextent(i) {

	bbStyle = new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({ fillOpacity: 0.2, fillColor: "#8CBA52" })
    });	
	var name=$("#bname"+i).html();
    var bboxLayer = new OpenLayers.Layer.Vector(name, {styleMap: bbStyle});

	var points=[] ,lon=[], lat=[];
	$.getJSON('http://test.cybercommons.org/mongo/db_find/flora/data/{"fields":{"REF_NO":1,"Latitude_N_edge":1,"Latitude_S_edge":1,"Longitude_E_edge":1,"Longitude_W_edge":1} }?callback=?', function(fdata) {
		$.each(fdata, function(key,val) {
			if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
				lon.push(val.Longitude_W_edge);
				lon.push(val.Longitude_E_edge);
				lat.push(val.Latitude_S_edge);
				lat.push(val.Latitude_N_edge);
				var ppoints = [new OpenLayers.Geometry.Point(val.Longitude_W_edge,val.Latitude_S_edge),
                               new OpenLayers.Geometry.Point(val.Longitude_W_edge,val.Latitude_N_edge),
                               new OpenLayers.Geometry.Point(val.Longitude_E_edge,val.Latitude_N_edge),
                               new OpenLayers.Geometry.Point(val.Longitude_E_edge,val.Latitude_S_edge)];
				var ring = new OpenLayers.Geometry.LinearRing(ppoints);
				ring = ring.transform(options.displayProjection,options.projection);
				var polygon = new OpenLayers.Geometry.Polygon([ring]);
				var bbox = new OpenLayers.Feature.Vector(polygon, null, null);
				points.push(bbox);
			}
		});
		var lonmax = Math.max.apply( null, lon );
		var latmax = Math.max.apply( null, lat );
		var lonmin = Math.min.apply( null, lon );
		var latmin = Math.min.apply( null, lat );
		bounds = new OpenLayers.Bounds();
		bounds.extend(new OpenLayers.LonLat(lonmax,latmax));
		bounds.extend(new OpenLayers.LonLat(lonmin,latmin));
		bounds.transform(options.displayProjection,options.projection);
		map.zoomToExtent(bounds);
		selhighlight(i);
		bboxLayer.addFeatures(points);
		map.addLayer(bboxLayer);
	});
}

function plotall() {
	plot_data=[], selplot_data=[], plotDesc=[], plotselDesc=[];
	$.each(sitesTotal, function(key, val) {
		var lh=Math.log(parseFloat(val.Area_hectares)) / Math.log(10);
		var ls=Math.log(parseFloat(val.NO_Species)) / Math.log(10);
		plotDesc.push(val);
		plot_data.push([ lh, ls ]);
		
		for (i=0;i<=saveselsites.length;i++) {
			if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
				plotselDesc.push(val);
				selplot_data.push([ lh, ls ]);
			}
		}
	});
	
	var plot_options={lines: { show: false }, points: { show: true }, grid:{hoverable: true}, selection: { mode: "xy" }, 
			yaxis : { show : true, axisLabel : 'log10(NO_Species)', position: 'left' },
			xaxis : { show : true, axisLabel : 'log10(area)'} };
	
	var d1 = {color: "#8CBA52", data: plot_data };			
	var d2 = {color: stylesColor[0], data: selplot_data };	
	
	$("#selAccordion").append('<div id="plotinfoAll"><div id="plotAll" style="width:800px; height:450px;"></div></div>');
	$("#plotinfoAll").dialog({ height:500, width:850, title: "Plot All Data - total: "+plot_data.length+"  selected: "+selplot_data.length, close: function() { $("#plotinfoAll").remove(); } });
	
    $("#plotAll").bind("plothover", function (event, pos, item) {
        if (item) {
        	$("#tooltip").remove();
        	var pinfo='';
        	if (item.seriesIndex==0) {
        		pinfo = "ID: "+plotDesc[item.dataIndex].REF_NO+"  "+plotDesc[item.dataIndex].Sitename;
        	}
        	if (item.seriesIndex==1) {
        		pinfo = "ID: "+plotselDesc[item.dataIndex].REF_NO+"  "+plotselDesc[item.dataIndex].Sitename;
        	}
        	showTooltip(item.pageX, item.pageY, pinfo);
        }else{
        	$("#tooltip").remove();
        }     
    });

    $("#plotAll").bind("plotselected", function (event, ranges) {
    	plotselData(i, ranges.xaxis.from, ranges.xaxis.to, ranges.yaxis.from, ranges.yaxis.to);
    });
    
	$.plot($("#plotAll"), [d1,d2], plot_options);
}

function selplot(i) {
	plot_data=[], selplot_data=[], plotDesc=[], plotselDesc=[];
	$.each(sitesTotal, function(key, val) {
		var lh=Math.log(parseFloat(val.Area_hectares)) / Math.log(10);
		var ls=Math.log(parseFloat(val.NO_Species)) / Math.log(10);
		plotDesc.push(val);
		plot_data.push([ lh, ls ]);
		
		if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
			plotselDesc.push(val);
			selplot_data.push([ lh, ls ]);
		}
	});

	var plot_options={lines: { show: false }, points: { show: true }, grid:{hoverable: true}, selection: { mode: "xy" }, 
			yaxis : { show : true, axisLabel : 'log10(NO_Species)', position: 'left' },
			xaxis : { show : true, axisLabel : 'log10(area)'} };
	
	var d1 = {color: "#8CBA52", data: plot_data };			
	var d2 = {color: stylesColor[i], data: selplot_data };	

	$("#selAccordion").append('<div id="plotinfo'+i+'"><div id="plot'+i+'" style="width:800px; height:450px;"></div></div>');
	$("#plotinfo"+i).dialog({ height:500, width:850, title: "Plot Data - total: "+plot_data.length+"  selected: "+selplot_data.length, close: function() { $("#plotinfo"+i).remove(); } });

    $("#plot"+i).bind("plothover", function (event, pos, item) {
        if (item) {
        	$("#tooltip").remove();
        	var pinfo='';
        	if (item.seriesIndex==0) {
        		pinfo = "ID: "+plotDesc[item.dataIndex].REF_NO+"  "+plotDesc[item.dataIndex].Sitename;
        	}
        	if (item.seriesIndex==1) {
        		pinfo = "ID: "+plotselDesc[item.dataIndex].REF_NO+"  "+plotselDesc[item.dataIndex].Sitename;
        	}
        	showTooltip(item.pageX, item.pageY, pinfo);
        }else{
        	$("#tooltip").remove();
        }     
    });

    $("#plot"+i).bind("plotselected", function (event, ranges) {
    	plotselData(i, ranges.xaxis.from, ranges.xaxis.to, ranges.yaxis.from, ranges.yaxis.to);
    });
    
	$.plot($("#plot"+i), [d1,d2], plot_options);
}

function showTooltip(x, y, contents) {
    $('<div id="tooltip" style="z-index:3000">' + contents + '</div>').css( {
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

function unHighlightAll() {
	$.each(siteLayer.features, function(key,val) {
		selectControls.select.unhighlight(val);
	});
}

function IsNumeric(input) {
	return (input - 0) == input && input.length > 0;
}

function plotselData(i, x1, x2, y1, y2) {
	var psel=[];
	$.each(selplot_data, function(key, val) { 
		if ( ((x1 <= val[0]) && (x2 >= val[0])) && ((y1 <= val[1]) && (y2 >= val[1])) ) {
			psel.push(plotselDesc[key].REF_NO+" "+plotselDesc[key].Sitename);
		}
	});
	$.each(plot_data, function(key, val) { 
		if ( ((x1 <= val[0]) && (x2 >= val[0])) && ((y1 <= val[1]) && (y2 >= val[1])) ) {
			if (jQuery.inArray(plotDesc[key].REF_NO+" "+plotDesc[key].Sitename, psel) < 0) {
				psel.push(plotDesc[key].REF_NO+" "+plotDesc[key].Sitename);
			}
		}
	});
	
	$("body").append('<div id="selplotData'+i+'"></div>');
	$("#selplotData"+i).dialog({ height:200, width:500, title: "Plot selection", close: function() { $("#selplotData"+i).remove(); } });

	$.each(psel, function(key, val) { 
		$("#selplotData"+i).append(val+"<br>");
	});

}

function selmodel(i) {
	$("body").append('\
		<div id="modeldata'+i+'">\
			<table id="model'+i+'" class="table table-striped table-bordered table-condensed">\
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
	
	$.getJSON('http://fire.rccc.ou.edu/mongo/db_find/flora/model/{"fields":{"REF_NO":1,"Sitename":1,"NO_Species":1,"Est_NO_Species":1}}?callback=?', function(modeldata) {
		$.each(modeldata, function(key, val) { 
			if (jQuery.inArray(val.REF_NO, saveselsites[i]) > -1) {
				$( "#model"+i+" tbody" ).append( "<tr>" + 
						"<td>" + val.REF_NO + "</td>" + 
						"<td><a style='color:#08C;' href='#' onclick='showbib("+'"'+parseInt(val.REF_NO)+'"'+");'>" + val.Sitename + "</a></td>" +
						"<td style='text-align:right;'>" + val.NO_Species + "</td>" +
						"<td style='text-align:right;'>" + val.Est_NO_Species.toFixed(2) + "</td>" +
						"</tr>"
				); 
			}
		});
	});
	
	$("#modeldata"+i).dialog({ height:500, width:800, title: "Model Data - selected: "+saveselsites[i].length, close: function() { $("#modeldata"+i).remove(); } });
}

function seldownld(i) {
	$("#selAccordion").append('<div id="downinfo'+i+'"></div>');
	$("#downinfo"+i).dialog({ height:500, width:850, title: "Download "+saveselsites[i].length+" sites", close: function() { $("#downinfo"+i).remove(); } });
	$("#downinfo"+i).append('<br /><br /><b>Citations</b> &nbsp; (Use RIS for downloading to EndNote)<br /><br />');
        $("#downinfo"+i).append('<a style="color:#08C;" href="javascript:void(0);" onclick="download_post(\'ris\',' + String(i) + ');">RIS</a> &bull; ');
        $("#downinfo"+i).append('<a style="color:#08C;" href="javascript:void(0);" onclick="download_post(\'bibtex\',' + String(i) + ');">Bib Tex</a> <br/> ');
	$("#downinfo"+i).append('<br /><br /><b>Flora Data</b><br /><br />');
        $("#downinfo"+i).append('<a style="color:#08C;" href="javascript:void(0);" onclick="download_post(\'csv\',' + String(i) + ');">CSV</a> <br/> ');
}

function download_post(data_format,data_query){
    if (data_format=='csv'){
        var url = 'http://test.cybercommons.org/tools/get_datafile/';
        var querys = '{"spec":{"REF_NO":{"$in":['+saveselsites[parseInt(data_query)]+']}}}';
    } else {
        var url = 'http://test.cybercommons.org/tools/getbib/';
        var querys = '{"spec":{"label":{"$in":['+saveselsites[parseInt(data_query)]+']}}}';
    }
    var data ={ format:data_format,query:querys}
    form_post(url,data);
}
//function download_post_data(data_format,data_query){
//    var url = 'http://test.cybercommons.org/tools/get_datafile/';
//    var querys = '{"spec":{"label":{"$in":['+saveselsites[parseInt(data_query)]+']}}}';
//    var data ={ format:data_format,query:querys}
//    form_post(url,data);
//}
function form_post(url,data){
    var form = document.createElement("form");
    form.setAttribute("method","post");
    form.setAttribute("action", url);
    for(var key in data) {
        if(data.hasOwnProperty(key)) {
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
		$.each(siteLayer.features, function(key,val) {
			if (txtsrch == val.attributes.REF_NO) {
				onFeatureSelect(val)
				selectControls.select.highlight(val);
			}
		});
	}else{
		$.each(siteLayer.features, function(key,val) {
			if (val.attributes.Sitename.toLowerCase().indexOf(txtsrch.toLowerCase()) > -1) {
				onFeatureSelect(val)
				selectControls.select.highlight(val);
			}
		});
	}
}

/* End of map.js =========================== */
