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

		return false;
	});

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

	load_dash();
});
//Loads the OWS Watershed Dashboard tab
function load_dash () {
	var url = baseurl + "/catalog/db_find/ows/data/{'spec':{'data_provider':'Watersheds'}}"
	var i = 0;


	//load date range
	Date.prototype.yyyymmdd = function () {

		var yyyy = this.getFullYear().toString();
		var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
		var dd = this.getDate().toString();

		return yyyy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]);
	};

	d = new Date();
	var myDate = new Date();
	myDate.setDate(myDate.getDate() - 14);
	var todayDate = d.yyyymmdd();
	var agoDate = myDate.yyyymmdd();

	$.getJSON(url, function (fdata) {
		try {
			$.each(fdata[0], function (key, val) {
				i = i + 1;
				subs = ''
				$.each(val.subs, function (skey, sval) {
					subs = subs + '<li><a class="basic" href="/dashboard/watershed.html?huc=' + skey + '&start=' + agoDate + '&end=' + todayDate + '" rel="/dashboard/images/wsimg/' + skey + '.jpg" title="' + sval + ' | HUC ' + skey + '" target="_blank">' + sval + '</a></li>'
				});
				if (i < 6) {
					$("#waterdash").append('<li>' + val.name + '<ul>' + subs + '</ul></li>');
				} else if (i < 10) {
					$("#waterdash2").append('<li>' + val.name + '<ul>' + subs + '</ul></li>');
				} else {
					//$("#waterdash3").append('<script src = "/dashboard/cluetip/jquery.cluetip.js"></script><script src="/dashboard/cluetip/lib/jquery.hoverIntent.js"></script><script src="/dashboard/cluetip/demo/demo.js"></script><link rel="stylesheet" href="/dashboard/cluetip/jquery.cluetip.css" type="text/css" /><li>' + val.name + '<ul>' + subs + '</ul></li>');
					$("#waterdash3").append('<li>' + val.name + '<ul>' + subs + '</ul></li>');
				}
			});
		} catch (err) {
			var loaderr = 'error';
		}

$("#wshedscript").append('<script src = "/dashboard/cluetip/jquery.cluetip.js"></script><script src="/dashboard/cluetip/lib/jquery.hoverIntent.js"></script><script src="/dashboard/cluetip/demo/demo.js"></script><link rel="stylesheet" href="/dashboard/cluetip/jquery.cluetip.css" type="text/css" />');
	});
}
