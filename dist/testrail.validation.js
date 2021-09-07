"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRailValidation = void 0;
var glob = require('glob');
var TestRailLogger = require('./testrail.logger');
var TestRailValidation = /** @class */ (function () {
    function TestRailValidation(options) {
        this.options = options;
    }
    TestRailValidation.prototype.validateReporterOptions = function (reporterOptions) {
        if (!reporterOptions) {
            throw new Error('Missing reporterOptions in cypress.json');
        }
        this.validate(reporterOptions, 'host');
        this.validate(reporterOptions, 'username');
        this.validate(reporterOptions, 'password');
        this.validate(reporterOptions, 'projectId');
        if (this.options.suiteId) {
            this.validate(reporterOptions, 'suiteId');
        }
        return reporterOptions;
    };
    TestRailValidation.prototype.validate = function (options, name) {
        if (options[name] == null) {
            throw new Error("Missing " + name + " value. Please update options in cypress.json");
        }
    };
    /**
     * This function will validate do we pass suiteId as a CLI agrument as a part of command line execution
     * Example:
     * CYPRESS_ENV="testRailSuiteId=1"
     * npx cypress run --env="${CYPRESS_ENV}"
     */
    TestRailValidation.prototype.validateCLIArguments = function () {
        // Read and store cli arguments into array
        var cliArgs = process.argv.slice(2);
        // Search array for a specific string and store into variable
        var index, value, result;
        for (index = 0; index < cliArgs.length; ++index) {
            value = cliArgs[index];
            if (value.includes('testRailSuiteId') === true) {
                result = value;
                break;
            }
        }
        if (result != undefined) {
            /**
             * Search for specific variable in case that previous command contains multiple results
             * Split variables
             */
            var resultArrayArgs = result.split(/,/);
            for (index = 0; index < resultArrayArgs.length; ++index) {
                value = resultArrayArgs[index];
                if (value.includes('testRailSuiteId') === true) {
                    result = value;
                    break;
                }
            }
            // Split variable and value
            var resultArray = result.split(/=/);
            // Find value of suiteId and store it in envVariable
            var suiteId = resultArray.find(function (el) { return el.length < 15; });
            if (suiteId.length != 0) {
                TestRailLogger.log("Following suiteId has been set in runtime environment variables: " + suiteId);
            }
            return suiteId;
        }
    };
    return TestRailValidation;
}());
exports.TestRailValidation = TestRailValidation;
//# sourceMappingURL=testrail.validation.js.map