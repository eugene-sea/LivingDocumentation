// Karma configuration
// Generated on Thu Aug 20 2015 12:39:30 GMT+0300 (EEST)

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['systemjs', 'mocha'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/should/should.js',
      'app/bower_components/angular/angular.min.js',
      'app/bower_components/underscore/underscore-min.js',
      'app/**/*.ts',
      'test/*.ts'
    ],

    systemjs: {
      config: {
        paths: {
          systemjs: 'node_modules/systemjs/dist/system.js',
          typescript: 'node_modules/typescript/lib/typescript.js'
        },
        transpiler: 'typescript',
        packages: {
          'node_modules': { },
          'app/bower_components': { },
          'app': { defaultExtension: 'ts' },
          'test': { defaultExtension: 'ts' }
        }
      }
    },

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
