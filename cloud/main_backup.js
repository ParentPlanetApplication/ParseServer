// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});
// use .job instead of .define for background 'job'
Parse.Cloud.job("emailSender", function(request, status) {
    Parse.Cloud.useMasterKey();
    var Email = Parse.Object.extend("Email");
    var query = new Parse.Query(Email); //query for all the outgoing emails
    var organizations = {}; //big object with all the organizations data pulled in, keyed by organization id
    var recipients= {}; //this was the organizations object, keyed by organization id, now holds 'batches' of recipients
    var groups = {}; //holds OrganizationGroup objects with id and name keyed by id
    function success(str) { //general success handler, returned data from previous/current promise written to console, see notes
        var len = arguments.length;
        str = str ? str : null;
        if(!str) {
            str = '';
            for (var i=0; i < len; i++) {
                str += arguments[i]+' ';
            }
        }
        console.log('emailSender Log:' + str);
    //    status.message(str);
        return str; //return data to use somewhere else, maybe
    } //eo general success handler
    function error(err) { //general error handler, something really bad happened, quit everything
        console.log('emailSender Error:' + err)
    //    status.message('emailSender Error2:\n', err); //put it out to log
        status.error(error); //send back to user
    } //eo general error handler
    function getHtml(recipient) { //generates html for single email
        var html = '';
        var o = null;
        var section = null;
        var i = null;
        var fontFam = 'font-family:Arial, Helvetica, sans-serif; ';
        var shading = 'background-color:#e7e7e7; '; //set background color of odd divs
        var lineHeight = 'line-height:1em; ';
        var padding = 'padding: 1.25em  0em 0.75em 1.25em; ';
        var styling = '';
        var titleStyle = 'font-size:19px; padding-bottom: 0.375em; ';
        var headerStyle = 'width:100%; height:1.5em; background-color:#439a9a; color:#fff; text-align:center; line-height:1.5em; font-size:19px; ' + fontFam;
        function even() {
            return i%2 === 0;
        } //eo even
        function add(label, prop, style) { //add inline styling or none if param undefined
            if (!prop) {    return;    }
            label = label ? label + ': ' : ''; //if missing then do not add a string
            prop = prop ? prop : ''; //if missing do not add anything
            style = style ? 'style="' + style + ' " ' : 'style="padding-bottom: 0.375em"'; //inline styling
            html += '<div ' + style + '>' + '<i>' + label + '</i>' + prop + '</div>';
        } //eo add (to html)
        function prefix(style) { //open the block wrapper, add inline styling or empty string if param undefined
            style = style ? 'style="' + style + '" ' : '';
            html += '<div ' + style + '>';
        } //eo prefix
        function suffix() { //close the block wrapper
            html += '</div>';
        } //eo suffix
        function header() {
            if (section === "event") {
                add(null, 'Schedule Events', headerStyle);
            }
            if (section === "message") {
                add(null, 'Messages', headerStyle);
            }
            if (section === "homework") {
                add(null, 'Homework', headerStyle);
            }
        } //eo header
        function snippet() {
            var d = recipient[section][i];
            function gray() {
                if (d.even) {
                    styling = fontFam + lineHeight + padding;
                    return styling;
                }
                if (!d.even) {
                    styling = fontFam + shading + lineHeight + padding;
                    return styling;
                }
            } //eo gray
            function message() { //{"message":"Hello recipient","title":"Hello"}
                //put in code for messages formatting
                gray();
                if (i === recipient[section].length - 1) {
                    styling += 'padding-bottom: 1.5em; ';
                }
                prefix(styling);
                add(null, d.title, titleStyle);
                add('From', d.groupName);
                add('Notes', d.message);
                suffix();
            } //eo message
            function event() { //{"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"}
                gray();
                if (i === recipient[section].length - 1) {
                    styling += 'padding-bottom: 1.5em; ';
                }
                prefix(styling);
                add(null, d.title, titleStyle);
                add('Created By', d.groupName);
                add('When', 'from ' + d.start + ' until ' + d.end);
                add('Where', d.location);
                add('Notes', d.note);
                add('Repeat', d.repeat);
                suffix();
            } //eo event
            function homework() { //{"assigned":"Mon","due":"Thurs","note":"SoCaToa","title":"Trig Idents","type":"Math"}
                //put in code for homework formatting
                gray();
                if (i === recipient[section].length - 1) {
                    styling += 'padding-bottom: 1.5em; ';
                }
                prefix(styling);
                add(null, d.title, titleStyle);
                add('From', d.groupName);
                add('Due', d.due);
                add('Notes', d.note);
                suffix();
            } //eo homework
            d.even = even();
            switch (section) { //call specific formatting depending on which type of data we are given from parse
                case 'event': //Statements executed when the result of expression matches value1 ...
                    event();
                break;
                case 'message':
                    message();
                break;
                case 'homework':
                    homework();
                break;
                default:
                break;
            } //eo switch
            
            //add(i,JSON.stringify(d));
        } //eo snippet
        for(section in recipient) {
            if (section === 'attr') {
                continue;
            }
            header();
            for(i = 0; i < recipient[section].length; i++) {
                snippet();
                //console.log('77'+JSON.stringify(recipient[section][i]));
            }
        }
        return html;
    } //eo getHtml
    function getGroups(results) { //the organizations object from the previous step is in the closure
        var promise = new Parse.Promise(); //do everything async using promises
        var groupId = null;
        var groupName = null;
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup");
        var gQuery = new Parse.Query(OrganizationGroup);
        var groupFound = function(results) { //after we find the orgs pull what we need for the next step, rename not to conflict with top-level success fcn
            var n = 0;
            results.forEach(function (o, i) { //get the name etc
                groupId = o.id;
                groupName = o.get("name"); //now add this to the groups
                if (!groups.hasOwnProperty(groupId)) {
                    n++;
                    groups[groupId] =  {
                        groupId: groupId, //local copy
                        groupName: groupName
                    };
                }
            }); //eo process results loop
            success('have resolved getGroups promise, with total groups: '+ n); //resolve the promise with data for use in the next step
            success('getGroups, '+ JSON.stringify(groups)); //log previous steps results
            promise.resolve();
        }; //eo groupFound
        gQuery.find({success: groupFound, error: error}); //find all the organisations
        return promise; //return promise, when resolved to to next step
    } //eo getOrganizations
    function emailCreate(results) { //emailCreate is not actually async, but treat it as such
        //organizations is a data object at the top-level scope, shared between the functions!
        var promise = new Parse.Promise(); //do everything async using promises
        var Email = Parse.Object.extend("Email");
        var query = new Parse.Query(Email); //query for all the outgoing emails
        var id, data, recipient, groupName;
        var batch; //group of recipients for a specific organizations
        var type; //type of email
        var n = 0; //for debugging
        //success('emailCreate, query emails.length:'+emails.length); // log where we are
        //results.reverse //sort
        function emailFound(results) {
            var n = 0;
                results.forEach(function (o, i) { // b) loop through the ‘rows’ of the emails
                // c) for each item we pull/read the organisation id, then
                n++;
                id = o.get("organizationId");
                data = o.get("data");
                groupName = o.get("groupId");
                groupName = groupName && groups[groupName].groupName ? groups[groupName].groupName : 'undefined';
                if(!id) { return ; } //get out if no id
             //   success('-creating emails for organisation id:'+id+' groupName:'+groupName+' index:'+i);
                if (!organizations.hasOwnProperty(id)) { organizations[id] = {}; }
                if (!recipients.hasOwnProperty(id)) { recipients[id] = {}; }
                batch = recipients[id];
                // c3) then we add each of the recipients to it, or to the existing object with that id, using the same kind of logic ( organisations[id].hasOwnProperty(recipient) )
                type = o.get("type");
                //success('97',id,type,JSON.stringify(batch));
                o.get("recipientAddress").forEach(function (addr, j) {
                    if (!batch.hasOwnProperty(addr)) { 
                        batch[addr] = {};
                        batch[addr].attr = {addr: addr}; 
                    }
                    recipient = batch[addr];
                    //success(type, JSON.stringify(recipient));
                    if (!recipient.hasOwnProperty(type)) {
                        recipient[type] = [];
                    }
                    data.groupName = groupName;
                    recipient[type].push(data);
                }); //eo loop over each email address
                //success(JSON.stringify(batch));
                for(recipient in batch) {
                    ++n;
                    var _html;
                    _html = getHtml(batch[recipient]);
                   // success('\n\n', _html);
                    batch[recipient].html = _html;
                //    success('120 '+JSON.stringify(batch[recipient]));
                }
            }); //eo results.forEach
            success('have resolved emailCreate promise, with total emails:'+ n);
            promise.resolve(); //resolve the promise to go to the next step        
        }
        query.find({success: emailFound, error: error});
        return promise;
    } //eo emailCreate
    function getOrganizations(results) { //the organizations object from the previous step is in the closure
        var promise = new Parse.Promise(); //do everything async using promises
        var ids = Object.keys(organizations); //object Ids for the organisations we are working with
        var id = null;
        var name = null;
        //success('231',JSON.stringify(ids));
        var Organization = Parse.Object.extend("Organization");
        var oQuery = new Parse.Query(Organization);
        var found = function(results) { //after we find the orgs pull what we need for the next step, rename not to conflict with top-level success fcn
            results.forEach(function (o, i) { //get the name etc
                id = o.id;
                name = o.get("name"); //now add this to the organizations
                organizations[id] = { //add an attributes object, plan for the future :)
                    id: id, //local copy
                    name: name
                };
            }); //eo process results loop
            success(JSON.stringify(organizations));
            success('have resolved getOrganizations promise, with total organisations:'+ ids.length); //resolve the promise with data for use in the next step
            success('getOrganisations, '+ results); //log previous steps results
            promise.resolve();
        }; //eo found
        oQuery.containedIn('objectId', ids); //tell parse we want to find everything in the array of ids
        oQuery.find({success: found, error: error}); //find all the organisations
        return promise; //return promise, when resolved to to next step
    } //eo getOrganizations
    function sendEmails(results) { //with the emails array pass along to mandrill and send out
        var _promise = new Parse.Promise(); //do everything async using promises, this is the top-level promise which is resolved only after we finish sending out all batches
        var ids = Object.keys(organizations); //object Ids for the organisations we are working with
        var last = ids.length; //keep track of how many recursions to do
        var index = 0; //first one
        success('Send emails init'+' '+last+' '+index+' '+JSON.stringify(ids));
        function getBody() { //todo: this is a critical function that generates an email 'body' based on the index 
            var id = ids[index]; //the specific id for this batch
            var organization = organizations[id]; //which organization to use
            var batch = recipients[id]; //which set of emails to work with
           // success('123:' + index + organization + batch + id);
            var o = null;
            var merge_vars = [];
            var _to = [];
            for (var p in batch) {
                var addr = batch[p]["attr"]["addr"];
                var html = batch[p]["html"];
                var custom = {
                    "rcpt": addr,
                    "vars": [
                        {
                            "name": "custom",
                            "content": html
                        }
                    ]
                };
                merge_vars.push(custom);
                o = {"email": addr };
                _to.push(o);
                //success(merge_vars);
                var body = {
                "key": "8yGg33UeVP1q1iPNifqAOw",
                "template_name": "p2-template-0",
                "template_content": [
                    {
                        "name": "example name",
                        "content": "example content"
                    }
                ],
                "message": {
                    "html": html,
                    "subject": "A Message From "+organization.name,
                    "from_email": "no-reply@parentplanet.com",
                    "from_name": organization.name,
                    "to": _to,
                    "headers": {
                        "Reply-To": "no-reply@parentplanet.com"
                    },
                    "important": false,
                    "track_opens": null,
                    "track_clicks": null,
                    "auto_text": null,
                    "auto_html": null,
                    "inline_css": null,
                    "url_strip_qs": null,
                    "preserve_recipients": null,
                    "tracking_domain": null,
                    "signing_domain": null,
                    "merge": true,
                    "merge_language": "mailchimp",
                    "merge_vars": merge_vars
                } //eo message//this is where we put in the specific send data encapsulated in 'd' //original email body for testing, THIS NEEDS TO BE FINISHED
                }; //eo body data
            } //eo for..in loop
            success('getBody id:'+id+' organization:'+JSON.stringify(organization)+' recipients:'+JSON.stringify(batch));
            success('********BODY\n'+JSON.stringify(body));
            success('getBody id:'+id);
            return body;
        } //eo getBody
        function send(promise) { //here is where an email is sent out from Mandrill using the passed in data
            var body = null;
            try{
                body = getBody();
                //success('149 '+JSON.stringify(body));
            } catch(err) {
                success('oops: '+err);
            }
            promise = promise || new Parse.Promise(); //first time we send, there is no promise, so create one for recursion
            success('Send 147 '+index+' '+last);
            if(index >= last) { //have finished sending everything
                success('finished recursion');
                // status.success('have sent all emails last index: '+index);
                quitSend();
                return; 
            }
            promise.then(send, quitSend); //bind a recursive send until d.index === n call quitSend if error
            success('Send done '+index);
            //++index;
            //promise.resolve(new Parse.Promise()); //recursion magic
            Parse.Cloud.httpRequest({ //connect to mandrill's api via a REST call
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                url: 'https://mandrillapp.com/api/1.0/messages/send-template.json',
                body:body, //this is where the specific emails are generated
                success: function(httpResponse) { //mandrill comes back OK
                    var id = ids[index]; //the specific id for this batch
                    var organization = organizations[id]; //which organization to use
                    success('--Email send success for:'+organization.name+' id:'+id+' httpResponse:'+httpResponse.status);
                    ++index; //go to the next batch
                    promise.resolve(new Parse.Promise()); //recursion magic
                },
                error: function(httpResponse) { //problem with Mandrill, go to next batch
                    var id = ids[index]; //the specific id for this batch
                    var organization = organizations[id]; //which organization to use
                    success('!!Email send error for:'+organization.name+' id:'+id+' httpResponse:'+httpResponse.status);
                    ++index; //go to the next batch anyway
                    promise.resolve(new Parse.Promise()); //magic
                }
            }); //eo httpRequest
        } //eo send
        function quitSend() {
            success('have sent all emails to Mandrill last index:'+index);
            _promise.resolve(); //resolve the top-level promise to go to the next/final step postprocess
        } //eo quitSend
        send(); //start off the recursive loop with no promise, look out for the spaghetti :)
        return _promise; //return the top-level promise, NOT one of the inner ones
    } //eo sendEmails
    function postprocess(results) {
        var _promise = new Parse.Promise(); //outer promise
        success('postProcess, finished up sending emails'); //log previous steps results
        //this is where we can clean up the data by deleting everything in the Email class, then resolving the promise inside the success handler
        //simply return the resolved promise to continue on to 'done'
        var ts = Math.round(new Date().getTime() / 1000); //USE TODAY OR TOMORROW INSTEAD OF YESTERDAY, OR SIMPLY FIND ALL?
            var tsYesterday = ts - (24 * 3600);
            var dateYesterday = new Date(tsYesterday*1000);
            var Email = Parse.Object.extend("Email");
            var query = new Parse.Query(Email);
            query.lessThan("createdAt", dateYesterday);
            query.find({
                success: function(results) {
                    //success('19',JSON.stringify(results));
                    var promise = null;
                    var index = 0;
                    function recursion () {
                        promise = deleting(results[index]);
                        success('Deleted: '+ index);
                        promise.then(function () {
                            if (index < results.length-1) {
                                ++index;
                                recursion();
                            } else {
                                _promise.resolve(); //done deleting, resolve outer promise
                            }
                        });
                    } //eo recursion
                    function deleting (result) {
                        var promise = new Parse.Promise();
                    //    success('Before destroy: ', result.id, 'index: ', index);
                        result.destroy({
                            success: function () {
                    //            success('Destroy success: ', result.id, 'index: ', index);
                                promise.resolve();
                            },
                            error: function (error) {
                    //            success('Destroy failed: ', result.id, 'index: ', index);
                                promise.resolve();
                                success('PostProcess Error: '+error);
                            }
                        });
                        return promise;
                    } //eo deleting
                    recursion();
                    success("PostProcess job completed");
                },
                error: function(error) { //IF ERROR THEN GO ON TO LOG IT AND NEXT STAGE
                    success("Error in delete query error: " + error);
                 //   alert('Error in delete query');
                }
            });
        return _promise; //move to final function 'done'
    } //eo postprocess
    function start(results) { //initialize everything, could set organizations, recipients here
        var promise = new Parse.Promise();
        var date = new Date();
        success('Start sending emails on:'+date.toString());
        return promise.resolve(results);
    } //eo start
    function done() { //last link in the chain, respond to the initial cloud run request here
        var date = new Date();
        var msg = 'All done sending emails on:'+date.toString();
        success(msg);
        status.success(msg);
    } //eo done
    /*
    * this is the main function(s) of emailSender to be called as a serial chain of promises
    */
    query.find({success: start, error: error}) //find all the emails to be sent, timestamp it and go to next link
    .then(getGroups, error)
    .then(emailCreate, error) //then returns a promise, chain it to the next step
    .then(getOrganizations, error) //now get the names of the organizations
    .then(sendEmails, error) //send out emails per organizations
    .then(postprocess, error) //final clean up
    .then(done); //eo end cloud run, timestamp
    /*
    *
    */
}); //eo emailSender

/* Notes
with "console.log" statements: on your telnet session use "parse log -f", to quickly find the problem!!
*/