/**
 * descriprion
 *
 * @module i18nCompiler.js
 * @main i18nCompiler.js
 */
//*******************************************
//Dependencies
//*******************************************
var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');
var path = require('path');
var glob = require("glob");
var Promise = require('promise');
var CompilerMessageFormat = require('./CompilerMessageFormat.js');
//*******************************************
// Constructor & Properties
//*******************************************

/**
* [i18nCompiler description]
*
* @class i18nCompiler
* 
* @constructor
*/
function i18nCompiler(options) {
	/**
	 * Default options for configuring the compiler.
	 *
	 * @type {Object}
	 */
	 var _defOptions = {
	 	openLocalizationTag : '<%', 
	 	closeLocalizationTag : '%>', 
	 	localizationFunction : '__',
	 	markedOnly : true,
	 	localesFolder: './locales',
	 	defaultPlurals : {
	 		fewLimit : '10',
	 		manyLimit : '20'
	 	},
	    languages : [],
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
	     	var i18n = new CompilerMessageFormat();
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
	}

    this.options = _.extend(_defOptions, options);
};
//**************************************************************************************************
// MAIN FUNCTIONS
//**************************************************************************************************

i18nCompiler.prototype.compile = function(src, dest, lang, opts){
	console.log('Compiling');
	var self = this;
	var options = opts ? _.extend(this.options, opts) : this.options;
    var i18n = new CompilerMessageFormat('en');
    var all = true;
    var localesFolderDir = new Array();
    //iterating the folders for each localization           
    if(typeof lang === 'String'){
    	localesFolderDir[0] = lang;
    	all=false;
    }else if(typeof lang === 'Array'){
    	localesFolderDir = lang
    	all=false;
    }else if (!lang || lang === 'all'){
    	localesFolderDir = fs.readdirSync(options.localesFolder);
    	all=true;
    }

    // iterate each locale folder
    //var promiseLocales = new Promise(function(resolve, reject){


    	for (var lc = 0; lc < localesFolderDir.length; lc++) {
	        var lang = localesFolderDir[lc];

	        var destLangFolder = path.join(dest, lang);
	        //Report progress to console.
	        console.log('Compiling language: ' + lang + ' in the folder: ' + destLangFolder);
	        

	        //ensure the folder exists or create it.
	        fs.ensureDirSync(destLangFolder);

	        // var stat = fs.statSync(destLangFolder);
	        // if (stat && stat.isDirectory()) {
            var replacesCount = 0;
            var locales = JSON.parse(fs.readFileSync(path.join(options.localesFolder, lang, lang + '.json'), 'utf8'));
            
            var fileStr = '';
            var fileName = '';
            // var newFile = '';   
            //For each file in the source.
            for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
                fileName = src[srcCount];
                var fileStat = fs.statSync(destLangFolder);
        		if (fileStat && !fileStat.isDirectory()) {
        			
	                fileStr = fs.readFileSync(fileName, 'utf8');
	                //get the locals in each files
	                
	                this.getI18nStrings(path.extname(fileName), fileStr, options, function(strArray){
	                    //For each local in the source.
	                    for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
	                        var rawLocaleArr = strArray[strArrayCont];
	                        //key to search in the json file.
	                        var localeStr = self.purifyLocal(rawLocaleArr[1]);
	                        //Data of the sentence if it exists
	                        var localeData = self.purifyData(rawLocaleArr[1]);
	                        //Ignore if only translating the Marked As Translated Strings and is falase.
	                        if (options.markedOnly && !locales[localeStr].translated){
	                            fileStr = self.replaceAll(fileStr, rawLocaleArr[0], rawLocaleArr[1]);
	                        }
	                        else{
	                            var tValue = options.callbackFunction(locales[localeStr].translation, localeData, path.extname(fileName) == '.js');
	                            fileStr = self.replaceAll(fileStr, rawLocaleArr[0], tValue);
	                            replacesCount += self.countReplaces(fileStr, rawLocaleArr[1], tValue);
	                        }
	                        //translated Value.
	                        
	                    }
		                var dFile = fileName.split('/');
		                console.log(dFile);
		                if (dFile[0] === '.'){
		                    dFile.splice(0,1);
		                }
		                dFile.splice(0,1);
		                var dFilename = dFile.join(path.sep);
		                // console.log(dFilename);
		                // console.log(path.join(dFile));
		                fs.ensureDirSync(path.dirname(path.join(destLangFolder, dFilename)));
		                fs.writeFileSync(path.join(destLangFolder, dFilename), fileStr);
	                }).then(function(res){
	                	console.log('JAJAJAJA');
	                	console.log('JAJAJAJA');
	                	console.log('JAJAJAJA');
	                	console.log('JAJAJAJA');
	                	console.log('JAJAJAJA');
	                });
	                
        		}
        	
                
            }

            
			
			//Report Totals
            //Filter only the locals that are translated
                
            console.log('Total of translated strings to replace: ' + Object.keys(_.pick(locales, function(value, key){return value.translated;})).length);
            console.log('Total of ocurrences replaced: ' + replacesCount);
            // write a custom js for the client in this lang.
            if (options.plurals && options.plurals[lang]){
                fs.writeFileSync(path.join(destLangFolder, 'i18n.js'), i18n.functions(options.plurals[lang].fewLimit, options.plurals[lang].manyLimit));
            }
            else{
                fs.writeFileSync(path.join(destLangFolder, 'i18n.js'), i18n.functions(options.defaultPlurals.fewLimit, options.defaultPlurals.manyLimit));
            }
            console.log('Writed plural file to: ' + path.join(destLangFolder, 'i18n.js'));	
        //}


	    }
	//});
	//promiseLocales.then(function(){
		console.log('Process Complete!!.');
	//},function(){});
     
}  

i18nCompiler.prototype.fetch = function(src, opts, cb){
	console.log('Fetching');
	var self = this;

	var options = opts ? _.extend(this.options, opts) : this.options;
	var dest = options.localesFolder;
    var i18n = new CompilerMessageFormat('en');
 
	var langLocals= new Array();
	/**
	 * Not Deleted Locals. Array storing the locals that are preset in the
	 *         source file, if the local is not here and it is in the
	 *         existing locales file, will be marked as deleted.
	 *
	 * @type {Array}
	 */
	var NDlangLocals= new Array();

  	console.log(src);

	for (var i = options.languages.length - 1; i >= 0; i--) {
		var lang = options.languages[i];
	
	
    	//Validates if the folder exists or create it.
    	if (!fs.existsSync(path.join(dest, lang))){
			fs.ensureDirSync(path.join(dest, lang));
    	}
    	//validates if the localization file exist or initialize it to an empty object.
    	if (fs.existsSync(path.join(dest, lang, lang + '.json'))){
    		langLocals = JSON.parse(fs.readFileSync(path.join(dest, lang, lang + '.json'), 'utf8'));

    	}
    	else{
    		langLocals = new Object();
    	}
  		
  		var fileStr = '';
  		var fileName = '';
  		for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
  			fileName = src[srcCount];
  			console.log(fileName);
  			var stat = fs.statSync(fileName);
        	if (stat && stat.isDirectory()){
        		continue;
        	}	
	      	fileStr = fs.readFileSync(fileName, 'utf8');
	      	//get the locals in each files
	      	this.getI18nStrings(path.extname(fileName), fileStr, options, function(strArray){
      			for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
		  			var rawLocaleArr = strArray[strArrayCont];
						var localeStr = self.purifyLocal(rawLocaleArr[1]);
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
	    langLocals = this.markDeletedLocales(langLocals, NDlangLocals);
	    fs.writeFileSync( path.join(dest, lang, lang + '.json'), 
	    	JSON.stringify(langLocals,null,4));
	    var count = Object.keys(langLocals).length;
	    console.log('Locale: ' + lang);
	    console.log('Strings to Translate found: ' + NDlangLocals.length);
	    console.log('Strings to Translate marked to be deleted: ' + (count - NDlangLocals.length));
	};
	
}

//*******************************************
// Methods and Functions
//*******************************************
/**
 * Extract the localization strings in a raw format
 *
 * @method getI18nStrings
 *
 * @param  {[type]}       fileExt  [description]
 * @param  {[type]}       fileStr  [description]
 * @param  {[type]}       options  [description]
 * @param  {Function}     callback [description]
 *
 * @return {[type]}                [description]
 */
i18nCompiler.prototype.getI18nStrings = function(fileExt, fileStr, options, callback){
	if (fileExt === '.js') {
		//	__\s*\(([^\)]*)\)
		var reStr = options.localizationFunction + '\\s*\\(([^\\)]*)\\)';
	} 
	else{
		//	__\s*\((.*)\)
		var reStr = options.openLocalizationTag +
		options.localizationFunction + "\\s*\\((.*)\\)" +
		options.closeLocalizationTag;
	}
	callback(this.searchRegExp(reStr, fileStr));
}

/**
 * Returns the local as it will appear in the json files of locals.
 *
 * @method purifyLocal
 *
 * @param  {[type]}    rawLocal [description]
 * @param  {Function}  callback [description]
 *
 * @return {[type]}             [description]
 */
i18nCompiler.prototype.purifyLocal = function(rawLocal, callback){
	var locales = [];
	//(?!'|\")(.*)(?=['|\"](?=[,]|$))
	var reStr= '(?!\'|\\")(.*)(?=[\'|\\"](?=[,]|$))';
	return this.searchRegExp(reStr, rawLocal)[0][0];	
}

/**
 * Returns the data as it will be used in the json file of locales.
 *
 * @method purifyData
 *
 * @param  {[type]}   rawLocal [description]
 * @param  {Function} callback [description]
 *
 * @return {[type]}            [description]
 */
i18nCompiler.prototype.purifyData = function(rawLocal, callback){
	var locales = [];
	//(?!['|\"]).*'\s*,\s*(.*)
	var reStr= '(?![\'|\\"]).*\'\\s*,\\s*(.*)';
	var result = this.searchRegExp(reStr, rawLocal);

	if (result[0]){
		return result[0][1];	
	}
	else{
		return null;
	}
}

/**
 * Performs the search in the strings for all the ocurrences
 *
 * @method searchRegExp
 *
 * @param  {[type]}     reStr [description]
 * @param  {[type]}     str   [description]
 *
 * @return {[type]}           [description]
 */
i18nCompiler.prototype.searchRegExp = function(reStr, str){		
	var re = new RegExp(reStr, 'g');
	var regex = new Array();
	var result = new Array();
	do{
		regex = re.exec(str);
		if (regex)
			result.push(regex);
	} while (regex);
	return result;
};

i18nCompiler.prototype.markDeletedLocales = function(locals, ndLocals){
	for (var l in locals)
	{
		if (ndLocals.indexOf(l) == -1)
		{
			locals[l].deleted = 1;
		}
	}
	return locals;
};

i18nCompiler.prototype.escapeRegExp = function (string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
i18nCompiler.prototype.countReplaces = function(string, find, replace){
	var res = string.match(new RegExp(this.escapeRegExp(find), 'g'));
	if (res) {
		return res.length;
	}
	else {
		return 0;
	}
}
i18nCompiler.prototype.replaceAll = function (string, find, replace) {
	return string.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
}
//*******************************************
// module export
//*******************************************
module.exports = i18nCompiler;
