// Some helpers for running Cybercommons Tasks
// Should point to queue submission target
// Configuration object for calling cybercom queue tasks.
// Parameters can be specified in [params] list object, or a special list of 
// jQuery selectors can be provided to grab the current values of these form elements at run-time.
/*
 taskdesc = {
 "taskname":   'cybercomq.static.tasks.modiscountry',
 "taskq":      'static',
 "params":     ['MOD09A1_ndvi','MX','2010-10-10','2010-11-1'],   // Fixed params
 "uiparams":   ['#product','#country','#start_date','#end_date'],// UI Selected
 "status":     '#status',
 "spinner":    '#spinner',
 "pollinterval": 2000,
 }

 */
// Called by call task to poll queue status of task based on task_id
var QUEUE_SUBMIT = '/queue/run/';
var QUEUE_POLL = '/queue/task/';

function test_auth_tkt () {
	$("#auth_dialog").hide();
	if ($.cookie('auth_tkt')) {
		$('#auth_message').html("you're logged in")
	}
	else {
		$("#auth_dialog").dialog({ height: 200, modal: true});
		$("#auth_dialog").dialog("open");
		$('#auth_message').html('Please <a href="http://test.cybercommons.org/accounts/login/">login</a> to track your tasks via the cybercommons').addClass('label warning');
	}

}


function poll_status (args) {
	$.getJSON(args.host + args.task_id + '?callback=?', function (data) {
		if (data.status == "PENDING") {
			options1.onPending(args);
		} else if (data.status == "FAILURE") {
			options.onFailure(data);
		} else if (data.status == "Error") {
			options1.onFailure(data);
		} else if (data.status == "ERROR") {
			options1.onFailure(data);
		} else if (data.status == "SUCCESS") {
			options1.onSuccess(data);
		}
	});
}

function calltask (taskdesc) {
	defaults = {
		"service_host": QUEUE_SUBMIT,
		"poll_target": QUEUE_POLL,
		"status": '#status',
		"spinner": '#spinner',
		"pollinterval": 4000,
		"onPending": function (task_id) {
			$(options1.status).show();
			$(options1.status).removeClass('label label-success label-warning label-important').addClass('label label-warning');
			$(options1.status).text("Working...");
			$(options1.spinner).show();
			setTimeout(function () {
				poll_status(task_id);
			}, options1.pollinterval);
		},
		"onFailure": function (data) {
			$(options1.status).show();
			$(options1.status).removeClass('label label-success label-warning label-important').addClass('label label-important');
			$(options1.status).text("Task failed!");
			$(options1.spinner).hide();
		},
		"onSuccess": function (data) {
			$(options1.status).show();
			$(options1.status).removeClass('label label-success label-warning label-important').addClass('label label-success');
			$(options1.status).html('<a href="' + data.tombstone[0].result + '">Download</a>');
			$(options1.spinner).hide();
			//simpleCart.empty();
			//siteLayer.styleMap = myStyles1;
			//siteLayer.redraw();
		}
	}
	options1 = $.extend(true, {}, defaults, taskdesc)

	var taskparams = "";

	if (options1.params) {
		for (item in options1.params) {
			taskparams = taskparams.concat('/' + options1.params[item]);
		}
	} else if (options1.uiparams) {
		for (item in options1.uiparams) {
			taskparams = taskparams.concat('/' + $(options1.uiparams[item]).val());
		}
	}
	var kwargs = "?";
	if (options1.kwargs) {
		for (var key in options1.kwargs) {
			kwargs = kwargs + key + '=' + options1.kwargs[key] + '&';
		}
	}
	var taskcall = "";
	if (options1.taskq) {
		taskcall = options1.taskname + '@' + options1.taskq;
	} else {
		taskcall = options1.taskname;
	}

	var request = options1.service_host + taskcall + taskparams + kwargs;
	$.getJSON(request + 'callback=?', function (data) {
		$(options1.status).text('Task submitted...');
		var task_id = data.task_id;
		setTimeout(function () {
			var poll = {};
			poll.host = options1.poll_target;
			poll.task_id = task_id;
			poll_status(poll);
		}, taskparams.pollinterval);
	});
}
