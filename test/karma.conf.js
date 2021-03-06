// Karma configuration
// Generated on Thu Aug 20 2015 12:39:30 GMT+0300 (EEST)

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'app/node_components/es6-shim/es6-shim.js',
      'app/node_components/zone.js/zone.js',
      'app/node_components/reflect-metadata/Reflect.js',
      'app/node_components/systemjs/system.src.js',
      'test/system-config.js',
      'app/node_components/underscore/underscore.js',
      'app/node_components/rxjs/Rx.js',
      'test/test.js',
      { pattern: 'app/**/*.ts', included: false },
      { pattern: 'app/node_components/typescript/typescript.js', included: false },
      { pattern: 'app/node_components/@angular/**/*.js', included: false },
      { pattern: 'app/node_components/@ng-bootstrap/ng-bootstrap/ng-bootstrap.js', included: false },
      { pattern: 'test/*.ts', included: false }
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],

    proxies: {
      "/@angular/": "/base/app/node_components/@angular/",
      "/app/": "/base/app/",
      "/test/": "/base/test/",
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  })
}
