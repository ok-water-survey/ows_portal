var MVC = {
	Models: {},
	Collections: {},
	Views: {},
	Templates: {}
}
var filter_source_parent={};
var setFilter = {
	set: function () {
		if (filter.source ==[]){
			filter.source=null;
		}
		if (filter.source !== null ) {
			var slist =[]
			$.each(filter.source, function(key,value){
				console.log(key);
				console.log(value);
				var temp = value.replace("Source = '",''); ///\s+/g, '');
				temp = temp.replace("'",'');
				//temp = temp.replace(/Source=/g,'');
				//temp = temp.replace(/'/g,'') + '_type';
				console.log(temp)
				temp = filter_source_parent[temp]
				temp = temp + '_type';
				console.log(temp)
				if (filter[temp] !== undefined && filter[temp] !== null){
					if (filter[temp].length == 0 ){//join(' OR ') == '' ){
						slist.push('(' + value + ')')
					}else{
						slist.push('(' + value + ' AND (' + filter[temp].join(' OR ') + ')' + ')')
					}
				}else{
					slist.push('(' + value + ')')
				}
			});
			filt = '(' + slist.join(' OR ') + ')'
			//filt = filt.replace(/AND ()/g,'');
		} else {
			//Set crazy source to let filter work and return None
			filt = "(Source = 'null_code')"
		}
		var wsaq = '';//'',aq='',ty='';
		var wsaq1 ='';
		var last_act ='';
		if (filter.watershed !== null && filter.aquifer !== null) {
			wsaq1 = filter.aquifer
			wsaq = filter.watershed.concat(filter.aquifer);
			wsaq = ' (' + wsaq.join(' OR ') + ')'
			wsaq1 = '(' + wsaq1.join(' OR ') + ')'
			wsaq1 = wsaq1.replace(/aquifer/g,'aquifers')
			wsaq = ' AND (' + wsaq + ' OR ' + wsaq1 + ')'
			//console.log(wsaq)
		} else {
			if (filter.watershed !== null) {
				wsaq = ' AND (' + filter.watershed.join(' OR ') + ')'
			}
			if (filter.aquifer !== null) {
				wsaq = ' (' + filter.aquifer.join(' OR ') + ')';
				wsaq1 = wsaq.replace(/aquifer/g,'aquifers')
				wsaq = ' AND (' + wsaq + ' OR ' + wsaq1 + ')'
			}
		}
		if (filter.last_activity !== null){
			last_act = " AND (last_activity >= '" + filter.last_activity + "')"
		}
		//if (filter.type !== null) {
		//	ty = ' AND (' + filter.type.join(' OR ') + ')'
		//} else {
		//	ty = ''
		//}
		filt = filt + wsaq  + last_act // + ty
		console.log(filt);
		updateFilter(filt);
		siteLayer.redraw();
	}
}
//****** Template Manager *************

var TemplateManager = {
	templates: {},
	get: function (id) {
		var result;
		var template = this.templates[id];
		if (template) {
			result = template;
		} else {
			var that = this;
			$.ajax({
				type: 'GET', async: false,
				url: "/catalog/db_find/ows-portal/data/{'spec':{'id':'" + id + "'}}/",
				success: function (template) {
					var $tmpl = _.template(template[0].template);
					that.templates[id] = $tmpl;
					result = $tmpl;
				}
			});
		}
		return result
	}
}
//****** GEO-JSON Manager *************
var GeojsonManager = {
	templates: {},
	get: function (id, type) {
		var result;
		var template = this.templates[id];
		if (template) {
			result = template;
		} else {
			var that = this;
			var qry, apptype;
			if (type == 'aquifer') {
				qry = "/mongo/db_find/ows/aquifers/{'spec':{'properties.NAME':'" + id + "'}}";
				styletype = 'aquifer'
			} else {
				qry = '/mongo/db_find/ows/watersheds/{"spec":{"properties.HUC":"' + id + '"}}'
				styletype = 'watershed'
			}
			$.ajax({
				type: 'GET', async: false,
				url: qry,
				success: function (template) {
					that.templates[id] = template;
					$.each(template, function (idx, val) {
						val.properties.STYLE_TYPE = styletype;
					});
					result = template;
				}
			});
		}
		return result
	}
}
//****** Models ***********************
MVC.Models.Source = Backbone.Model.extend({})
MVC.Models.Watershed = Backbone.Model.extend({})
MVC.Models.Aquifer = Backbone.Model.extend({})
MVC.Models.Data_filter = Backbone.Model.extend({})
MVC.Models.WQP = Backbone.Model.extend({})
MVC.Models.my_types = Backbone.Model.extend({})

//****** Collections ******************

MVC.Collections.Sources = Backbone.Collection.extend({
	model: MVC.Models.Source,
	url: "/catalog/db_find/ows-portal/data/{'spec':{'model':'Source'},'sort':[('order',1)]}/"
});
MVC.Collections.Watersheds = Backbone.Collection.extend({
	model: MVC.Models.Watershed,
	url: "/catalog/db_find/ows-portal/data/{'spec':{'model':'Watershed'},'sort':[('order',1)]}/"
});
MVC.Collections.Aquifers = Backbone.Collection.extend({
	model: MVC.Models.Aquifer,
	url: "/catalog/db_find/ows-portal/data/{'spec':{'model':'Aquifer'},'sort':[('type',-1),('class',1),('name',1)]}/"
});
MVC.Collections.Data_filters = Backbone.Collection.extend({
	model: MVC.Models.Data_filter,
	url: "/catalog/db_find/ows-portal/data/{'spec':{'model':'filter-types','status':'Active'},'sort':[('order',1)]}/"
});
MVC.Collections.WQPS = Backbone.Collection.extend({
	model: MVC.Models.WQP,
	url: "/mongo/group_by/ows/water_quality_sites/['OrganizationIdentifier','OrganizationFormalName']/StateCode/{}/",
	comparator: 'OrganizationFormalName'
});
MVC.Collections.my_types = Backbone.Collection.extend({
	initialize: function (models, options) {
		this.url = "";
	}
});
//****** Views ************************

//Source Views
MVC.Views.Sources = Backbone.View.extend({
	el: $('#datasource'),
	template: "Watershed_base",
	initialize: function () {
		this.template = TemplateManager.get(this.template);
		this.render();
		this.collection.bind("reset", this.render, this);
		this.collection.bind("add", this.addOne, this);
	},
	render: function () {
		$(this.el).html(this.template())
	},
	addAll: function () {
		this.collection.each(this.addOne);
	},
	addOne: function (model) {
		view = new MVC.Views.Source({ model: model });
		$("ul", this.el).append(view.render());
		view.afterRender();
	}

})

//Watershed Views
MVC.Views.Watersheds = Backbone.View.extend({
	el: $("#watershd"),
	template: "Watershed_base",
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template);
		//render
		this.render();
		//_.bindAll(this, "render", "addOne", "addAll");
		this.collection.bind("reset", this.render, this);
		this.collection.bind("add", this.addOne, this);
	},
	render: function () {
		$(this.el).html(this.template())//TemplateManager.get(this.template)())
		//this.addAll();
	},
	addAll: function () {
		this.collection.each(this.addOne);
	},
	addOne: function (model) {
		view = new MVC.Views.Watershed({ model: model });
		$("ul", this.el).append(view.render());
	}
})

//Aquifer Views
MVC.Views.Aquifers = Backbone.View.extend({
	el: $("#aquifers"),
	template: "Aquifer_base",
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template);
		//render
		this.render();
		//_.bindAll(this, "render", "addOne", "addAll");
		this.collection.bind("reset", this.render, this);
		this.collection.bind("add", this.addOne, this);
	},
	render: function () {
		$(this.el).html(this.template())//TemplateManager.get(this.template)())
		//this.addAll();
	},
	addAll: function () {
		this.collection.each(this.addOne);
	},
	addOne: function (model) {
		view = new MVC.Views.Aquifer({ model: model });
		result = view.render();
		$(result.position, this.el).append(result.template);
	}
})

//Source Filter View
MVC.Views.sourceFilters = Backbone.View.extend({
	//                               el: null, //$("#aquifers"),
	template: "Watershed_base",
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template);
		//render
		this.render();
		//_.bindAll(this, "render", "addOne", "addAll");
		this.collection.bind("reset", this.render, this);
		this.collection.bind("add", this.addOne, this);
	},
	render: function () {
		$('#usgs_type').html(this.template());//TemplateManager.get(this.template)())
		$('#mesonet_type').html(this.template());
		$('#owrb_type').html(this.template());
		$('#owrbmw_type').html(this.template());
		$('#wqp_type').html(this.template());
		$('#owrbmww_type').html(this.template());
		//add next
		//this.addAll();
	},
	addAll: function () {
		this.collection.each(this.addOne);
	},
	addOne: function (model) {
		view = new MVC.Views.sourceFilter({ model: model });
		result = view.render();
		$("ul", '#' + result.position).append(result.template);
	}
})

//Detail Views
MVC.Views.Source = Backbone.View.extend({
	tagName: "li",
	template: "Watershed_detail", //reused template
	sub_template: "Sub_detail",
	undolist: $("#sourceFilt"),
	oldmenu: '<ul class="nav "><li class="dropdown open"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Filter<b><span class="caret"></span></b></a>' +
		'<ul id="menu1" class="dropdown-menu" role="menu" aria-labelledby="drop4"><li role="presentation"><a role="menuitem" tabindex="-1" href="#">Action</a></li></ul>',
	undomenu1: '<div class="btn-group"><button class="btn btn-default btn-mini dropdown-toggle" style="margin-left:18px;" type="button" data-toggle="dropdown"><span class="icon-filter"></span>Filter &nbsp;<b class="caret"></b></button><ul class="dropdown-menu"></ul></div>',
	undoitem: '<li id="my_id_li" class="my_class_pli my_type"><span><i class="icon-remove-circle" rel="tooltip" title="my_full_name" id="blah"></i><a style="color:my_color;" class="my_id_li_clk" style="display:inline-block">my_name</a></span>undo_menu</li>',
	undomenu: '<div class="btn-group myfilts" style="margin-left:18px;"> <button class="btn btn-default btn-small my-btn-mini" id="btn_id_btnid" type="button"><span class="icon-filter"></span>Data Source Filters</button><div class="div_types" id="my_source_undo"></div></div>',
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template);
		this.sub_template = TemplateManager.get(this.sub_template);
		//_.bindAll(this, 'render', 'test');
		//////////this.model.bind('destroy', this.destroyItem, this);
		//this.model.bind('remove', this.removeItem, this);
	},
	afterRender: function () {
		var $addFilterdata = this.model.toJSON();
		//Hide subs
		if ('parent' in $addFilterdata) {
			$('.' + $addFilterdata.parent).hide();
		}
	},
	render: function () {
		var $addFilterdata = this.model.toJSON(); //data
		//Get color
		var $color = "#5258ba" //Default Color
		if ("color" in $addFilterdata) {
			$color = $addFilterdata.color
		}
		//set filter
		var $filt;
		$filt = "Source = '" + $addFilterdata.value + "'";
		//console.log($addFilterdata.sub)
		if ($addFilterdata.sub == true) {
			//$addFilterdata.name = ' - ' + $addFilterdata.name;
			//Set undo item in list then hide
			this.undoitem = this.undoitem.replace(/my_id/g, $addFilterdata.value);
			this.undoitem = this.undoitem.replace(/my_name/g, '&nbsp;' + $addFilterdata.name.split('(')[0]);
			this.undoitem = this.undoitem.replace(/my_full_name/g, '&nbsp;' + $addFilterdata.name);
			this.undoitem = this.undoitem.replace(/undo_menu/g, '')
			this.undoitem = this.undoitem.replace(/my_type/g, 'undo_sub')
			this.undoitem = this.undoitem.replace(/my_class/g, $addFilterdata.parent + 'ct')
			$addFilterdata.name = '&nbsp;&nbsp;' + $addFilterdata.name.split('(')[0];
			this.undoitem = this.undoitem.replace(/my_source/g,'');
			//$addFilterdata.name = $addFilterdata.name.split('(')[0];
			//Set template
			filter_source_parent[$addFilterdata.value] = $addFilterdata.parent
			//console.log(this.sub_template($addFilterdata))
			$(this.el).append(this.sub_template($addFilterdata));
			//$filt = "huc_8 = '" + $addFilterdata.huc_id + "'";

		} else {
			//$addFilterdata.name = '&nbsp;' + $addFilterdata.name.split('(')[0];
			//Set template
			$(this.el).append(this.template($addFilterdata));
			//Set undo item in list then hide
			this.undoitem = this.undoitem.replace(/my_id/g, $addFilterdata.value);
			this.undoitem = this.undoitem.replace(/my_name/g, $addFilterdata.name.split('(')[0]);
			this.undoitem = this.undoitem.replace(/my_full_name/g, $addFilterdata.name);
			this.undoitem = this.undoitem.replace(/undo_menu/g, this.undomenu)
			this.undoitem = this.undoitem.replace(/my_class/g, $addFilterdata.value)
			this.undoitem = this.undoitem.replace(/my_type/g, 'undo_main')
			this.undoitem = this.undoitem.replace(/my_source/g, $addFilterdata.value);
			//set divider
			//this.undoitem = this.undoitem + '<li class="divider"></li>'
			//$filt = "huc_4 = '" + $addFilterdata.huc_id + "'";
			filter_source_parent[$addFilterdata.value] = $addFilterdata.value
		}
		//Set link Color
		this.undoitem = this.undoitem.replace(/my_color/g, $color)
		this.undoitem = this.undoitem.replace(/btn_id/g, $addFilterdata.value)

		//Set undo item in list then hide
		//this.undoitem = this.undoitem.replace(/my_id/g, $addFilterdata.value);
		//this.undoitem = this.undoitem.replace(/my_name/g, $addFilterdata.name);
		var $undolist = this.undolist
		//console.log(this.undoitem)
		$undolist.append(this.undoitem);
		//$undolist.append(this.undomenu);
		var $undoitm = $('#' + $addFilterdata.value + '_li')
		//$undoitm.find("ul").append('<li><a href="#">Action</a></li>')
		var $undoitmclick = $('.' + $addFilterdata.value + '_li_clk')
		var $visible = false;

		//set Default page open datasets - USGS Active Sites as visible
		if ($addFilterdata.value == "USGS") {
			filter.source = []
			//Load data
			filter.source.push("Source = '" + $addFilterdata.value + "'")
			//load_sites (siteLayer, $addFilterdata.url,$addFilterdata.value ,$addFilterdata.mapping)
			$visible = true;
		} else {
			$undoitm.hide();
		}
		//Hide subs
		//if('parent' in $addFilterdata){
		//	$('.' + $addFilterdata.parent).hide();
		//}


		//Setup event Handle
		var $addFilterAction = this.$('.add_filter');
		var $filterButton = $('#' + $addFilterdata.value + '_btnid')

		//Click event handler
		$addFilterAction.click(function () {
			//console.log($addFilterdata.hassubs);
			if ($addFilterdata.hassubs) {
				if ($('.' + $addFilterdata.value).is(':visible')) {
					$('.' + $addFilterdata.value).hide();
				} else {
					$('.' + $addFilterdata.value).show();
				}
				//console.log('.' + $addFilterdata.value)
			} else {
				if ($addFilterdata.sub){
					var subparent = $('#' + $addFilterdata.parent + '_li');
					if(subparent.is(':hidden')){
						$visible = false;

					}
				}
				if (!$visible) {
					//console.log($addFilterdata.huc_id);
					if (filter.source == null) {
						filter.source = [];
					}
					filter.source.push($filt);
					filter.source = _.uniq(filter.source, JSON.stringify);
					if ($.inArray($addFilterdata.value, loaded_sources) > -1) {
						setFilter.set()
					} else {
						loaded_sources.push($addFilterdata.value)
						if ("color" in $addFilterdata) {
							color = $addFilterdata.color
						} else {
							color = "#5258ba"
						}
						load_sites(siteLayer, $addFilterdata.url, $addFilterdata.value, $addFilterdata.mapping, color)
						filter[$addFilterdata.value + '_type']=[];
						setFilter.set()
					}
					//Set the visible site total
					apply_current()
					//apply_filter();
					//Show close li on
					$undolist.show();
					$undoitm.show();
					$visible = true;
					if ($addFilterdata.sub) {
						$('.' + $addFilterdata.parent + '_pli').show()
						//$('.' + $addFilterdata.parent + '_pli .icon-remove-circle').hide()
					}

					//resetFeatures($showFilter)
					//if ($fdata == null) {
					//	$fdata = GeojsonManager.get($addFilterdata.huc_id, 'Watershed');
					//}
					//showFeature($fdata, $showFilter);
				}
			}
		});
		$undoitm.mouseover(function () {
			try {
				//console.log("Mouseover")
				selectFeature.select(filterLayer.getFeaturesByAttribute('Source', $addFilterdata.value)[0])
			} catch (err) {
				//Let Pass
			}

		});
		$undoitm.mouseout(function () {
			try {
				//console.log("mouseout")
				selectFeature.unselect(filterLayer.getFeaturesByAttribute('Source', $addFilterdata.value)[0])
			} catch (err) {
				//Let Pass
			}

		});

		$undoitmclick.click(function () {
			//console.log($('.' + $addFilterdata.parent + 'ct_pli:visible').length)
			//if ($addFilterdata.hassubs && $('.' + $addFilterdata.parent + 'ct_pli:visible').length > 0) {
			//	console.log('Nothing');
			//} else {
				if ($('#sourceFilt > li:visible').length == 1) {
					//console.log(filter.source);
					filter.source = null;
					//console.log(filter.source);
					$undolist.hide()
				} else {
					var index = filter.source.indexOf($filt);
					filter.source.splice(index, 1);
				}
				;
				if ($('.' + $addFilterdata.parent + 'ct_pli:visible').length == 1) {
					$('.' + $addFilterdata.parent + '_pli').hide()
					console.log($addFilterdata.parent)
				}
				//console.log($addFilterdata.hassubs)
				//console.log($addFilterdata.parent)
				if ($addFilterdata.hassubs){
					$('.' + $addFilterdata.value + 'ct_pli').hide();
				}
				$undoitm.hide();
				setFilter.set();
				apply_current()
				//apply_filter();
				$visible = false;
				//removeFeature('HUC', $addFilterdata.huc_id)
			//}

		});
		$filterButton.click(function () {
			console.log($addFilterdata.value)
			$('.TYPE_FILTER').hide();
			$('.' + $addFilterdata.value).show();
			$("#dialog-filter")
				.dialog('option','title', "<b>" + $addFilterdata.name + " Filter</b>")
				.dialog('open');
		});
		//$undoitmclick.click(function(){
		//	alert('hi');
		//})

		return $(this.el);
	}
})


MVC.Views.Watershed = Backbone.View.extend({
	tagName: "li",
	template: "Watershed_detail",
	undolist: $("#currentFilt_wshd"),
	undoitem: '<li id="my_id_li"><i class="icon-remove-circle" rel="tooltip" title="Remove Watershed" id="blah"></i><a style="display:inline-block">my_name</a></li>',
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template)
		//_.bindAll(this, 'render', 'test');
		this.model.bind('destroy', this.destroyItem, this);
		//this.model.bind('remove', this.removeItem, this);

	},
	render: function () {
		//console.log('render')
		//Render template inside our view
		var $addFilterdata = this.model.toJSON(); //data
		//Set watershed name
		var $filt;
		if ($addFilterdata.huc_id.length == 8) {
			$filt = "huc_8 = '" + $addFilterdata.huc_id + "'";
			$addFilterdata.name = '&nbsp;&nbsp; - ' + $addFilterdata.name;
		} else {
			$addFilterdata.name = '&nbsp;' + $addFilterdata.name;
			$filt = "huc_4 = '" + $addFilterdata.huc_id + "'";
		}
		//render
		$(this.el).append(this.template($addFilterdata));
		//Add events
		var $addFilterAction = this.$('.add_filter');
		this.undoitem = this.undoitem.replace(/my_id/g, $addFilterdata.huc_id);
		this.undoitem = this.undoitem.replace(/my_name/g, $addFilterdata.name);
		var $undolist = this.undolist
		$undolist.append(this.undoitem);
		var $undoitm = $('#' + $addFilterdata.huc_id + '_li').hide();
		var $visible = false;
		//geojson
		var $showFilter = $('.show_fltr');
		var $fdata = null
		$showFilter.click(function () {
			if ($visible) {
				if ($fdata == null) {
					$fdata = GeojsonManager.get($addFilterdata.huc_id, 'Watershed');
				}
				showFeature($fdata, $showFilter);
			}
		});
		$addFilterAction.click(function () {
			if (!$visible) {
				//console.log($addFilterdata.huc_id);
				if (filter.watershed == null) {
					filter.watershed = [];
				}
				filter.watershed.push($filt);
				filter.watershed = _.uniq(filter.watershed, JSON.stringify);
				//apply_filter();
				setFilter.set()
				apply_current()
				//Show close li on
				$undolist.show();
				$undoitm.show();
				$visible = true;
				//resetFeatures($showFilter)
				if ($fdata == null) {
					$fdata = GeojsonManager.get($addFilterdata.huc_id, 'Watershed');
				}
				showFeature($fdata, $showFilter);
			}else{

				$undoitm.trigger( "click" );
			}
		});
		$undoitm.mouseover(function () {
			try {
				selectFeature.select(filterLayer.getFeaturesByAttribute('HUC', $addFilterdata.huc_id)[0])
			} catch (err) {
				//Let Pass
			}

		});
		$undoitm.mouseout(function () {
			try {
				selectFeature.unselect(filterLayer.getFeaturesByAttribute('HUC', $addFilterdata.huc_id)[0])
			} catch (err) {
				//Let Pass
			}

		});

		$undoitm.click(function () {
			if ($('#currentFilt_wshd > li:visible').length == 1) {
				console.log(filter.watershed);
				filter.watershed = null;
				console.log(filter.watershed);
				$undolist.hide()
			} else {
				var index = filter.watershed.indexOf($filt);
				filter.watershed.splice(index, 1);
			}
			;
			$undoitm.hide();
			//apply_filter();
			setFilter.set();
			apply_current()
			$visible = false;
			removeFeature('HUC', $addFilterdata.huc_id)

		});
		return $(this.el) //$(this.el).append(this.template(this.model.toJSON())) ;
	}/*,
	 removeItem: function (model) {
	 console.log("Remove - " + model.get("Name"))
	 this.remove();
	 }*/
})
MVC.Views.Aquifer = Backbone.View.extend({
	tagName: "li",
	template: "Aquifer_detail",
	undolist: $("#currentFilt_aquifer"),
	undoitem: '<li id="my_id_li"><i class="icon-remove-circle" rel="tooltip" title="Remove Aquifer" id="blah"></i><a style="display:inline-block">my_name</a></li>',
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template)
		//_.bindAll(this, 'render', 'test');
		this.model.bind('destroy', this.destroyItem, this);
		//this.model.bind('remove', this.removeItem, this);
	},
	render: function () {
		//Render template inside our view
		var $addFilterdata = this.model.toJSON(); //data
		$addFilterdata.org_name = $addFilterdata.name
		//Set aquifer filter
		var $filt;
		$filt = "aquifer = '" + $addFilterdata.name.replace(/-/g, '').replace(/\s+/g, '') + "'";
		//set ul class
		var $ul;
		if ($addFilterdata.type == "Bedrock") {
			$ul = '.b'
		} else {
			$ul = '.a'
		}
		;
		if ($addFilterdata.class == "Minor") {
			$ul = $ul + 'minor'
		} else {
			$ul = $ul + 'major'
		}
		;
		$addFilterdata.name = '&nbsp;' + $addFilterdata.name;
		//render
		$(this.el).append(this.template($addFilterdata));
		//Add events
		var $addFilterAction = this.$('.add_filter');
		this.undoitem = this.undoitem.replace(/my_id/g, $addFilterdata.order.toString());
		this.undoitem = this.undoitem.replace(/my_name/g, $addFilterdata.name);
		var $undolist = this.undolist
		$undolist.append(this.undoitem);
		var $undoitm = $('#' + $addFilterdata.order.toString() + '_li').hide();
		var $visible = false;
		var $showFilter = $('.show_fltr');
		var $fdata = null;

		$showFilter.click(function () {
			if ($visible) {
				if ($fdata == null) {
					$fdata = GeojsonManager.get($addFilterdata.org_name, 'aquifer');
				}
				showFeature($fdata, $showFilter);
			}
		});
		$addFilterAction.click(function () {
			if (!$visible) {
				console.log($addFilterdata.name);
				if (filter.aquifer == null) {
					filter.aquifer = [];
				}
				filter.aquifer.push($filt);
				filter.aquifer = _.uniq(filter.aquifer, JSON.stringify);
				//apply_filter();
				setFilter.set();
				apply_current()
				//Show close li on
				$undolist.show();
				$undoitm.show();
				$visible = true;
				if ($fdata == null) {
					$fdata = GeojsonManager.get($addFilterdata.org_name, 'aquifer');
				}
				showFeature($fdata, $showFilter);
			}else{
				$undoitm.trigger( "click" );
			}
		});
		$undoitm.mouseover(function () {
			$.each(filterLayer.getFeaturesByAttribute('NAME', $addFilterdata.org_name), function (idx, val) {
				selectFeature.select(val);
			});
			//selectFeature.select(filterLayer.getFeaturesByAttribute('NAME',$addFilterdata.org_name )[0])
		});
		$undoitm.mouseout(function () {
			$.each(filterLayer.getFeaturesByAttribute('NAME', $addFilterdata.org_name), function (idx, val) {
				selectFeature.unselect(val);
			});
			//selectFeature.unselect(filterLayer.getFeaturesByAttribute('NAME',$addFilterdata.org_name )[0])
		});
		$undoitm.click(function () {
			if ($('#currentFilt_aquifer > li:visible').length == 1) {
				filter.aquifer = null;
				$undolist.hide()
			} else {
				var index = filter.aquifer.indexOf($filt);
				filter.aquifer.splice(index, 1);
			}
			;
			$undoitm.hide();
			//apply_filter();
			setFilter.set();
			apply_current()
			$visible = false;
			removeFeature('NAME', $addFilterdata.org_name)
		});
		return {position: $ul, template: $(this.el)} //$(this.el).append(this.template(this.model.toJSON())) ;
	}//,
	//removeItem: function (model) {
	//	console.log("Remove - " + model.get("Name"))
	//	this.remove();
	//}
});
MVC.Views.sourceFilter = Backbone.View.extend({
	tagName: "li",
	template: "Aquifer_detail",
	undolist: $("#currentFilt_type"),
	undoitem: '<li id="my_id_li"><span><i class="icon-remove-circle" rel="tooltip" title="Remove Type" id="blah"></i><a style="color:my_color;">my_name</a></span></li>',
	initialize: function () {
		//Initialize Backbone js temple
		this.template = TemplateManager.get(this.template)
		//_.bindAll(this, 'render', 'test');
		this.model.bind('destroy', this.destroyItem, this);
		this.model.bind('remove', this.removeItem, this);
	},
	render: function () {
		//Render template inside our view
		var $addFilterdata = this.model.toJSON(); //data
		$addFilterdata.org_name = $addFilterdata.name
		//Set aquifer filter
		var $filt = $addFilterdata.value.replace('(', '_').replace(')', '').replace(/-/g, '').replace(/\s+/g, '').replace(/,/g, '')
		var $org_filt = $addFilterdata.value.replace('(', '_').replace(')', '').replace(/-/g, '').replace(/\s+/g, '').replace(/,/g, '')
		$filt = "SiteType = '" + $filt + "'";
		//$filt = $filt.replace(/,/g,'');
		//render
		$(this.el).append(this.template($addFilterdata));
		//Add events
		var $addFilterAction = this.$('.add_filter');
		this.undoitem = this.undoitem.replace(/my_id/g, 'type_' + $addFilterdata.class + $addFilterdata.order.toString());
		this.undoitem = this.undoitem.replace(/my_name/g, $addFilterdata.name);
		this.undoitem = this.undoitem.replace(/my_color/g, $addFilterdata.color);
		var $undolist = $("#" + $addFilterdata.source + "_undo") //***this.undolist
		var $undolist_string = "#" + $addFilterdata.source + "_undo"
		$undolist.append(this.undoitem);
		var $undoitm = $('#type_' + $addFilterdata.class + $addFilterdata.order.toString() + '_li').hide();
		var $visible = false;
		//var $sites = $('#select_sites');
		//$sites.change(function () {
		//	filter.type = null;
		//	$undolist.hide()
		//	$undoitm.hide();
		//	$visible = false;
			//alert('this has fired');
		//	});
		var $filt_list =$addFilterdata.source + '_type'
		$addFilterAction.click(function () {

			if (!$visible) {
				console.log($addFilterdata.name);
				if (filter[$filt_list] == null) {
					filter[$filt_list] = [];
				}
				filter[$filt_list].push($filt);
				filter[$filt_list] = _.uniq(filter[$filt_list], JSON.stringify);
				//apply_filter();
				setFilter.set();
				//Show close li on
				$undolist.show();
				$undoitm.show();
				$visible = true;
			} else{
				//var subparent = $('#' + $addFilterdata.source + '_li')
				//console.log(subparent)
				//if(subparent.is(':hidden')){
				//	subparent.show()
				//}
				$undoitm.trigger( "click" );
				$undolist.show();
			}
			apply_current()
		});
		$undoitm.mouseover(function () {
			window.evt_bool = false;
			$.each(siteLayer.getFeaturesByAttribute('SiteType', $org_filt), function (idx, val) {
				selectFeature.select(val);
			});
		});
		$undoitm.mouseout(function () {
			$.each(siteLayer.getFeaturesByAttribute('SiteType', $org_filt), function (idx, val) {
				selectFeature.unselect(val);
			});
			window.evt_bool = true;
		});
		$undoitm.click(function () {
			if ($($undolist_string + ' > li:visible').length == 1) {
				filter[$filt_list] = null;
				$undolist.hide()
			} else {
				var index = filter[$filt_list].indexOf($filt);
				filter[$filt_list].splice(index, 1);
			}
			;
			$undoitm.hide();
			//apply_filter();
			setFilter.set();
			apply_current()
			$visible = false;
		});
		return {position: $addFilterdata.class, template: $(this.el)} //$(this.el).append(this.template(this.model.toJSON())) ;
	}//,
	//removeItem: function (model) {
	//	console.log("Remove - " + model.get("Name"))
	//	this.remove();
	//}
});

//WQP Source Selection View
MVC.Views.WQPs = Backbone.View.extend({
	el: $("#subdata"),
	initialize: function () {
		//this.template = TemplateManager.get(this.template);
		//this.render();
		//_.bindAll(this, "render", "addOne", "addAll");
		this.collection.bind("reset", this.render, this);
		//this.collection.bind("add", this.addOne, this);
		this.collection.bind("done", this.addOne, this)
	},
	render: function () {
		//alert('thisi is great');
		//$.each(this.collection.models, function (data) {
		//	console.log(data);
		//});
		var $el = $("#subdata");
		var $sel = $("#select_sites");
		//$el.change(
		//	alert('this is it');
		//)

		$sel.change(function () {
			if ($sel.val() == 'WQP') {
				$el.show();
			} else {
				$el.hide();
			}
		})
		$el.hide();
		//this.addAll();
	},
	addAll: function () {
		this.collection.each(this.addOne);
	},
	addOne: function (model) {
		//console.log(model.toJSON())
		view = new MVC.Views.WQP({ model: model });
		result = view.render();
		$(this.el).append(result);
	}
})
MVC.Views.WQP = Backbone.View.extend({
	tagName: "option",
	template: "<option value='<%= OrganizationIdentifier %>'><%= OrganizationFormalName %> ( Site Count <%= count %> )</option>",
	initialize: function () {
		this.template = _.template(this.template);
	},
	render: function () {
		var $addFilterdata = this.model.toJSON()

		//console.log($addFilterdata)
		var val = {'url': "/mongo/db_find/ows/water_quality_sites/{'spec':{'OrganizationIdentifier':'" + $addFilterdata.OrganizationIdentifier + "'}}/?callback=?",
			'mapping': {'REF_NO': 'MonitoringLocationIdentifier', 'Sitename': 'MonitoringLocationName',
				'Status': 'last_activity', 'SiteType': 'MonitoringLocationTypeName', 'lat': 'LatitudeMeasure',
				'lon': 'LongitudeMeasure', 'aquifer': 'aquifer', 'huc_4': 'huc_4', 'huc_8': 'huc_8'}
		}
		//console.log($addFilterdata.OrganizationFormalName +'(' + $addFilterdata.count + ' Sites)')
		$addFilterdata.OrganizationIdentifier = $addFilterdata.OrganizationIdentifier.replace(/-/g, '');
		sources[$addFilterdata.OrganizationIdentifier] = val
		return this.template($addFilterdata);
	}
});

//****** Router ***********************

MVC.Router = Backbone.Router.extend({
	routes: {
		"": "defaultRoute"  //http://localhost:22257/Theater/theater.htm
	},
	defaultRoute: function () {
		//console.log("defaultRoute");
		//new MVC.Collections.Templates()
		MVC.sources = new MVC.Collections.Sources()
		new MVC.Views.Sources({ collection: MVC.sources }); //Add this line
		MVC.sources.fetch();
		MVC.watersheds = new MVC.Collections.Watersheds()
		new MVC.Views.Watersheds({ collection: MVC.watersheds }); //Add this line
		MVC.watersheds.fetch();
		MVC.aquifers = new MVC.Collections.Aquifers();
		new MVC.Views.Aquifers({ collection: MVC.aquifers }); //Add this line
		MVC.aquifers.fetch();
		MVC.types = new MVC.Collections.Data_filters()
		new MVC.Views.sourceFilters({ collection: MVC.types });//Add this line
		MVC.types.fetch();
		//console.log('ty')
		MVC.WQPs = new MVC.Collections.WQPS();
		//console.log('view')
		var sobj = new MVC.Views.WQPs({ collection: MVC.WQPs });
		//console.log('sobj');
		MVC.WQPs.fetch({
			success: function (model, response) {
				$.each(model.models, function (idx, val) {
					sobj.addOne(val);
				})
				sobj.render();
			}
		})
	}
})

//****** Main App start ****************

var appRouter = new MVC.Router();
Backbone.history.start();
