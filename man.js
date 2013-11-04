var MVC = {
    Models: {},
    Collections: {},
    Views: {},
    Templates:{}
}
//****** Template Manager *************

var TemplateManager = {
  templates: {},
  get: function(id){ 
    var result
    var template = this.templates[id];
    if (template) {
        result = template;
    } else {
      var that = this;
      $.ajax({
            type:'GET',async:false,
            url:"/catalog/db_find/ows-portal/data/{'spec':{'id':'" + id + "'}}/",
            success:function(template){
                var $tmpl = _.template(template[0].template);
                that.templates[id] = $tmpl;
                result=$tmpl;
            }
        });
    }
    return result 
  }
}
//****** Models ***********************

MVC.Models.Watershed = Backbone.Model.extend({})
MVC.Models.Aquifer = Backbone.Model.extend({})

//****** Collections ******************

MVC.Collections.Watersheds = Backbone.Collection.extend({
    model: MVC.Models.Watershed,
    url: "/catalog/db_find/ows-portal/data/{'spec':{'model':'Watershed'},'sort':[('order',1)]}/",
});
MVC.Collections.Aquifers = Backbone.Collection.extend({
    model: MVC.Models.Aquifer,
    url: "/catalog/db_find/ows-portal/data/{'spec':{'model':'Watershed'},'sort':[('order',1)]}/",
});
//****** Views ************************

MVC.Views.Watersheds = Backbone.View.extend({
    el: $("#watershd"),
    template: "Watershed_base", 
    initialize: function () {
        //Initialize Backbone js temple
        this.template=TemplateManager.get(this.template);
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
MVC.Views.Watershed = Backbone.View.extend({
    tagName: "li",
    template:"Watershed_detail",
    undolist: $("#currentFilt_wshd"),
    undoitem:'<li id="my_id_li"><img src="close_small_icon.gif" alt="Remove"><a style="display:inline-block">my_name</a></li>',
    initialize: function () {
        //Initialize Backbone js temple
        this.template=TemplateManager.get(this.template)
        //_.bindAll(this, 'render', 'test');
        this.model.bind('destroy', this.destroyItem, this);
        this.model.bind('remove', this.removeItem, this);
    },
    render: function () {
        //Render template inside our view
        var $addFilterdata = this.model.toJSON(); //data
        //Set watershed name
        var $filt;
        if($addFilterdata.huc_id.length==8){
            $filt="huc_8 = '" + $addFilterdata.huc_id + "'";
            $addFilterdata.name = '&nbsp;&nbsp; - ' + $addFilterdata.name;
        }else{
            $addFilterdata.name = '&nbsp;' + $addFilterdata.name;
            $filt="huc_4 = '" + $addFilterdata.huc_id + "'";
        }
        //render
        $(this.el).append(this.template($addFilterdata)) ;
        //Add events
        var $addFilterAction = this.$('.add_filter');
        this.undoitem = this.undoitem.replace(/my_id/g, $addFilterdata.huc_id);
        this.undoitem = this.undoitem.replace(/my_name/g, $addFilterdata.name);
        var $undolist = this.undolist
        $undolist.append(this.undoitem);
        var $undoitm = $('#' + $addFilterdata.huc_id + '_li').hide();

        $addFilterAction.click(function(){
            console.log($addFilterdata.huc_id);
            if(filter.watershed ==null){filter.watershed=[];}
            filter.watershed.push($filt);
            filter.watershed = _.uniq(filter.watershed,JSON.stringify);
            apply_filter();
            //Show close li on
            $undolist.show()
            $undoitm.show();

        });
        $undoitm.click(function(){
            if ($('#currentFilt_wshd > li:visible').length==1){
                console.log(filter.watershed);
                filter.watershed = null;
                console.log(filter.watershed);
                $undolist.hide()
            }else{
                var index = filter.watershed.indexOf($filt);
                filter.watershed.splice(index, 1);
            };
            $undoitm.hide();
            apply_filter();
        });
        return $(this.el) //$(this.el).append(this.template(this.model.toJSON())) ;
    },
    removeItem: function (model) {
        console.log("Remove - " + model.get("Name"))
        this.remove();
    }
})

//****** Router ***********************

MVC.Router = Backbone.Router.extend({
    routes: {
        "": "defaultRoute"  //http://localhost:22257/Theater/theater.htm
    },
    defaultRoute: function () {
        //console.log("defaultRoute");
        //new MVC.Collections.Templates()
        MVC.watersheds = new MVC.Collections.Watersheds()
        new MVC.Views.Watersheds({ collection: MVC.watersheds }); //Add this line
        MVC.watersheds.fetch();
        //console.log(MVC.watersheds.length)
    }
})

//****** Main App start ****************

var appRouter = new MVC.Router();
Backbone.history.start();
