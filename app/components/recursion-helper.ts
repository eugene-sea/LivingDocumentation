/// <reference path="../../typings/angularjs/angular.d.ts" />

'use strict';

module livingDocumentation {
    export class RecursionHelper {
        static $inject = ['$compile'];

        constructor(private $compile: ng.ICompileService) { }

        compile(
            element: ng.IAugmentedJQuery, linkArg?: ng.IDirectiveLinkFn | ng.IDirectivePrePost): ng.IDirectivePrePost {
            var link: ng.IDirectivePrePost;
            
            // Normalize the link parameter
            if (angular.isFunction(linkArg)) {
                link = { post: <ng.IDirectiveLinkFn>linkArg };
            }

            // Break the recursion loop by removing the contents
            var contents = element.contents().remove();
            var compiledContents: ng.ITemplateLinkingFunction;
            var _this = this;
            return {
                pre: (link && link.pre) ? link.pre : null,
                post: function(scope, element) {
                    // Compile the contents
                    if (!compiledContents) {
                        compiledContents = _this.$compile(contents);
                    }
                    
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function(clone) {
                        element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if (link && link.post) {
                        link.post.apply(null, arguments);
                    }
                }
            };
        }
    }

    angular.module('livingDocumentation.services.recursionHelper', [])
        .service('recursionHelper', RecursionHelper);
}
