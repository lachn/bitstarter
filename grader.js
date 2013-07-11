#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://lit-garden-6868.herokuapp.c/";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};
var assertURLExists = function(inURL) {
    return inURL;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioURL = function(url) {
    return cheerio.load(url);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    return checks($, checksfile);
};

var checkURL = function(urlResult, checksfile) {
    $ = cheerioURL(urlResult);
    return checks($, checksfile);
};

var checks = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var doHtmlFile = function(htmlfile, checksfile) {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var doURL = function(url, checksfile) {
    var afterLoadURL = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
	    var checkJson = checkURL(result, checksfile);
	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
        }
    };
    rest.get(url).on('complete', afterLoadURL);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file [html_file]', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url [url]', 'Url to check', clone(assertURLExists), URL_DEFAULT)
        .parse(process.argv);
    if (program.file != HTMLFILE_DEFAULT) {
 	console.error('html non default');
	doHtmlFile(program.file, program.checks);
	} else if (program.url != URL_DEFAULT) {
	    console.error('url non default');
	    doURL(program.url, program.checks);
	    } else {
		console.error('html default');
		doHtmlFile(program.file, program.checks);
		}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
