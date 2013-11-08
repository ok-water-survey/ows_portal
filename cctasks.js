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
var QUEUE_SUBMIT = 'http://test.oklahomawatersurvey.org/queue/run/';
var QUEUE_POLL = 'http://test.oklahomawatersurvey.org/queue/task/';

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
            options.onPending(args);
        } else if (data.status == "FAILURE") {
            options.onFailure(data);
        } else if (data.status == "Error") {
            options.onFailure(data);
        } else if (data.status == "SUCCESS") {
            options.onSuccess(data);
        }
    });
}

function calltask (taskdesc) {
    defaults = {
        "service_host": QUEUE_SUBMIT,
        "poll_target": QUEUE_POLL,
        "status": '#status',
        "spinner": '#spinner',
        "pollinterval": 2000,
        "onPending": function (task_id) {
            $(options.status).show();
            $(options.status).removeClass('label label-success label-warning label-important').addClass('label label-warning');
            $(options.status).text("Working...");
            $(options.spinner).show();
            setTimeout(function () {
                poll_status(task_id);
            }, options.pollinterval);
        },
        "onFailure": function (data) {
            $(options.status).show();
            $(options.status).removeClass('label label-success label-warning label-important').addClass('label label-important');
            $(options.status).text("Task failed!");
            $(options.spinner).hide();
        },
        "onSuccess": function (data) {
            $(options.status).show();
            $(options.status).removeClass('label label-success label-warning label-important').addClass('label label-success');
            $(options.status).html('<a href="' + data.tombstone[0].result + '">Download</a>');
            $(options.spinner).hide();
            simpleCart.empty();
        },
    }
    options = $.extend(true, {}, defaults, taskdesc)

    var taskparams = "";

    if (options.params) {
        for (item in options.params) {
            taskparams = taskparams.concat('/' + options.params[item]);
        }
    } else if (options.uiparams) {
        for (item in options.uiparams) {
            taskparams = taskparams.concat('/' + $(options.uiparams[item]).val());
        }
    }
    var kwargs = "?";
    if (options.kwargs) {
        for (var key in options.kwargs) {
            kwargs = kwargs + key + '=' + options.kwargs[key] + '&';
        }
    }
    var taskcall = "";
    if (options.taskq) {
        taskcall = options.taskname + '@' + options.taskq;
    } else {
        taskcall = options.taskname;
    }

    var request = options.service_host + taskcall + taskparams + kwargs;
    $.getJSON(request + 'callback=?', function (data) {
        $(options.status).text('Task submitted...');
        var task_id = data.task_id;
        setTimeout(function () {
            var poll = {};
            poll.host = options.poll_target;
            poll.task_id = task_id;
            poll_status(poll);
        }, taskparams.pollinterval);
    });
}
