/*
 * grunt-compile-i18n
 * https://github.com/tomasruizr/grunt-compile-i18n
 *
 * Copyright (c) 2014 Tomas Ruiz
 * Licensed under the MIT license.
 */

'use strict';
var i18nCompiler = require('./../i18nCompiler.js');
var path = require('path');
var processor = require('./compilerProcessor.js');
var fs = require('fs-extra');
var _ = require('lodash');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('compile_i18n', 'Creates folders for scripts/templates for every language supported in the application.', function() {
        var p = new processor();
        var options = this.options({
            openLocalizationTag : '<%', 
            closeLocalizationTag : '%>', 
            localizationFunction : '__',
            markedOnly : true,
            localesFolder: './locales',
            defaultPlurals : {
                fewLimit : '10',
                manyLimit : '20'
            },
            /**
             * Default Callback function to call specifying what to do to
             *         process the localization. it can be overrided in the
             *         options of the gruntFile.
             *
             * @method callbackFunction
             *
             * @param  {string}         str   the string to be localized
             * @param  {object}         data  the object representing the data
             *         that's going to be passed as parameters to the
             *         localization function in the client side.
             * @param  {bool}         quote whether to quote the values or not.
             *
             * @return {string}               The string to be puted in place of
             *         the localization string.
             */
            callbackFunction : function(str, data, quote) {
                quote = quote | false;
                var i18n = new i18nCompiler('en');
                //if there is no data to translate.
                var result = '';
                if (!data){
                    result = quote ? '"' + (i18n.compile(str)()) + '"' : (i18n.compile(str)());
                }
                else{
                    result = '(' + i18n.precompile(i18n.parse(str), data) + ')('+ data +')';
                }
                return result;
            }
            
        });  
        // console.log(this);
        // console.log(this.files);
        var i18n = new i18nCompiler('en');
        var src = new Array();
        //gather all valid src files.
        this.files.forEach(function(f) {
            src = f.src.filter(function(filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                  grunt.log.warn('Source file ' + filepath + ' not found.');
                  return false;
                } else {
                  return true;
                }
            });
        });
        //iterating the folders for each localization           
        var localesFolderDir = fs.readdirSync(options.localesFolder);
        // iterate each locale folder
        for (var lc = 0; lc < localesFolderDir.length; lc++) {
            var lang = localesFolderDir[lc];

            var destLangFolder = path.join(this.files[0].dest, lang);
            //Report progress to console.
            grunt.log.writeln('Compiling language: ' + lang + ' in the folder: ' + destLangFolder);
            

            //ensure the folder exists or create it.
            fs.ensureDirSync(destLangFolder);
            var stat = fs.statSync(destLangFolder);
            if (stat && stat.isDirectory()) {
                var replacesCount = 0;
                var locales = JSON.parse(fs.readFileSync(path.join(options.localesFolder, lang, lang + '.json'), 'utf8'));
                
                var fileStr = '';
                var fileName = '';
                // var newFile = '';   
                //For each file in the source.
                for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
                    fileName = src[srcCount];
                    fileStr = fs.readFileSync(fileName, 'utf8');
                    //get the locals in each files
                    p.getI18nStrings(path.extname(fileName), fileStr, options, function(strArray){
                        //For each local in the source.
                        for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
                            var rawLocaleArr = strArray[strArrayCont];
                            //key to search in the json file.
                            var localeStr = p.purifyLocal(rawLocaleArr[1]);
                            //Data of the sentence if it exists
                            var localeData = p.purifyData(rawLocaleArr[1]);
                            //Ignore if only translating the Marked As Translated Strings and is falase.
                            if (options.markedOnly && !locales[localeStr].translated){
                                fileStr = p.replaceAll(fileStr, rawLocaleArr[0], rawLocaleArr[1]);
                            }
                            else{
                                var tValue = options.callbackFunction(locales[localeStr].translation, localeData, path.extname(fileName) == '.js');
                                fileStr = p.replaceAll(fileStr, rawLocaleArr[0], tValue);
                                replacesCount += p.countReplaces(fileStr, rawLocaleArr[1], tValue);
                            }
                            //translated Value.
                            
                            
                        }
                    });
                    
                    var dFile = fileName.split('/');
                    if (dFile[0] === '.'){
                        dFile.splice(0,1);
                    }
                    dFile.splice(0,1);
                    var dFilename = dFile.join(path.sep);
                    // console.log(dFilename);
                    // console.log(path.join(dFile));
                    fs.ensureDirSync(path.dirname(path.join(destLangFolder, dFilename)));
                    fs.writeFileSync(path.join(destLangFolder, dFilename), fileStr);
                    
                }
                //Report Totals
                //Filter only the locals that are translated
                    
                grunt.log.writeln('Total of translated strings to replace: ' + Object.keys(_.pick(locales, function(value, key){return value.translated;})).length);
                grunt.log.writeln('Total of ocurrences replaced: ' + replacesCount);
                // write a custom js for the client in this lang.
                if (options.plurals && options.plurals[lang]){
                    fs.writeFileSync(path.join(destLangFolder, 'i18n.js'), i18n.functions(options.plurals[lang].fewLimit, options.plurals[lang].manyLimit));
                }
                else{
                    fs.writeFileSync(path.join(destLangFolder, 'i18n.js'), i18n.functions(options.defaultPlurals.fewLimit, options.defaultPlurals.manyLimit));
                }
                grunt.log.writeln('Writed plural file to: ' + path.join(destLangFolder, 'i18n.js'));
            }
        }
        grunt.log.writeln('Process Complete!!.');    
    });

};
