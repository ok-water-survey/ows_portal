$(function() {
      $('#status').hide();
      $('#spinner').hide()
      simpleCart({
          //Setting the Cart Columns for the sidebar cart display.
          cartColumns: [
              //"<a href='javascript:;' class='simpleCart_increment'><img src='/assets/images/increment.png' title='+1' alt='arrow up'/></a>" +
              //A custom cart column for putting the quantity and increment and decrement items in one div for easier styling.
              { view: function(item, column){
                  return  "" + //"<span>"+item.get('quantity')+"</span>" +
                          "<div>" +
                              "<a href='javascript:;' class='simpleCart_decrement'><img src='/assets/images/Trash-can.png' title='-1' alt='arrow down'/></a>" +
                          "</div>";
              }, attr: 'custom' },
              //Name of the item
              { attr: "name" , label: false },
              {attr:"parameter",label:false},
              //Subtotal of that row (quantity of that item * the price)
             // { view: 'currency', attr: "total" , label: false  },
             // { attr: "id" , label: false },
              { attr:"query",label:false}
          ],
          cartStyle: 'div',
          checkout: {
                type: "SendForm" ,
                url: "http://test.oklahomawatersurvey.org/tools/download/"
            }
      });
  simpleCart.bind( "beforeAdd" , function( item ){
    // return false if the item is in the cart,
    // so it won't be added again
    return !simpleCart.has(item);
  });
  simpleCart.bind("beforeCheckout",function(data){
    //diable submit button
    $('.simpleCart_checkout').attr('disabled', 'disabled');
    if(simpleCart.quantity()<=0){
        alert("Data Cart is empty. Please add Data Items prior to submit."); 
    }else{
        $('#status').show();
        $('#spinner').show();
        var cart_object = localStorage['simpleCart_items'];
        var opt = {'taskname':'owsq.data.download.main_download.data_download','kwargs':{'data':cart_object}};
        calltask(opt);
    }
    $('.simpleCart_checkout').attr('disabled', '');
    return false;
  });
  $("#header .cartInfo").toggle(function(){
          $('.item-query').hide();
          $("#cartPopover").show();
          $("#header .cartInfo").addClass('open');
          window.scrollBy(0,1);
      }, function(){
          $("#cartPopover").hide();
          $("#header .cartInfo").removeClass('open');
      });
  simpleCart.bind( 'update' , function(){
      $(".item-query").hide();
      $(".item-query").hide();
      });
  $(window).bind('storage', function (e) {
      simpleCart.load();
      $(".item-query").hide();
      $(".item-query").hide();
    });
  $(window).scroll(function () {
      $("#cartPopover").offset({ left:$(document).width() -  421, top: window.scrollY + 65});
  });
  $(window).resize(function() {
      $("#cartPopover").offset({ left:$(document).width() -  421, top: window.scrollY + 65});
  });
  $('#select_sites').change(function() {
        var source = $('#select_sites').val().split("_");
        var filt = "Source = '" + $('#select_sites').val() + "'";
        removeFilter(2);
    if ($.inArray($('#select_sites').val(),loaded_sources)>-1){
        updateFilter(filt);
        siteLayer.redraw();
    }else{
        if (source[0]==='OWRB'){
            var myurl=baseurl + sources[source[0]].url;
            var part_url=myurl.split('%s');
            myurl = part_url[0] + 'owrb_well_logs' + part_url[1] + source[1] + part_url[2]
            load_sites(siteLayer,myurl,$('#select_sites').val(),sources[source[0]].mapping);
        }else{
            load_sites(siteLayer,baseurl + sources[$('#select_sites').val()].url,$('#select_sites').val(),sources[$('#select_sites').val()].mapping);
        }
        apply_current();
        apply_filter();
        //updateFilter(filt);
        //siteLayer.redraw();
    }
    if ($('#select_sites').val()=='MESONET'){
        $('#label5').text('Climate Division');
        $('#idfilter').hide();
        $('#mesofilter').show();
        $('#owrbfilter').hide();
        $('#owrbmw').hide();
    }else if ($('#select_sites').val()=='USGS'){
        $('#label5').text('Site Type');
        $('#idfilter').show();
        $('#mesofilter').hide();
        $('#owrbfilter').hide();
        $('#owrbmw').hide();
    }else if (source[0]==='OWRB'){
        $('#label5').text('Well Type');
        $('#idfilter').hide();
        $('#mesofilter').hide();
        $('#owrbfilter').show();
        $('#owrbmw').hide();
    }else if ($('#select_sites').val()=='OWRBMW'){
        $('#label5').text('Groundwater Well Project');
        $('#idfilter').hide();
        $('#mesofilter').hide();
        $('#owrbfilter').hide();
        $('#owrbmw').show();
    }   
  });
  load_welllog_types();
  load_owrbmw_types();
  load_well_log_sites();
  $('#accord3').hide();
  $('#mesofilter').hide();
  $('#owrbfilter').hide();
  $('#owrbmw').hide();
  load_dash();
});
function load_welllog_types(){
    var url = baseurl + "/mongo/distinct/ows/owrb_well_logs/USE_CLASS/{}/"
    $.getJSON(url, function(fdata) {
    $.each(fdata.sort(), function(key,val) {
        $('#owrbfilter').append('<option value='+ val.replace(/\s+/g, '') + '>'+ val  + '</option>');

    });
  });
}
function load_owrbmw_types(){
    var url = baseurl + "/mongo/distinct/ows/owrb_monitor_sites/PROJECT/{}/"
    $.getJSON(url, function(fdata) {
    $.each(fdata.sort(), function(key,val) {
        $('#owrbmw').append('<option value='+ val.replace(/\s+/g, '').replace(/-/g, '') + '>'+ val  + '</option>');

    });
  });
}
function load_well_log_sites(){
  var url = baseurl + "/mongo/distinct/ows/owrb_well_logs/COUNTY/{}/"
 
  $.getJSON(url, function(fdata) {
    $.each(fdata.sort(), function(key,val) {
        //console.log(val);
        $('#select_sites').append('<option value="OWRB_'+ val.replace(/\s+/g, '') + '">OWRB - Well Logs ('+ val  + ' County)</option>'); 

    });
  });

}
function load_dash(){
    var url = baseurl + "/catalog/db_find/ows/data/{'spec':{'data_provider':'Watersheds'}}"
    var i=0;
    $.getJSON(url, function(fdata) {
        try{
                $.each(fdata[0], function(key,val) {
                    i=i+1;
                    subs=''
                    $.each(val.subs, function(skey,sval) {
                        subs= subs + '<li><a href="/dashboard/watershed.html?huc=' + skey + '&day=14" target="_blank">' + sval + '</a></li>' 
                    });
                    if (i<6){
                    $("#waterdash").append('<li>'+ val.name + '<ul>' + subs + '</ul></li>');
                    }else if(i<10){
                    $("#waterdash2").append('<li>'+ val.name + '<ul>' + subs + '</ul></li>');
                    }else{
                    $("#waterdash3").append('<li>'+ val.name + '<ul>' + subs + '</ul></li>');
                    }
                });

        }catch(err){
            var err='error';
        }
    });
}
