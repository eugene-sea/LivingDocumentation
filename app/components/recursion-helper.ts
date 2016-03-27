/// <reference path="../../typings/angularjs/angular.d.ts" />

export class RecursionHelper {
    static $inject = ['$compile'];

    constructor(private $compile: ng.ICompileService) { }

    compile(
        element: ng.IAugmentedJQuery, linkArg?: ng.IDirectiveLinkFn | ng.IDirectivePrePost): ng.IDirectivePrePost {
        let link: ng.IDirectivePrePost;

        // Normalize the link parameter
        if (angular.isFunction(linkArg)) {
            link = { post: <ng.IDirectiveLinkFn>linkArg };
        }

        // Break the recursion loop by removing the contents
        let contents = element.contents().remove();
        let compiledContents: ng.ITemplateLinkingFunction;
        let _this = this;
        return {
            post: function(scope, e) {
                // Compile the contents
                if (!compiledContents) {
                    compiledContents = _this.$compile(contents);
                }

                // Re-add the compiled contents to the element
                compiledContents(scope, function(clone) {
                    e.append(clone);
                });

                // Call the post-linking function, if any
                if (link && link.post) {
                    link.post.apply(null, arguments);
                }
            },
            pre: link && link.pre ? link.pre : null
        };
    }
}

angular.module('livingDocumentation.services.recursionHelper', [])
    .service('recursionHelper', RecursionHelper);
