var utils;
(function (utils) {
    'use strict';
    function wrapInjectionConstructor(constructor, transformer) {
        return (constructor.$inject || []).concat(function () {
            var functionConstructor = constructor.bind.apply(constructor, [null].concat(Array.prototype.slice.call(arguments, 0)));
            var res = new functionConstructor();
            return !transformer ? res : transformer(res);
        });
    }
    utils.wrapInjectionConstructor = wrapInjectionConstructor;
    function wrapFilterInjectionConstructor(constructor) {
        return utils.wrapInjectionConstructor(constructor, function (f) {
            return f.filter.bind(f);
        });
    }
    utils.wrapFilterInjectionConstructor = wrapFilterInjectionConstructor;
    function format(format) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return format.replace(/{(\d+)}/g, function (match, index) {
            return typeof args[index] !== 'undefined'
                ? args[index]
                : match;
        });
    }
    utils.format = format;
})(utils || (utils = {}));
//# sourceMappingURL=utils.js.map