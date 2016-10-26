Parse.Cloud.job("delete", function(request, status) {
    Parse.Cloud.useMasterKey();
    var _promise = new Parse.Promise(); //outer promise
    success('postProcess, finished up deleting emails'); //log previous steps results
    //this is where we can clean up the data by deleting everything in the Email class, then resolving the promise inside the success handler
    //simply return the resolved promise to continue on to 'done'
    var ts = Math.round(new Date().getTime() / 1000); //USE TODAY OR TOMORROW INSTEAD OF YESTERDAY, OR SIMPLY FIND ALL?
    var tsYesterday = ts - (24 * 3600);
    var dateYesterday = new Date(tsYesterday*1000);
    var Email = Parse.Object.extend("Email");
    var query = new Parse.Query(Email);
    //delete everything
    //query.lessThan("createdAt", dateYesterday);
    query.find({
        success: function(results) {
            //success('19',JSON.stringify(results));
            var promise = null;
            var index = 0;
            function recursion () {
                promise = deleting(results[index]);
                //success('Deleted: '+ index);
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
}); //eo delete