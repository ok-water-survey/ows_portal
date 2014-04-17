$(function () {
	$('#status').hide();
	$('#spinner').hide();
	$('.hide').hide();
	$("[rel=tooltip]").tooltip({ placement: 'right'});
	simpleCart({
		//Setting the Cart Columns for the sidebar cart display.
		cartColumns: [
			//"<a href='javascript:;' class='simpleCart_increment'><img src='/assets/images/increment.png' title='+1' alt='arrow up'/></a>" +
			//A custom cart column for putting the quantity and increment and decrement items in one div for easier styling.
			{ view: function (item, column) {
				return  "" + //"<span>"+item.get('quantity')+"</span>" +
					"<div>" +
					"<a href='javascript:;' class='simpleCart_decrement'><img src='/assets/images/Trash-can.png' title='-1' alt='arrow down'/></a>" +
					"</div>";
			}, attr: 'custom' },
			//Name of the item
			{ attr: "name", label: false },
			{attr: "parameter", label: false},
			//Subtotal of that row (quantity of that item * the price)
			// { view: 'currency', attr: "total" , label: false  },
			// { attr: "id" , label: false },
			{ attr: "query", label: false}
		],
		cartStyle: 'div',
		checkout: {
			type: "SendForm",
			url: "/tools/download/"
		}
	});
	simpleCart.bind("beforeAdd", function (item) {
		// return false if the item is in the cart,
		// so it won't be added again
		return !simpleCart.has(item);
	});
	simpleCart.bind("beforeCheckout", function (data) {
		//diable submit button
		$('.simpleCart_checkout').attr('disabled', 'disabled');
		if (simpleCart.quantity() <= 0) {
			alert("Data Cart is empty. Please add Data Items prior to submit.");
		} else {
			$('#status').show();
			$('#spinner').show();
			var cart_object = localStorage['simpleCart_items'];
			var opt = {'taskname': 'owsq.data.download.main_download.data_download', 'kwargs': {'data': cart_object}};
			calltask(opt);

		}
		$('.simpleCart_checkout').attr('disabled', '');
		//console.log(e);
		//console.log(v);
		//return e.preventDefault(); //.preventDefault;// .preventDefault;

		return false;
	});
	//simpleCart.bind( 'error' , function(message){
    //    alert( message );
	//});
	//$(".cartInfo").click(function(){
	//	$("#cartPopover").offset({ left: $(document).width() - 421, top: window.scrollY + 65});
	//});

	$("#header .cartInfo").toggle(function () {
		$('.item-query').hide();
		$("#cartPopover").show();
		$("#header .cartInfo").addClass('open');
		window.scrollBy(0, 1);
	}, function () {
		$("#cartPopover").hide();
		$("#header .cartInfo").removeClass('open');
	});
	simpleCart.bind('update', function () {
		$(".item-query").hide();
		$(".item-query").hide();
	});
	$(window).bind('storage', function (e) {
		simpleCart.load();
		$(".item-query").hide();
		$(".item-query").hide();
	});
	$(window).scroll(function () {

		$("#cartPopover").offset({ left: $(document).width() - 421, top: window.scrollY + 65});
	});
	$(window).resize(function () {

		$("#cartPopover").offset({ left: $(document).width() - 421, top: window.scrollY + 65});
	});
	$('#select_sites').change(function () {
		//siteLayer.styleMap = my
		set_layers();
		//siteLayer.styleMap =  myStyles1;
	});
	$('#subdata').change(function(){
		set_layers();
	})
	$('#county').change(function(){
		set_layers();
	})
	function set_layers(){

		var source, filt;
		if ($('#select_sites').val() == "WQP") {
			source = $('#subdata').val();
			filt = "Source = '" + source + "'";
			$('#subdata').show();
		} else {
			$('#subdata').hide();
			source = $('#select_sites').val()
			filt = "Source = '" + $('#select_sites').val() + "'";
		}
		if ($.inArray(source, loaded_sources) > -1) {
			updateFilter(filt);
			siteLayer.redraw();
		} else {
			if (source.split("_")[0] === 'OWRB') {
				source = $('#county').val().split("_")
				var myurl = baseurl + sources[source[0]].url;
				var part_url = myurl.split('%s');
				myurl = part_url[0] + 'owrb_well_logs' + part_url[1] + source[1] + part_url[2]
				load_sites(siteLayer, myurl, $('#county').val(), sources[source[0]].mapping);
			} else {
				console.log(sources[source].url)
				load_sites(siteLayer, baseurl + sources[source].url, source, sources[source].mapping);
			}
		}
		apply_filter();
		apply_current();

		if ($('#select_sites').val() == 'MESONET') {
			$('#label5').text('Climate Division');
			$('#type-title').text('Climate Division:');
			$('#usgs_type').hide();
			$('#mesonet_type').show();
			$('#owrb_type').hide();
			$('#owrbmw_type').hide();
		} else if ($('#select_sites').val() == 'USGS') {
			$('#label5').text('Site Type');
			$('#type-title').text('Site Type:');
			$('#usgs_type').show();
			$('#mesonet_type').hide();
			$('#owrb_type').hide();
			$('#owrbmw_type').hide();
		} else if (source[0] === 'OWRB') {
			$('#label5').text('Well Type');
			$('#type-title').text('Well Type:');
			$('#usgs_type').hide();
			$('#mesonet_type').hide();
			$('#owrb_type').hide();
			$('#owrbmw_type').show();
		} else if ($('#select_sites').val() == 'OWRBMW') {
			$('#label5').text('Groundwater Well Project');
			$('#type-title').text('Groundwater Well Project:');
			$('#usgs_type').hide();
			$('#mesonet_type').hide();
			$('#owrb_type').show();
			$('#owrbmw_type').hide();
		}
	}
	load_well_log_sites();

	$('#type-title').text('Site Type:');
	$('#usgs_type').show()
	//hide the rest
	$('#mesonet_type').hide();
	$('#owrb_type').hide();
	$('#owrbmw_type').hide();
	$('#county').hide();
	load_dash();
});
/*
 function load_welllog_types () {
 var url = baseurl + "/mongo/distinct/ows/owrb_well_logs/USE_CLASS/{}/";
 console.log('loading welllog_types');
 $.getJSON(url, function (fdata) {
 $.each(fdata.sort(), function (key, val) {
 $('#owrbfilter').append('<option value=' + val.replace(/\s+/g, '') + '>' + val + '</option>');

 });
 });
 }
 function load_owrbmw_types () {
 var url = baseurl + "/mongo/distinct/ows/owrb_monitor_sites/PROJECT/{}/"
 $.getJSON(url, function (fdata) {
 $.each(fdata.sort(), function (key, val) {
 $('#owrbmw').append('<option value=' + val.replace(/\s+/g, '').replace(/-/g, '') + '>' + val + '</option>');

 });
 });
 }*/
function load_well_log_sites () {
	var url = baseurl + "/mongo/distinct/ows/owrb_well_logs/COUNTY/{}/"

	$.getJSON(url, function (fdata) {
		$.each(fdata.sort(), function (key, val) {
			//console.log(val);
			//$('#select_sites').append('<option value="OWRB_' + val.replace(/\s+/g, '') + '">OWRB - Well Logs (' + val + ' County)</option>');
			$('#county').append('<option value="OWRB_' + val.replace(/\s+/g, '') + '">' + val + ' County</option>');
		});
	});

}
//Loads the OWS Watershed Dashboard tab
function load_dash () {
	var url = baseurl + "/catalog/db_find/ows/data/{'spec':{'data_provider':'Watersheds'}}"
	var i = 0;


//load date range
Date.prototype.yyyymmdd = function() {         
                                
        var yyyy = this.getFullYear().toString();                                    
        var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
        var dd  = this.getDate().toString();             
                            
        return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
   };  

d = new Date();
var myDate=new Date();
myDate.setDate(myDate.getDate()-14);
var todayDate = d.yyyymmdd();
var agoDate = myDate.yyyymmdd();

	$.getJSON(url, function (fdata) {
		try {
			$.each(fdata[0], function (key, val) {
				i = i + 1;
				subs = ''
				$.each(val.subs, function (skey, sval) {
					subs = subs + '<li><a class="basic" href="/dashboard/watershed.html?huc=' + skey + '&start=' + agoDate + '&end=' + todayDate +'" rel="/dashboard/images/wsimg/' + skey + '.jpg" title="' + sval + ' | HUC ' + skey + '" target="_blank">' + sval + '</a></li>'
				});
				if (i < 6) {
					$("#waterdash").append('<li>' + val.name + '<ul>' + subs + '</ul></li>');
				} else if (i < 10) {
					$("#waterdash2").append('<li>' + val.name + '<ul>' + subs + '</ul></li>');
				} else {
			//		$("#waterdash3").append('<script src = "/dashboard/cluetip/jquery.cluetip.js"></script><script src="/dashboard/cluetip/lib/jquery.hoverIntent.js"></script><script src="/dashboard/cluetip/demo/demo.js"></script><link rel="stylesheet" href="/dashboard/cluetip/jquery.cluetip.css" type="text/css" /><li>' + val.name + '<ul>' + subs + '</ul></li>');
			$("#waterdash3").append('<li>' + val.name + '<ul>' + subs + '</ul></li>');
	}
			});

		} catch (err) {
			var loaderr = 'error';
		}
	});
}
