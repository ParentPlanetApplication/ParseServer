// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
var moment = require( "./moment/moment-timezone-with-data.js" );
//simple code test
Parse.Cloud.define( "hello", function ( request, response ) {
	response.success( "Hello world!" );
} );
//send out email to new user
Parse.Cloud.define( 'welcomeSender', function ( request, status ) {
	var name = request.params.username;
	var pwd = request.params.password;
	var mode = request.params.mode;
	var requestParams = request.params;
	var body = 'Temp';

	function getHtml( d ) { //generates html for single email
		var html = '';
		var o = null;
		var section = null;
		var i = 0;
		var fontFam = 'font-family:Arial, Helvetica, sans-serif; ';
		var shading = 'background-color:#e7e7e7; '; //set background color of odd divs
		var lineHeight = 'line-height:1em; ';
		var padding = 'padding: 1.25em  0em 0.75em 1.25em; ';
		var styling = '';
		var titleStyle = 'font-size:19px; padding-bottom: 0.375em; line-height: 1.25em; ';
		var headerStyle = 'width:100%; height:1.5em; background-color:#439a9a; color:#fff; text-align:center; line-height:1.5em; font-size:19px; ' + fontFam;

		function even() {
			return i % 2 === 0;
		}; //eo even
		function add( arr, style ) { //add inline styling or none if param undefined
			var text = '';
			if ( !arr || arr.length === 0 ) {
				return;
			}
			style = style ? 'style="padding:0 2em 0 2em;"' : 'style="padding:0 2em 0.375em 2em;"'; //inline styling
			text = arr.join( ' ' );
			html += '<div ' + style + '>' + text + '</div>';
		}; //eo add (to html)
		function prefix( style ) { //open the block wrapper, add inline styling or empty string if param undefined
			style = style ? 'style="' + style + '" ' : '';
			html += '<div ' + style + '>';
		}; //eo prefix
		function gray() {
			styling = d.even ? fontFam + lineHeight + padding : fontFam + shading + lineHeight + padding;
			return styling;
		} //eo gray
		function suffix() {
			html += '</div>';
		}; //eo suffix
		mode = mode ? mode : 0;
		gray();
		prefix();
		if ( mode === 1 ) {
			add( [ d.senderName, 'has just added you to their Parent Planet account. They are using Parent Planet for their scheduling and communications to help get you the information you need in an easier and more integrated way.<br/>' ] );
		} else {
			add( [ d.senderName, 'from', d.organizationName, 'has just added', d.who, 'to', d.groupName, '. They are using Parent Planet for their scheduling and communications to help get you the information you need in an easier and more integrated way.<br/>' ] );
		}
		add( [ 'Parent Planet is an amazing app for parents that can be downloaded from the <a href="https://itunes.apple.com/us/app/parent-planet/id1026555193?ls=1&mt=8">Apple App Store</a> or <a href="https://play.google.com/store/apps/details?id=com.ppllc.pp">Google Play Store</a> directly onto your phone and/or tablet. The app is a great way to view all the information that relates to your children and easily integrate it as you want into your existing calendar. The app can remind you of important events and display all your families activities in an easy to use, color-coded format that is always synchronized for all the caretakers in your family. You can also access all the information on the web at <a href="http://parentplanet.com">parentplanet.com</a>. To use any of these methods simply login into the app and/or website using the following login information.<br/>' ] );
		add( [ 'Login:', d.username ], true );
		add( [ 'Password:', d.password ], true );
		add( [ 'We recommend you update your password by clicking on the Reset Password button on the login screen of the app or website.<br/>' ] );
		add( [ 'We hope you enjoy using the Parent Planet system.  If you have any questions feel feel to contact us anytime at <a href="mailto:help@parentplanet.com">help@parentplanet.com</a>.<br/>' ] );
		add( [ 'Sincerely,<br/>' ] );
		add( [ 'ParentPlanet<br/>' ] );
		suffix();
		return html;
	} //eo getHtml
	function getBody() { //todo: this is a critical function that generates an email 'body' based on the index
		var footer = '<div style="font-size:0.8em; padding:20px 2em 20px 2em;">Would you prefer to receive all this information on your mobile device? The Parent Planet App is now available and offers push notifications, time saving integrations with your existing calendar, and much more. Download it today from the <a href="https://itunes.apple.com/us/app/parent-planet/id1026555193?ls=1&mt=8" style="color: white;" >App Store</a> or <a href="https://play.google.com/store/apps/details?id=com.ppllc.pp" style="color:white;">Play Store</a>.'
		+'<p style="font-size:0.8em;">If you wish to no longer receive these emails you can change your email preference in the user settings of the Parent Planet App or, if you prefer, please email us your request at stopemail@parentplanet.com</p>'
		+'</div>';

		// success('123:' + index + organization + batch + id);
		var o = null;
		var merge_vars = [];
		var _to = [];
		var addr = requestParams.username ? requestParams.username : "no-reply@parentplanet.com";
		var html = getHtml( requestParams );
		var custom = {
			"rcpt": addr,
			"vars": [
				{
					"name": "custom",
					"content": html
				},
				{
					"name": "customheading",
					"content": "<b>Welcome to Parent Planet</b>"
				},
				{
					"name": "footer",
					"content": footer
				}
                ]
		}; //eo custom
		merge_vars.push( custom );
		o = {
			"email": addr
		};
		_to.push( o );
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
				"subject": 'Welcome to ParentPlanet',
				"from_email": "no-reply@parentplanet.com",
				"from_name": 'Parent Planet',
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
		//console.log('********BODY\n'+JSON.stringify(body));
		return body;
	} //eo getBody
	Parse.Cloud.useMasterKey();
	body = getBody();
	Parse.Cloud.httpRequest( { //connect to mandrill's api via a REST call
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		url: 'https://mandrillapp.com/api/1.0/messages/send-template.json',
		body: body, //this is where the specific emails are generated
		success: function ( httpResponse ) { //mandrill comes back OK
			console.log( 'Welcome --Email send success for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
			status.success( 'Welcome --Email send success for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
		},
		error: function ( httpResponse ) { //problem with Mandrill, go to next batch
			console.log( '!!Email send error for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
			status.success( '!!Email send error for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
		}
	} ); //eo httpRequest
} ); //eo welcomeSender
//send out email to new user v2
Parse.Cloud.define( 'welcomeSender2', function ( request, status ) { //slight change to wording
	var name = request.params.username;
	var pwd = request.params.password;
	var requestParams = request.params;
	var body = 'Temp';

	function getHtml( d ) { //generates html for single email
		var html = '';
		var o = null;
		var section = null;
		var i = 0;
		var fontFam = 'font-family:Arial, Helvetica, sans-serif; ';
		var shading = 'background-color:#e7e7e7; '; //set background color of odd divs
		var lineHeight = 'line-height:1em; ';
		var padding = 'padding: 1.25em  0em 0.75em 1.25em; ';
		var styling = '';
		var titleStyle = 'font-size:19px; padding-bottom: 0.375em; line-height: 1.25em; ';
		var headerStyle = 'width:100%; height:1.5em; background-color:#439a9a; color:#fff; text-align:center; line-height:1.5em; font-size:19px; ' + fontFam;

		function even() {
			return i % 2 === 0;
		}; //eo even
		function add( arr, style ) { //add inline styling or none if param undefined
			var text = '';
			if ( !arr || arr.length === 0 ) {
				return;
			}
			style = style ? 'style="padding:0 2em 0 2em;"' : 'style="padding:0 2em 0.375em 2em;"'; //inline styling
			text = arr.join( ' ' );
			html += '<div ' + style + '>' + text + '</div>';
		}; //eo add (to html)
		function prefix( style ) { //open the block wrapper, add inline styling or empty string if param undefined
			style = style ? 'style="' + style + '" ' : '';
			html += '<div ' + style + '>';
		}; //eo prefix
		function gray() {
			styling = d.even ? fontFam + lineHeight + padding : fontFam + shading + lineHeight + padding;
			return styling;
		} //eo gray
		function suffix() {
			html += '</div>';
		}; //eo suffix
		gray();
		prefix();
		add( [ d.senderName, 'from', d.organizationName, 'has just added', d.who, 'to', d.groupName, '. They are using Parent Planet for their scheduling and communications to help get you the information you need in an easier and more integrated way.<br/>' ] );
    add( [ 'Parent Planet is an amazing app for parents that can be downloaded from the <a href="https://itunes.apple.com/us/app/parent-planet/id1026555193?ls=1&mt=8" >Apple App Store</a> or <a href="https://play.google.com/store/apps/details?id=com.ppllc.pp">Google Play Store</a> directly onto your phone and/or tablet. The app is a great way to view all the information that relates to your children and easily integrate it as you want into your existing calendar. The app can remind you of important events and display all your families activities in an easy to use, color-coded format that is always synchronized for all the caretakers in your family. You can also access all the information on the web at <a href="http://parentplanet.com">parentplanet.com</a>. To use any of these methods simply login into the app and/or website using the following login information.<br/>' ] );
		add( [ 'Login:', d.username ], true );
		add( [ 'Password:', d.password ], true );
		add( [ 'We recommend you update your password by clicking on the Reset Password button on the login screen of the app or website.<br/>' ] );
		add( [ 'We hope you enjoy using the Parent Planet system.  If you have any questions feel feel to contact us anytime at <a href="mailto:help@parentplanet.com">help@parentplanet.com</a>.<br/>' ] );
		add( [ 'Sincerely,<br/>' ] );
		add( [ 'ParentPlanet<br/>' ] );
		suffix();
		return html;
	} //eo getHtml
	function getBody() { //todo: this is a critical function that generates an email 'body' based on the index
		var footer = '<div style="font-size:0.8em; padding:20px 2em 20px 2em;">Would you prefer to receive all this information on your mobile device? The Parent Planet App is now available and offers push notifications, time saving integrations with your existing calendar, and much more. Download it today from the <a href="https://itunes.apple.com/us/app/parent-planet/id1026555193?ls=1&mt=8">App Store</a> or <a href="https://play.google.com/store/apps/details?id=com.ppllc.pp">Play Store</a>.'
		+'<p style="font-size:0.8em;">If you wish to no longer receive these emails you can change your email preference in the user settings of the Parent Planet App or, if you prefer, please email us your request at stopemail@parentplanet.com</p>'
		+'</div>';
		// success('123:' + index + organization + batch + id);
		var o = null;
		var merge_vars = [];
		var _to = [];
		var addr = requestParams.username ? requestParams.username : "no-reply@parentplanet.com";
		var html = getHtml( requestParams );
		var custom = {
			"rcpt": addr,
			"vars": [
				{
					"name": "custom",
					"content": html
				},
				{
					"name": "customheading",
					"content": "<b>Welcome to Parent Planet</b>"
				},
				{
					"name": "footer",
					"content": footer
				}
                ]
		}; //eo custom
		merge_vars.push( custom );
		o = {
			"email": addr
		};
		_to.push( o );
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
				"subject": 'Welcome to ParentPlanet',
				"from_email": "no-reply@parentplanet.com",
				"from_name": 'Parent Planet',
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
		//console.log('********BODY\n'+JSON.stringify(body));
		return body;
	} //eo getBody
	Parse.Cloud.useMasterKey();
	body = getBody();
	Parse.Cloud.httpRequest( { //connect to mandrill's api via a REST call
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		url: 'https://mandrillapp.com/api/1.0/messages/send-template.json',
		body: body, //this is where the specific emails are generated
		success: function ( httpResponse ) { //mandrill comes back OK
			console.log( 'Welcome --Email send success for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
			status.success( 'Welcome --Email send success for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
		},
		error: function ( httpResponse ) { //problem with Mandrill, go to next batch
			console.log( '!!Email send error for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
			status.success( '!!Email send error for:' + name + ' pwd:' + pwd + ' httpResponse:' + httpResponse.status );
		}
	} ); //eo httpRequest
} ); //eo welcomeSender2

// use .job instead of .define for background 'job'
// batch email handler
Parse.Cloud.define( "emailSender", function ( request, status ) {
	Parse.Cloud.useMasterKey();
	var bigPromise = null; //the very, very, outer promise that holds the cloud function going until the final done is called!
	var resultsArray = null; //this top-level array holds the results of searching for emails and then using query.each to populate the array;
	// var Email = Parse.Object.extend( "Email" );
  var Email = Parse.Object.extend( "Email", {}, {
    query: function () {
      return new Parse.Query( this.className );
    }
  } );

	// var query = new Parse.Query( Email ); //query for all the outgoing emails
  var query = Email.query();
	var skip = 0; //offset for search results
	var MAXCOUNT = 101; //for handling Parse limits on how many query results to return (100 default)
	var total = 0; //keep track of how many emails to potentially handle
	var organizations = {}; //big object with all the organizations data pulled in, keyed by organization id
	var recipients = {}; //this was the organizations object, keyed by organization id, now holds 'batches' of recipients
	var groups = {}; //holds OrganizationGroup objects with id and name keyed by id
	//var customheading = "Update from ParentPlanet"; //string to use for heading at top of email see line#286; TODO: refactor to use org. name instead of P2
		var footer = 'Would you prefer to receive all this information on your mobile device? The Parent Planet App is now available and offers push notifications, time saving integrations with your existing calendar, and much more. Download it today from the <a href="https://itunes.apple.com/us/app/parent-planet/id1026555193?ls=1&mt=8" style="color:#fff;" >App Store</a> or <a href="https://play.google.com/store/apps/details?id=com.ppllc.pp" style="color: #fff;">Play Store</a>.';
		footer += '<p style="font-size:0.8em;">If you wish to no longer receive these emails you can change your email preference in the user settings of the Parent Planet App or, if you prefer, please email us your request at stopemail@parentplanet.com</p>';

	function noop() {};

	function success( str ) { //general success handler, returned data from previous/current promise written to console, see notes
		var len = arguments.length;
		str = str ? str : null;
		if ( !str ) {
			str = '';
			for ( var i = 0; i < len; i++ ) {
				str += arguments[ i ] + ' ';
			}
		}
		console.log( 'emailSender Log:' + str );
		//    status.message(str);
		return str; //return data to use somewhere else, maybe
	} //eo general success handler
	function error( err ) { //general error handler, something really bad happened, quit everything
		success( 'emailSender Error:' + err )
			//    status.message('emailSender Error2:\n', err); //put it out to log
			//   status.error(error); //send back to user
	} //eo general error handler
	function checkData( which, d ) {
		var flag = d && d.note && d.note.indexOf( '12345' ) > 0;
		flag ? success( '-------------------  checkData:' + which + ' json:' + JSON.stringify( d ) ) : noop();
	};

	function getHtml( recipient ) { //generates html for single email
		var html = '';
		var o = null;
		var section = null;
		var i = null;
		var fontFam = 'font-family:Arial, Helvetica, sans-serif; ';
		var shading = 'background-color:#e7e7e7; '; //set background color of odd divs
		var lineHeight = 'line-height:1em; ';
		var padding = 'padding: 1.25em  0em 0.75em 1.25em; ';
		var styling = '';
		var titleStyle = 'font-size:19px; padding-bottom: 0.375em; line-height: 1.25em; ';
		var headerStyle = 'width:100%; height:1.5em; background-color:#439a9a; color:#fff; text-align:center; line-height:1.5em; font-size:19px; ' + fontFam;

		function even() {
			return i % 2 === 0;
		} //eo even
		function add( label, prop, style ) { //add inline styli    ng or none if param undefined
			if ( !prop || prop == "Never" ) {
				return;
			}
			label = label ? label + ': ' : ''; //if missing then do not add a string
			prop = prop ? prop : ''; //if missing do not add anything
			style = style ? 'style="' + style + ' " ' : 'style="padding-bottom: 0.375em"'; //inline styling
			prop = unescape(prop).replace(/\</,'\\<').replace(/\/>/,'\\/\\>').replace(/\>/,'\\>');

			html += '<div ' + style + '>' + '<i>' + label + '</i>' + prop + '</div>';
		} //eo add (to html)
		function prefix( style ) { //open the block wrapper, add inline styling or empty string if param undefined
			style = style ? 'style="' + style + '" ' : '';
			html += '<div ' + style + '>';
		} //eo prefix
		//close the block wrapper
		function suffix() {
			html += '</div>';
		} //eo suffix
		function header() {
			if ( section === "event" ) {
				add( null, 'Schedule Events', headerStyle );
			}
      if ( section === "cancel" ) {
				add( null, 'Canceled Events', headerStyle );
			}
      if ( section === "update" ) {
				add( null, 'Updated Events', headerStyle );
			}
			if ( section === "message" ) {
				add( null, 'Messages', headerStyle );
			}
			if ( section === "homework" ) {
				add( null, 'Homework', headerStyle );
			}
		} //eo header
		function snippet() {
			var d = recipient[ section ][ i ];

			function gray() {
				if ( d.even ) {
					styling = fontFam + lineHeight + padding;
					return styling;
				}
				if ( !d.even ) {
					styling = fontFam + shading + lineHeight + padding;
					return styling;
				}
			} //eo gray
			function message() { //{"message":"Hello recipient","title":"Hello"}
				//put in code for messages formatting
				gray();
				if ( i === recipient[ section ].length - 1 ) {
					styling += 'padding-bottom: 1.5em; ';
				}
				prefix( styling );
				var unescapeTitle = d.title;
				add( null, unescapeTitle, titleStyle );
				var unescapeGroupName = d.groupName;
				add( 'From', unescapeGroupName );
				var unescapeMessage = d.message;
				add( 'Notes', unescapeMessage );

				suffix();
			} //eo message
			function event() { //{"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"}
				//sxm handle deprecated moment constructor method and update _startDay/Time, _endDay/Time to use start/endDate instead of bare start/end
				var _startDay = d.start ? moment( d.start ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				var _startTime = d.end ? moment( d.start ).tz( 'America/Los_Angeles' ).format( 'h:mm a' ) : '';
				var _endDay = d.end ? moment( d.end ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				var _endTime = d.end ? moment( d.end ).tz( 'America/Los_Angeles' ).format( 'h:mm a' ) : '';
				var _untilDate = d.until ? moment( new Date( d.until ) ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : '';
				var _when = ( _startDay == _endDay ) && ( _startDay != 'TBA' ) ? _startDay + ' from ' + _startTime + ' until ' + _endTime : _startDay + ' ' + _startTime + ' until ' + _endDay + ' ' + _endTime;
				var isRepeating = d.repeat && /never/i.test( d.repeat ) ? false : true;
				var _repeat = isRepeating ? d.repeat + ' until ' + _untilDate : null;
				gray();
				if ( i === recipient[ section ].length - 1 ) {
					styling += 'padding-bottom: 1.5em; ';
				}
				prefix( styling );
				add( null, d.title, titleStyle );
				var unescapeGroupName = d.groupName;
				add( 'Created By', unescapeGroupName);
				add( 'When', _when );
				var unescapeLocation = d.location;
				add( 'Where', d.location );
				var unescapeNote = d.note;
				add( 'Notes', unescapeNote )
				checkData( 'html', d );
				if ( isRepeating && _repeat ) {
					add( 'Repeats', _repeat );
				}
				suffix();
			} //eo event
       function cancelEvents() { //{"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"}
				//sxm handle deprecated moment constructor method and update _startDay/Time, _endDay/Time to use start/endDate instead of bare start/end
				var _startDay = d.start ? moment( d.start ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				var _startTime = d.end ? moment( d.start ).tz( 'America/Los_Angeles' ).format( 'h:mm a' ) : '';
				var _endDay = d.end ? moment( d.end ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				var _endTime = d.end ? moment( d.end ).tz( 'America/Los_Angeles' ).format( 'h:mm a' ) : '';
				var _untilDate = d.until ? moment( new Date( d.until ) ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : '';
				var _when = ( _startDay == _endDay ) && ( _startDay != 'TBA' ) ? _startDay + ' from ' + _startTime + ' until ' + _endTime : _startDay + ' ' + _startTime + ' until ' + _endDay + ' ' + _endTime;
				var isRepeating = d.repeat && /never/i.test( d.repeat ) ? false : true;
				var _repeat = isRepeating ? d.repeat + ' until ' + _untilDate : null;
				gray();
				if ( i === recipient[ section ].length - 1 ) {
					styling += 'padding-bottom: 1.5em; ';
				}
				prefix( styling );
           console.log(JSON.stringify(d));
					 var unescapeTitile = d.title;
				add( null, unescapeTitile, titleStyle );
				var unescapeGroupName = d.groupName;
				add( 'Created By', unescapeGroupName );
        add( 'Cancel By',unescapeGroupName);
				add( 'When', _when );
				var unescapeLocation = d.location;
				add( 'Where', unescapeLocation);
				var unescapeNote = d.note;
				add( 'Notes', unescapeNote )
				checkData( 'html', d );
				if ( isRepeating && _repeat ) {
					add( 'Repeats', _repeat );
				}
				suffix();
			} //eo cancelEvent
      function updateEvents() { //{"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"}
				//sxm handle deprecated moment constructor method and update _startDay/Time, _endDay/Time to use start/endDate instead of bare start/end
				var _startDay = d.start ? moment( d.start ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				var _startTime = d.end ? moment( d.start ).tz( 'America/Los_Angeles' ).format( 'h:mm a' ) : '';
				var _endDay = d.end ? moment( d.end ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				var _endTime = d.end ? moment( d.end ).tz( 'America/Los_Angeles' ).format( 'h:mm a' ) : '';
				var _untilDate = d.until ? moment( new Date( d.until ) ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : '';
				var _when = ( _startDay == _endDay ) && ( _startDay != 'TBA' ) ? _startDay + ' from ' + _startTime + ' until ' + _endTime : _startDay + ' ' + _startTime + ' until ' + _endDay + ' ' + _endTime;
				var isRepeating = d.repeat && /never/i.test( d.repeat ) ? false : true;
				var _repeat = isRepeating ? d.repeat + ' until ' + _untilDate : null;
				gray();
				if ( i === recipient[ section ].length - 1 ) {
					styling += 'padding-bottom: 1.5em; ';
				}
				prefix( styling );
        console.log(JSON.stringify(d));
				var unescapeTitle = d.title;
				add( null, unescapeTitle, titleStyle );
					var unescapeGroupName = d.groupName;
				add( 'Created By', unescapeGroupName );
        add( 'Edit By', unescapeGroupName);
				add( 'When', _when );
					var unescapeLocation = d.location;
				add( 'Where', unescapeLocation );
				var unescapeNote = d.note;
				add( 'Notes', unescapeNote )
				checkData( 'html', d );
				if ( isRepeating && _repeat ) {
					add( 'Repeats', _repeat );
				}
				suffix();
			} //eo updateEvents

			function homework() { //{"assigned":"Mon","due":"Thurs","note":"SoCaToa","title":"Trig Idents","type":"Math"}
				//put in code for homework formatting
				gray();
				if ( i === recipient[ section ].length - 1 ) {
					styling += 'padding-bottom: 1.5em; ';
				}
				var _due = d.due ? moment( d.due ).tz( 'America/Los_Angeles' ).format( 'ddd MMM Do YYYY' ) : 'TBA';
				prefix( styling );
				var unescapeTitle = d.title;
				add( null, unescapeTitle, titleStyle );
				var unescapeGroupName = d.groupName;
				add( 'From', unescapeGroupName);
				add( 'Due', _due );
				var unescapeNote = d.note;
				add( 'Notes', unescapeNote );
				suffix();
			} //eo homework
			d.even = even();
			switch ( section ) { //call specific formatting depending on which type of data we are given from parse
				//Statements executed when the result of expression matches value1 ...
			case 'event':
				event();
				break;
      case 'cancel':
        cancelEvents();
        break;
      case 'update':
        updateEvents();
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
		for ( section in recipient ) {
			if ( section === 'attr' ) {
				continue;
			}
			header();
			for ( i = 0; i < recipient[ section ].length; i++ ) {
				snippet();
				//console.log('77'+JSON.stringify(recipient[section][i]));
			}
		}
		return html;
	} //eo getHtml
	function getGroups( results ) { //the organizations object from the previous step is in the closure
		var promise = new Parse.Promise(); //do everything async using promises
		var groupId = null;
		var groupName = null;
		var OrganizationGroup = Parse.Object.extend( "OrganizationGroup" );
		var query = new Parse.Query( OrganizationGroup );
		var groupFound = function ( results ) { //after we find the orgs pull what we need for the next step, rename not to conflict with top-level success fcn
			var n = 0;
			results.forEach( function ( o, i ) { //get the name etc
				groupId = o.id;
				groupName = o.get( "name" ); //now add this to the groups
				if ( !groups.hasOwnProperty( groupId ) ) {
					n++;
					groups[ groupId ] = {
						groupId: groupId, //local copy
						groupName: groupName
					};
				}
			} ); //eo process results loop
			success( '#401 have resolved getGroups promise, with total groups: ' + n ); //resolve the promise with data for use in the next step
			//   success('#402 getGroups, '+ JSON.stringify(groups)); //log previous steps results
			promise.resolve();
		}; //eo groupFound
		success( '#413 have entered getGroups, searching for all OrganizationGroup' ); //resolve the promise with data for use in the next step
		//query.limit = 1000;
		query.limit( MAXCOUNT );
		query.find( {
			success: groupFound,
			error: error
		} ); //find all the organisations
		return promise; //return promise, when resolved to to next step
	} //eo getGroups
	function emailCreate( results ) { //emailCreate is not actually async, but treat it as such
		//organizations is a data object at the top-level scope, shared between the functions!
		var promise = new Parse.Promise(); //do everything async using promises
		//    var Email = Parse.Object.extend("Email");
		//    var query = new Parse.Query(Email); //query for all the outgoing emails
		var id, data, recipient, groupName;
		var batch; //group of recipients for a specific organizations
		var type; //type of email
		var n = 0; //for debugging
		//results.reverse //sort
		function emailFound( results ) {
			var n = 0;

			SortByStartDate(results);

			results.forEach( function ( o, i ) { // b) loop through the ‘rows’ of the emails
				// c) for each item we pull/read the organisation id, then
				n++;
				id = o.get( "organizationId" );
				data = o.get( "data" );

				groupName = o.get( "groupId" );
				groupName = groupName && groups[ groupName ] && groups[ groupName ].groupName ? groups[ groupName ].groupName : o.get( "customListName" );
				if ( !id ) {
					return;
				} //get out if no id
				if ( !organizations.hasOwnProperty( id ) ) {
					organizations[ id ] = {};
				}
				if ( !recipients.hasOwnProperty( id ) ) {
					recipients[ id ] = {};
				}
				batch = recipients[ id ];
				// c3) then we add each of the recipients to it, or to the existing object with that id, using the same kind of logic ( organisations[id].hasOwnProperty(recipient) )
				type = o.get( "type" );
				//  success('443 emailFound create batch ' + id + ' ' + type + ' json:' + JSON.stringify(batch));
				o.get( "recipientAddress" ).forEach( function ( addr, j ) {
					if ( !batch.hasOwnProperty( addr ) ) {
						batch[ addr ] = {};
						batch[ addr ].attr = {
							addr: addr
						};
					}
					recipient = batch[ addr ];
					//success(type, JSON.stringify(recipient));
					if ( !recipient.hasOwnProperty( type ) ) {
						recipient[ type ] = [];
					}
					data.groupName = groupName;

					recipient[ type ].push( data );
				} ); //eo loop over each email address
				//success(JSON.stringify(batch));

				for ( recipient in batch ) {
					++n;
					var _html;

					_html = getHtml( batch[ recipient ] );
					// success('\n\n', _html);
					batch[ recipient ].html = _html;
					//    success('120 '+JSON.stringify(batch[recipient]));
				} //eo loop over recipient in batch
			} ); //eo results.forEach
			//Order results
				function SortByStartDate(results){
						results.sort(function (a, b) {
								var aType = a.get("type");
								var bType = b.get("type");
								var data1 = a.get( "data" );
								var data2 = b.get( "data" );
								var dateBegin;
								if(aType=="homework") {
									dateBegin = data1.assigned;
								}else{
									dateBegin = data1.start;
								};
								var dateEnd;
								if(bType=="homework") {
									dateEnd = data2.assigned;
								}else{
									dateEnd = data2.start;
								};



								var date1 = new Date(dateBegin);
								var date2 = new Date(dateEnd);

								if(date1 < date2){
									return -1;
								};
								if(date1 > date2) {
									return 1
								};


								return 0;
							});
		 	}


			success( '#467 have resolved emailCreate promise, with total emails:' + n );
			promise.resolve(); //resolve the promise to go to the next step
		};
		success( '#470 entered emailCreate' );
		//query.limit = 1000;
		//    query.limit(MAXCOUNT);
		//    query.find({success: emailFound, error: error});
		resultsArray && resultsArray.length > 0 ? emailFound( resultsArray ) : promise.resolve( 'Error-emailCreate, no resultsArray' );
		return promise;
	} //eo emailCreate
	function getOrganizations( results ) { //the organizations object from the previous step is in the closure
		var promise = new Parse.Promise(); //do everything async using promises
		var ids = Object.keys( organizations ); //object Ids for the organisations we are working with
		var id = null;
		var name = null;
		//success('231',JSON.stringify(ids));
		var Organization = Parse.Object.extend( "Organization" );
		var query = new Parse.Query( Organization );
		var found = function ( results ) { //after we find the orgs pull what we need for the next step, rename not to conflict with top-level success fcn
			results.forEach( function ( o, i ) { //get the name etc
				id = o.id;
				name = o.get( "name" ); //now add this to the organizations
				organizations[ id ] = { //add an attributes object, plan for the future :)
					id: id, //local copy
					name: name
				};
			} ); //eo process results loop
			// success(JSON.stringify(organizations));
			success( '#482 have resolved getOrganizations promise, with total ids found:' + ids.length ); //resolve the promise with data for use in the next step
			// success('getOrganisations, '+ results); //log previous steps results
			promise.resolve();
		}; //eo found
		query.containedIn( 'objectId', ids ); //tell parse we want to find everything in the array of ids
		success( '#498 have entered getOrganizations with #ids:' + ids.length ); //resolve the promise with data for use in the next step
		//query.limit = 1000;
		query.limit( MAXCOUNT );
		query.find( {
			success: found,
			error: error
		} ); //find all the organisations
		return promise; //return promise, when resolved to to next step
	} //eo getOrganizations

	function sendEmails( results ) { //with the emails array pass along to mandrill and send out

		var _promise = new Parse.Promise(); //do everything async using promises, this is the top-level promise which is resolved only after we finish sending out all batches
		var ids = Object.keys( organizations ); //object Ids for the organisations we are working with
		var last = ids.length; //keep track of how many recursions to do
		var index = 0; //first one
		success( '#508 Send emails init' + ' ids.length:' + last + ' index:' + index );

		function getBody() { //todo: this is a critical function that generates an email 'body' based on the index
			var id = ids[ index ]; //the specific id for this batch
			var organization = organizations[ id ]; //which organization to use
			var batch = recipients[ id ]; //which set of emails to work with
			//console.log(JSON.stringify(batch));

			//
			var o = null;
			var merge_vars = [];
			var _to = [];
			//success('#504 !sendEmails getBody index:' + index + ' id:' + id + ' organization:' + JSON.stringify(organization) + ' batch:' + JSON.stringify(batch));
			for ( var p in batch ) {
				var addr = batch[ p ][ "attr" ][ "addr" ];
				var html = batch[ p ][ "html" ];
				var unescapeOrgName = unescape(organization.name);
				var custom = {
					"rcpt": addr,
					"vars": [
						{
							"name": "custom",
							"content": html
						},
						{
							"name": "customheading",
							"content": "<b>Update from " + unescapeOrgName + "</b>"
						}, //TODO: refactor to use: Update from OrganizationName instead of default    },
						{
							"name": "footer",
							"content": footer
						}
                    ]
				};

				merge_vars.push( custom );
				o = {
					"email": addr
				};
				_to.push( o );
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
						"subject": unescapeOrgName + " Update",
						"from_email": "no-reply@parentplanet.com",
						"from_name": unescapeOrgName,
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
			//    success('// id:'+id+' organization:'+JSON.stringify(organization)+' recipients:'+JSON.stringify(batch));
			//  success('********BODY\n'+JSON.stringify(body));
			//   success('#553 success for getBody id:'+id);
			return body; //global
		} //eo getBody
		function send( promise ) { //here is where an email is sent out from Mandrill using the passed in data
			var body = null;
			try {

				body = getBody();
				//success('149 '+JSON.stringify(body));
			} catch ( err ) {
				success( 'oops error sendEmails: ' + err );
			}
			promise = promise || new Parse.Promise(); //first time we send, there is no promise, so create one for recursion
			//   success('#565 Send for:'+index+' '+last);
			if ( index >= last ) { //have finished sending everything
				success( '#578 finished sendEmails recursion index>=last index calling quitSend() for:' + index + ' last:' + last );
				// status.success('have sent all emails last index: '+index);
				quitSend();
				return;
			}
			promise.then( send, quitSend ); //bind a recursive send until d.index === n call quitSend if error
			//  success('#573 Send done index:'+index);
			//++index;
			//promise.resolve(new Parse.Promise()); //recursion magic
			Parse.Cloud.httpRequest( { //connect to mandrill's api via a REST call
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				url: 'https://mandrillapp.com/api/1.0/messages/send-template.json',
				body: body, //this is where the specific emails are generated
				success: function ( httpResponse ) { //mandrill comes back OK
					var id = ids[ index ]; //the specific id for this batch
					var organization = organizations[ id ]; //which organization to use
					//success('#595 httpRequest --Email send success for index:'+index+' organization:'+organization.name+' id:'+id+' httpResponse:'+httpResponse.status);
					++index; //go to the next batch
					promise.resolve( new Parse.Promise() ); //recursion magic
				},
				error: function ( httpResponse ) { //problem with Mandrill, go to next batch
					var id = ids[ index ]; //the specific id for this batch
					var organization = organizations[ id ]; //which organization to use
					success( '#602 httpRequest !!Email send error for index:' + index + ' organization:' + organization.name + ' id:' + id + ' httpResponse:' + httpResponse.status );
					++index; //go to the next batch anyway
					promise.resolve( new Parse.Promise() ); //magic
				}
			} ); //eo httpRequest
		} //eo send
		function quitSend() {
			success( '#609 quitSend have sent all emails to Mandrill last index:' + index );
			_promise.resolve(); //resolve the top-level promise to go to the next/final step postprocess
		} //eo quitSend
		send(); //start off the recursive loop with no promise, look out for the spaghetti :)
		return _promise; //return the top-level promise, NOT one of the inner ones
	} //eo sendEmails
	function postprocess( results ) {
		var _promise = new Parse.Promise(); //outer promise
		//this is where we can clean up the data by deleting everything in the Email class, then resolving the promise inside the success handler
		//simply return the resolved promise to continue on to 'done'
		var ts = Math.round( new Date().getTime() / 1000 ); //USE TODAY OR TOMORROW INSTEAD OF YESTERDAY, OR SIMPLY FIND ALL?
		var tsYesterday = ts - ( 24 * 3600 );
		var dateYesterday = new Date( tsYesterday * 1000 );
		var flag = resultsArray && resultsArray.length > 0;
		var msg = flag ? ' postProcess resultsArray=' + resultsArray.length : ' undefined/no resultsArray to postProcess';
		//var Email = Parse.Object.extend("Email");
		//var query = new Parse.Query(Email);
		//delete everything
		//query.lessThan("createdAt", dateYesterday);
		success( '#632 entering postProcess, delete emails using resultsArray' ); //log previous steps results
		function recursiveDelete( results ) {
			var promise = null;
			var index = 0;

			function recursion() {
				promise = deleting( results[ index ] );
				//success('Deleted: '+ index);
				promise.then( function () {
					if ( index < results.length - 1 ) {
						++index;
						//    success('#641 recursive deleting for index:'+index+' results.length:'+results.length);
						recursion();
					} else {
						_promise.resolve(); //done deleting, resolve outer promise
					}
				} );
			} //eo recursion
			function deleting( result ) { //hmmm sometime result is undefined?
				var promise = new Parse.Promise();
				if ( !result ) {
					return promise.resolve();
				}
				result.destroy( {
					success: function () {
						promise.resolve();
					},
					error: function ( error ) {
						promise.resolve();
						success( 'PostProcess Error: ' + error );
					}
				} );
				return promise;
			} //eo deleting
			success( '#663 recursion loop index:' + index + msg );
			flag ? recursion() : $.noop(); //check to make sure we have good results to use
			success( "#662 PostProcess job completed, " );
		};
		flag ? recursiveDelete( resultsArray ) : _promise.resolve( msg );
		return _promise; //move to final function 'done'
	} //eo postprocess
	function postprocess0( results ) {
		var _promise = new Parse.Promise(); //outer promise
		//this is where we can clean up the data by deleting everything in the Email class, then resolving the promise inside the success handler
		//simply return the resolved promise to continue on to 'done'
		var ts = Math.round( new Date().getTime() / 1000 ); //USE TODAY OR TOMORROW INSTEAD OF YESTERDAY, OR SIMPLY FIND ALL?
		var tsYesterday = ts - ( 24 * 3600 );
		var dateYesterday = new Date( tsYesterday * 1000 );
		var Email = Parse.Object.extend( "Email" );
		var query = new Parse.Query( Email );
		//delete everything
		//query.lessThan("createdAt", dateYesterday);
		success( '#626 entering postProcess, finished up sending emails' ); //log previous steps results
		//query.limit = 1000;
		query.limit( MAXCOUNT );
		query.find( {
			success: function ( results ) {
				//success('19',JSON.stringify(results));
				var promise = null;
				var flag = results && results.length > 0;
				var index = 0;
				var msg = flag ? ' with results n=' + results.length : ' with undefined or no results to process';

				function recursion() {
					promise = deleting( results[ index ] );
					//success('Deleted: '+ index);
					promise.then( function () {
						if ( index < results.length - 1 ) {
							++index;
							//    success('#641 recursive deleting for index:'+index+' results.length:'+results.length);
							recursion();
						} else {
							_promise.resolve(); //done deleting, resolve outer promise
						}
					} );
				} //eo recursion
				function deleting( result ) { //hmmm sometime result is undefined?
					var promise = new Parse.Promise();
					if ( !result ) {
						return promise.resolve();
					}
					result.destroy( {
						success: function () {
							promise.resolve();
						},
						error: function ( error ) {
							promise.resolve();
							success( 'PostProcess Error: ' + error );
						}
					} );
					return promise;
				} //eo deleting
				success( '#660 entering delete recursion loop index:' + index + msg );
				flag ? recursion() : $.noop(); //check to make sure we have good results to use
				success( "#662 PostProcess job completed, " + msg );
			},
			error: function ( error ) { //IF ERROR THEN GO ON TO LOG IT AND NEXT STAGE
				success( "#665 PostProcess Error in delete query error: " + error );
				//   alert('Error in delete query');
			}
		} );
		return _promise; //move to final function 'done'
	} //eo postprocess
	function start( results ) { //initialize everything, could set organizations, recipients here
		var promise = new Parse.Promise();
		var date = new Date();
		success( '                  #677 Start() sending emails on:' + date + ' results:' + results );
		date = date.toString();
		results = results ? results : resultsArray;
		success( '                  #684 results set using array? length:' + results.length );
		skip = skip + results.length; //keep track of the offset
		return promise.resolve( results );
	}; //eo start
	function done( msg ) { //last link in the chain, respond to the initial cloud run request here
		var date = new Date();
		date = date.toString();
		skip = parseInt( skip );
		total = parseInt( total );
		var listEmail = '';
		var emailArray= [];
		/*if(resultsArray && resultsArray.length > 0){
			for (var i = 0; i < resultsArray.length; i++) {
				var obj = resultsArray[i];
				if(obj!=undefined){
					var resObj = {
							recipientAddress:obj.recipientAddress,
							title : obj.data.title,
							groupName: obj.data.groupName
					};
					emailArray.push(resObj);
				}
			}

			listEmail = JSON.stringify(emailArray);
			succes("List Email:" + listEmail);
		}*/
		msg = msg ? msg : '';
		msg = msg + ' #742 Done() sending emails on:' + date + ' total=' + total + ' ,listEmail=' + listEmail;

		success( msg );
		success( '****************************************************************************************' );
		success( '****************************************************************************************' );
		success( ' ' );
		status.success( msg );
		if ( total > skip ) {
			success( '------------ skip<=total another batchSender() call' );
			batchSender(); //decide what to do, continue or finish up and exit
		} else {
			success( '------------ skip>total no more batchSender() calls' );
			bigPromise.resolve( 'Really, really all done' );
		}
	}; //eo done
	/*



	 * this is the main function(s) of emailSender to be called as a serial chain of promises
	 * batchSender() is call after a successful 'count' query
	 * if error, then job never starts!
	 * use the count to set the total number of emails to send, use skip to offset, as the limit to return is set to 1000
	 * after each 'batch' is done test to see if there are still more to go out; if yes -> repeat else -> really done
	 * set 'skip' after each set of new emails have been returned -> skip = results.length
	 * set 'total' only after a successful count query!
	 * decide what to do in done()
	 */


	function batchSender() {
		var Email = Parse.Object.extend( "Email" ); //actually could use Email declared at top scope :)
		var query = new Parse.Query( Email ); //ditto, but do it here and then clean up later by removing top scope vars
		success( '****************************************************************************************' );
		success( '****************************************************************************************' );
		success( '                  #772 Main Driver batchSender() with skip:' + skip + ' use .each instead!' );

		//    query.find({success: start, error: error}) //find all the emails to be sent, timestamp it and go to next link
		success( '                  #Start-Queryyyyyyyyyyy' );


		success( '                  #End-Queryyyyyyyyyyy' );
		query.each( function ( email ) {
				resultsArray = resultsArray ? resultsArray : [];

				resultsArray.push( email );
				//checkData('batchSender', email.data);
			}, {
				success: start,
				error: error
			} )
			.then( getGroups, error ) //search for OrganizationGroup
			.then( emailCreate, error ) //then returns a promise, chain it to the next step
			.then( getOrganizations, error ) //now get the names of the organizations
			.then( sendEmails, error ) //send out emails per organizations
			.then( postprocess, error ) //final clean up
			.then( done ); //eo end cloud run, timestamp
	}; //eo batchSender
	/*
	    According to documentation Parse has default limit of 100 for query results. The maximum number of returned objects can be set with a limit property:
	    query.limit = 1000;
	    However Parse has a hard limit of 1000 objects at maximum per a request. To get all your 5000 objects loaded you have to make several finds. For each find one has to set skip property of the query:
	    query.skip = 0;
	    NSArray *objs1 = [query findObjects]; // first 1000 objects
	    query.skip = 1000;
	    NSArray *objs2 = [query findObjects]; // next 1000 objects
	    // and so on ...
	*/
	/*
	 ***************************************************************
	 * STARTUP EVERYTHING HERE BY QUERYING NUMBER OF RECORDS IN EMAIL
	 ***************************************************************
	 */
	function boot() {
		bigPromise = new Parse.Promise();
		success( '#750 boot called!' );
		query.count( {
			success: function ( count ) {
				total = count; //initialization
				skip = 0; //start with very first email
				success( '#817 --------------- success startup count:' + count + ' initial skip:' + skip ); //log previous steps results
				batchSender(); //first call to batchSender
			},
			error: function ( err, count ) {
        console.log('---------------------------');
        console.log(err);
				success( '#820 --------------- error: ' + err + ' count:' + count + ' initial skip:' + skip ); //log previous steps results
			}
		} );
		success( '#762 returning bigPromise!' );
		return bigPromise;
	}; //eo boot;

	boot()
		.then( function ( msg ) {
			success( '#759 final promise resolved, ' + msg );
		} );

	/*
	 *
	 */
	/*
	 * Date Format 1.2.3
	 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
	 * MIT license
	 *
	 * Includes enhancements by Scott Trenda <scott.trenda.net>
	 * and Kris Kowal <cixar.com/~kris.kowal/>
	 *
	 * Accepts a date, a mask, or a date and a mask.
	 * Returns a formatted version of the given date.
	 * The date defaults to the current date/time.
	 * The mask defaults to dateFormat.masks.default.
	 *
	 * Usage Example for ParentPlanet
	   today = new Date(); //any Date object, so can be: x = new Date(d.start); for P2 etc.
	   var dateString = today.format("dd-m-yy");
	   > "19-8-15"
	   dateString = today.format('ddd mmm dd @ HH:MM');
	   > "Wed Aug 19 @ 10:38"
	   dateString = today.format();
	   > "Wed Aug 19 @ 10:38"
	 */
	var dateFormat = function () {
		var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
			timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
			timezoneClip = /[^-+\dA-Z]/g,
			pad = function ( val, len ) {
				val = String( val );
				len = len || 2;
				while ( val.length < len ) val = "0" + val;
				return val;
			};
		// Regexes and supporting functions are cached through closure
		return function ( date, mask, utc ) {
			var dF = dateFormat;
			var _ = utc ? "getUTC" : "get",
				d = date[ _ + "Date" ](),
				D = date[ _ + "Day" ](),
				m = date[ _ + "Month" ](),
				y = date[ _ + "FullYear" ](),
				H = date[ _ + "Hours" ](),
				M = date[ _ + "Minutes" ](),
				s = date[ _ + "Seconds" ](),
				L = date[ _ + "Milliseconds" ](),
				o = utc ? 0 : date.getTimezoneOffset(),
				flags = {
					d: d,
					dd: pad( d ),
					ddd: dF.i18n.dayNames[ D ],
					dddd: dF.i18n.dayNames[ D + 7 ],
					m: m + 1,
					mm: pad( m + 1 ),
					mmm: dF.i18n.monthNames[ m ],
					mmmm: dF.i18n.monthNames[ m + 12 ],
					yy: String( y ).slice( 2 ),
					yyyy: y,
					h: H % 12 || 12,
					hh: pad( H % 12 || 12 ),
					H: H,
					HH: pad( H ),
					M: M,
					MM: pad( M ),
					s: s,
					ss: pad( s ),
					l: pad( L, 3 ),
					L: pad( L > 99 ? Math.round( L / 10 ) : L ),
					t: H < 12 ? "a" : "p",
					tt: H < 12 ? "am" : "pm",
					T: H < 12 ? "A" : "P",
					TT: H < 12 ? "AM" : "PM",
					Z: utc ? "UTC" : ( String( date ).match( timezone ) || [ "" ] ).pop().replace( timezoneClip, "" ),
					o: ( o > 0 ? "-" : "+" ) + pad( Math.floor( Math.abs( o ) / 60 ) * 100 + Math.abs( o ) % 60, 4 ),
					S: [ "th", "st", "nd", "rd" ][ d % 10 > 3 ? 0 : ( d % 100 - d % 10 != 10 ) * d % 10 ]
				};
			// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
			if ( arguments.length == 1 && Object.prototype.toString.call( date ) == "[object String]" && !/\d/.test( date ) ) {
				mask = date;
				date = undefined;
			}
			// Passing date through Date applies Date.parse, if necessary
			date = date ? new Date( date ) : new Date;
			if ( isNaN( date ) ) throw SyntaxError( "invalid date" );
			mask = String( dF.masks[ mask ] || mask || dF.masks[ "default" ] );
			// Allow setting the utc argument via the mask
			if ( mask.slice( 0, 4 ) == "UTC:" ) {
				mask = mask.slice( 4 );
				utc = true;
			}
			return mask.replace( token, function ( $0 ) {
				return $0 in flags ? flags[ $0 ] : $0.slice( 1, $0.length - 1 );
			} );
		};
	}(); //self-executing fcn. which will be added as a property to Date :)
	// Some common format strings
	dateFormat.masks = {
		"default": "ddd mmm dd @ HH:MM TT Z",
		friendly: "ddd mmm dd yyyy HH:MM:ss",
		shortDate: "m/d/yy",
		mediumDate: "mmm d, yyyy",
		longDate: "mmmm d, yyyy",
		fullDate: "dddd, mmmm d, yyyy",
		shortTime: "h:MM TT",
		mediumTime: "h:MM:ss TT",
		longTime: "h:MM:ss TT Z",
		isoDate: "yyyy-mm-dd",
		isoTime: "HH:MM:ss",
		isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
		isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
	}; //eo .masks
	// Internationalization strings
	dateFormat.i18n = {
		dayNames: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
		monthNames: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]
	}; //eo .i18n
	// For convenience...add this to the js Date object
	Date.prototype.format = function ( mask, utc ) {
		return dateFormat( this, mask, utc );
	}; //
} ); //eo emailSender
Parse.Cloud.define( "delete", function ( request, status ) {
	Parse.Cloud.useMasterKey();
	var _promise = new Parse.Promise(); //outer promise
	success( '#814 delete Job postProcess, finished up deleting emails' ); //log previous steps results
	function success( str ) { //general success handler, returned data from previous/current promise written to console, see notes
		var len = arguments.length;
		str = str ? str : null;
		if ( !str ) {
			str = '';
			for ( var i = 0; i < len; i++ ) {
				str += arguments[ i ] + ' ';
			}
		}
		//   console.log('emailSender Log:' + str);
		//    status.message(str);
		return str; //return data to use somewhere else, maybe
	} //eo general success handler
	//this is where we can clean up the data by deleting everything in the Email class, then resolving the promise inside the success handler
	//simply return the resolved promise to continue on to 'done'
	var ts = Math.round( new Date().getTime() / 1000 ); //USE TODAY OR TOMORROW INSTEAD OF YESTERDAY, OR SIMPLY FIND ALL?
	var tsYesterday = ts - ( 24 * 3600 );
	var dateYesterday = new Date( tsYesterday * 1000 );
	var Email = Parse.Object.extend( "Email" );
	var query = new Parse.Query( Email );
	//delete everything
	//query.lessThan("createdAt", dateYesterday);
	// query.limit = 1000;
	query.limit( MAXCOUNT );
	query.find( {
		success: function ( results ) {
			//success('19',JSON.stringify(results));
			var promise = null;
			var index = 0;

			function recursion() {
				promise = deleting( results[ index ] );
				//success('Deleted: '+ index);
				promise.then( function () {
					if ( index < results.length - 1 ) {
						++index;
						recursion();
					} else {
						_promise.resolve();
						status.success( 'Success: done deleting emails' ); //done deleting, resolve outer promise
					}
				} );
			} //eo recursion
			function deleting( result ) {
				var promise = new Parse.Promise();
				//    success('Before destroy: ', result.id, 'index: ', index);
				result.destroy( {
					success: function () {
						success( 'Destroy success: ', result.id, 'index: ', index );
						promise.resolve();
					},
					error: function ( error ) {
						success( 'Destroy failed: ', result.id, 'index: ', index );
						promise.resolve();
						success( 'PostProcess Error: ' + error );
					}
				} );
				return promise;
			} //eo deleting
			recursion();
			success( "PostProcess job completed" );
		},
		error: function ( error ) { //IF ERROR THEN GO ON TO LOG IT AND NEXT STAGE
			success( "Error in delete query error: " + error );
			//   alert('Error in delete query');
		}
	} );
	return _promise; //move to final function 'done'
} ); //eo delete
Parse.Cloud.define( "modifyUser", function ( request, response ) {
	if ( !request.user ) {
		response.error( "Must be signed in to call this Cloud Function." )
		return;
	}
	// The user making this request is available in request.user
	// Make sure to first check if this user is authorized to perform this change.
	// One way of doing so is to query an Admin role and check if the user belongs to that Role.
	// Replace !authorized with whatever check you decide to implement.
	// sxm todo!
	/*
  if (!authorized) {
    response.error("Not an Admin.")
    return;
  }
 */
	// The rest of the function operates on the assumption that request.user is *authorized*
	Parse.Cloud.useMasterKey();
	// Query for the user to be modified by username
	// The username is passed to the Cloud Function in a
	// key named "username". You can search by email or
	// user id instead depending on your use case.
	var query = new Parse.Query( Parse.User );
	var userId = request.params.userId;
	var firstName = request.params.firstName;
	var lastName = request.params.lastName;
	query.equalTo( "objectId", userId );
	// Get the first user which matches the above constraints.
	query.first( {
		success: function ( user ) {
			// Successfully retrieved the user.
			// Modify any parameters as you see fit.
			// You can use request.params to pass specific
			// keys and values you might want to change about
			// this user.
			user.set( "firstName", firstName );
			user.set( "lastName", lastName );

			// Save the user.
			user.save( null, {
				success: function ( user ) {
					// The user was saved successfully.
					response.success( "Successfully updated user:" + userId );
				},
				error: function ( gameScore, error ) {
					// The save failed.
					// error is a Parse.Error with an error code and description.
					response.error( "Could not save changes to user:" + userId );
				}
			} );
		},
		error: function ( error ) {
			response.error( "Could not find user:" + userId );
		}
	} );
} );
//send out our own email verification
/*
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  var user = request.object;
  var name = user.get('username');

  console.log('Before SAVE');
    console.log("name:"+name);

    response.success();
});

// log the after-save too, to confirm it was saved
Parse.Cloud.afterSave(Parse.User, function(request, response) {
    var user = request.object;
      var name = user.get('username');

  console.log('After SAVE');
    console.log("name:"+name);
});
*/
/* Notes
with "console.log" statements: on your telnet session use "parse log -f", to quickly find the problem!!
*/

Parse.Cloud.define( "pushToDevice", function ( request, response ) {
	var message = request.params.message;
	console.log( message );
	if ( message != null && message !== "" ) {
		message = message.trim();
	} else {
		response.error( "Must provide \"message\" in JSON data" );
		return;
	}

	// Can see this at https://www.parse.com/apps/{APP_NAME}/cloud_code/log
	// var logMessage = "Sending to all installations".format(message);
	// console.log(logMessage);

	var pushQuery = new Parse.Query( Parse.Installation );
	// pushQuery.containedIn("deviceType", ["ios"]); // errors if no iOS certificate
	pushQuery.containedIn( "deviceToken", [ "1ba7d2d8bba1af6f801e90910f11ee8ae91a8995fc512ad9fa32b22e4e4bd600" ] ); // errors if no iOS certificate

	// pushQuery.find({useMasterKey: true}).then(
	// 	function ( results ) {
	// 		console.log( results );
	// 	},
	// 	function ( error ) {
	// 		console.log( 'Error while finding UserParentRelation' + error );
	// 	}
	// );
  //

	// Send push notification to query
	Parse.Push.send( {
		where: pushQuery, // Set our installation query
		data: {
			"alert": message
		}
	}, {
		success: function () {
			// Push was successful
			console.log( "Message was sent successfully" );
			response.success( 'true' );
		},
		error: function ( error ) {
			response.error( error );
		},
		useMasterKey: true
	} );
} );
