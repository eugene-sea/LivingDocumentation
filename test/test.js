Error.stackTraceLimit = Infinity;

__karma__.loaded = function () { };

System.import('test/main')
    .then(function () {
        __karma__.start();
    }, function (error) {
        __karma__.error(error.name + ": " + error.message);
    });
