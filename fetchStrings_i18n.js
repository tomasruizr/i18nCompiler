var processor = require('./compilerProcessor.js');
var fs = require('fs-extra');
var path = require('path');
module.exports = function(grunt) {
	/**
	 * Task that fetch all the strings to be localized and puts them in a locales folder orgenized by languages.
	 *
	 * @method
	 */
	grunt.registerMultiTask('fetchStrings_i18n', 'Creates folders for scripts/templates for every language supported in the application.', function() {
		grunt.log.writeln('fetching localization strings...');
    	var options = this.options({
	        openLocalizationTag : '<%', 
	        closeLocalizationTag : '%>', 
	        localizationFunction : '__',
	        languages : [
          	],
        
      	});  
    	var p = new processor();
    	var src= new Array();
    	var langLocals= new Array();
    	/**
    	 * Not Deleted Locals. Array storing the locals that are preset in the
    	 *         source file, if the local is not here and it is in the
    	 *         existing locales file, will be marked as deleted.
    	 *
    	 * @type {Array}
    	 */
    	var NDlangLocals= new Array();


    	for (var i = options.languages.length - 1; i >= 0; i--) {
    		var lang = options.languages[i];
    	
    	
	    	//Validates if the folder exists or create it.
	    	if (!fs.existsSync(path.join(this.files[0].dest, lang))){
    			fs.ensureDirSync(path.join(this.files[0].dest, lang));
	    	}
	    	//validates if the localization file exist or initialize it to an empty object.
	    	if (fs.existsSync(path.join(this.files[0].dest, lang, lang + '.json'))){
	    		langLocals = JSON.parse(fs.readFileSync(path.join(this.files[0].dest, lang, lang + '.json'), 'utf8'));

	    	}
	    	else{
	    		langLocals = new Object();
	    	}
	    	
	    	
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
	  		
	  		
	  		var fileStr = '';
	  		var fileName = '';
	  		for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
	  			fileName = src[srcCount];
		      	fileStr = fs.readFileSync(fileName, 'utf8');
		      	//get the locals in each files
		      	p.getI18nStrings(path.extname(fileName), fileStr, options, function(strArray){
	      			for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
			  			var rawLocaleArr = strArray[strArrayCont];
 						var localeStr = p.purifyLocal(rawLocaleArr[1]);
	 					if (!langLocals[localeStr]){
		      				var l = new Object();
							l.translation = localeStr;
		      				l.translated = 0;
		      				l.deleted = 0;
		      				langLocals[localeStr] = l;
		      			}
		      			else{
		      				langLocals[localeStr].deleted = 0;	
		      			}
		      			//validates if the local does not exist and adds it.
	      				//Add the local to the NOT DELETED locals array, any local not
	      				//in here will be marked as deleted in the json file of the local.
	      				if (NDlangLocals.indexOf(localeStr) == -1){
	      					NDlangLocals.push(localeStr);
	      				}
		      		}
		      	
				});
		    }
		    //Mark all the locales not found in the src files as deleted in the dst json file.
		    langLocals = p.markDeletedLocales(langLocals, NDlangLocals);
		    fs.writeFileSync( path.join(this.files[0].dest, lang, lang + '.json'), 
		    	JSON.stringify(langLocals,null,4));
		    var count = Object.keys(langLocals).length;
		    grunt.log.writeln('Locale: ' + lang);
		    grunt.log.writeln('Strings to Translate found: ' + NDlangLocals.length);
		    grunt.log.writeln('Strings to Translate marked to be deleted: ' + (count - NDlangLocals.length));
		};
	});
};