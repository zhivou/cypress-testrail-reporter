"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypressTestRailReporter = void 0;
var mocha_1 = require("mocha");
var moment = require("moment");
var testrail_1 = require("./testrail");
var shared_1 = require("./shared");
var testrail_interface_1 = require("./testrail.interface");
var testrail_validation_1 = require("./testrail.validation");
var TestRailCache = require('./testrail.cache');
var TestRailLogger = require('./testrail.logger');
var chalk = require('chalk');
var runCounter = 1;
var CypressTestRailReporter = /** @class */ (function (_super) {
    __extends(CypressTestRailReporter, _super);
    function CypressTestRailReporter(runner, options) {
        var _this = _super.call(this, runner) || this;
        _this.results = [];
        _this.suiteId = [];
        _this.serverTestCaseIds = [];
        _this.reporterOptions = options.reporterOptions;
        if (process.env.CYPRESS_TESTRAIL_REPORTER_USERNAME) {
            _this.reporterOptions.username = process.env.CYPRESS_TESTRAIL_REPORTER_USERNAME;
        }
        if (process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD) {
            _this.reporterOptions.password = process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD;
        }
        if (process.env.CYPRESS_TESTRAIL_REPORTER_RUNNAME) {
            _this.reporterOptions.runName = process.env.CYPRESS_TESTRAIL_REPORTER_RUNNAME;
        }
        if (process.env.CYPRESS_TESTRAIL_REPORTER_GROUPID) {
            _this.reporterOptions.runName = process.env.CYPRESS_TESTRAIL_REPORTER_GROUPID;
        }
        if (process.env.CYPRESS_TESTRAIL_RUN_ID) {
            TestRailCache.store('runId', process.env.CYPRESS_TESTRAIL_RUN_ID);
        }
        _this.testRailApi = new testrail_1.TestRail(_this.reporterOptions);
        _this.testRailValidation = new testrail_validation_1.TestRailValidation(_this.reporterOptions);
        /**
         * This will validate reporter options defined in cypress.json file
         * if we are passing suiteId as a part of this file than we assign value to variable
         * usually this is the case for single suite projects
         */
        _this.testRailValidation.validateReporterOptions(_this.reporterOptions);
        if (_this.reporterOptions.suiteId) {
            _this.suiteId = _this.reporterOptions.suiteId;
        }
        /**
         * This will validate runtime environment variables
         * if we are passing suiteId as a part of runtime env variables we assign that value to variable
         * usually we use this way for multi suite projects
         */
        var cliArguments = _this.testRailValidation.validateCLIArguments();
        if (cliArguments && cliArguments.length) {
            _this.suiteId = cliArguments;
        }
        /**
         * If no suiteId has been passed with previous two methods
         * runner will not be triggered
         */
        if (_this.suiteId && _this.suiteId.toString().length) {
            console.debug(runner);
            runner.on('start', function () {
                /**
                * runCounter is used to count how many spec files we have during one run
                * in order to wait for close test run function
                */
                TestRailCache.store('runCounter', runCounter);
                /**
                * creates a new TestRail Run
                * unless a cached value already exists for an existing TestRail Run in
                * which case that will be used and no new one created.
                */
                if (!TestRailCache.retrieve('runId')) {
                    TestRailLogger.warn('Starting with following options: ');
                    console.debug(_this.reporterOptions);
                    if (_this.reporterOptions.suiteId) {
                        TestRailLogger.log("Following suiteId has been set in cypress.json file: " + _this.suiteId);
                    }
                    var executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
                    var name_1 = (_this.reporterOptions.runName || 'Automated test run') + " " + executionDateTime;
                    if (_this.reporterOptions.disableDescription) {
                        var description = '';
                    }
                    else {
                        if (process.env.CYPRESS_CI_JOB_URL) {
                            var description = process.env.CYPRESS_CI_JOB_URL;
                        }
                        else {
                            var description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
                        }
                    }
                    TestRailLogger.log("Creating TestRail Run with name: " + name_1);
                    _this.testRailApi.createRun(name_1, description, _this.suiteId);
                }
                else {
                    // use the cached TestRail Run ID
                    _this.runId = TestRailCache.retrieve('runId');
                    TestRailLogger.log("Using existing TestRail Run with ID: '" + _this.runId + "'");
                }
            });
            runner.on('pass', function (test) {
                _this.submitResults(testrail_interface_1.Status.Passed, test, "Execution time: " + test.duration + "ms");
            });
            runner.on('fail', function (test, err) {
                _this.submitResults(testrail_interface_1.Status.Failed, test, "" + err.message);
            });
            runner.on('retry', function (test) {
                _this.submitResults(testrail_interface_1.Status.Retest, test, 'Cypress retry logic has been triggered!');
            });
        }
        return _this;
    }
    /**
     * Ensure that after each test results are reported continuously
     * Additionally to that if test status is failed or retried there is possibility
     * to upload failed screenshot for easier debugging in TestRail
     * Note: Uploading of screenshot is configurable option
     */
    CypressTestRailReporter.prototype.submitResults = function (status, test, comment) {
        var _this = this;
        var caseIds = shared_1.titleToCaseIds(test.title);
        if (caseIds.length) {
            caseIds.map(function (caseId) {
                _this.testRailApi.publishResult({
                    case_id: caseId,
                    status_id: status,
                    comment: "Execution time: " + test.duration + "ms, case_id: " + caseId,
                }).then(function (response) {
                    if (_this.reporterOptions.allowFailedScreenshotUpload === true && (status === testrail_interface_1.Status.Failed || status === testrail_interface_1.Status.Retest)) {
                        _this.testRailApi.uploadScreenshots(caseId, response[0].id);
                    }
                });
            });
        }
    };
    return CypressTestRailReporter;
}(mocha_1.reporters.Spec));
exports.CypressTestRailReporter = CypressTestRailReporter;
//# sourceMappingURL=cypress-testrail-reporter.js.map