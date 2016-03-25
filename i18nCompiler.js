'use strict';
/**
 * Generates a compiled version of an Application for each Locale supported.
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
// var glob = require('globule');
var CompilerMessageFormat = require('./CompilerMessageFormat.js');
//*******************************************
// Constructor & Properties
//*******************************************

/**
 * Generates a compiled version of an Application for each Locale supported.
 *
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
		separateFolders: true,
		spaVarName:'_la',
		openLocalizationTag: '<%',
		closeLocalizationTag: '%>',
		localizationFunction: '__',
		markedOnly: false,
		localesFolder: './locales',
		devLang: 'en',
		defaultPlurals: {
			fewLimit: '10',
			manyLimit: '20'
		},
		languages: [],
		/**
		 * Default Callback function to call specifying what to do to process
		 *         the localization string. it can be overrided in the options passed
		 *         as parameters in the compile and fetch function.
		 *
		 * @method callbackFunction
		 *
		 * @param  {string}         str   the string to be localized
		 * @param  {object}         data  the object representing the data
		 *         that's going to be passed as parameters to the localization
		 *         function in the client side.
		 * @param  {bool}         quote whether to quote the values or not.
		 *
		 * @return {string}               The string to be puted in place of the
		 *         localization string.
		 */
		callbackFunction: function (str, data, quote) {
			quote = quote || false;
			var i18n = new CompilerMessageFormat();
			//if there is no data to translate.
			var result = '';
			if (!data) {
				result = quote ? '"' + (i18n.compile(str)()) + '"' : (i18n.compile(str)());
			} else {
				result = '(' + i18n.precompile(i18n.parse(str), data) + ')(' + data + ')';
			}
			return result;
		},
		spaCallbackFunction: function (str, data, quote) {
			quote = quote || false;
			var i18n = new CompilerMessageFormat();
			//if there is no data to translate.
			var result = '';
			if (!data) {
				result = quote ? '"' + (i18n.compile(str)()) + '"' : (i18n.compile(str)());
			} else {
				result = '(' + i18n.precompile(i18n.parse(str), data) + ')';
			}
			return result;
		}
	};

	this.options = _.extend(_defOptions, options);
}
//**************************************************************************************************
// MAIN FUNCTIONS
//**************************************************************************************************
/**
 * Compiles the json files with the locales into js files to serve in the client.
 *
 * @method compile
 *
 * @param  {Array} src  List of json files with locales to be processed. Ussualy is the resulting
 *         array of a [glob search pattern](https://github.com/isaacs/node-glob).
 * @param  {strnig} dest Folder for the destination compilation.
 * @param  {string|Array|null} lang The language or languages to be compiled,
 *         a false value will compile them All.
 * @param  {Object} opts Override for the options of the compiler.
 */
i18nCompiler.prototype.build = function (dest, opts) {
	var src = fs.readdirSync(opts.localesFolder || this.options.localesFolder);
	var devLang = opts.devLang || this.options.devLang;
	// search the Language file that the software was developed with
	var devLangFile = _.find(src, function(file) {
		return path.basename(file, '.json') === devLang;
	});
	// remove it from the array of languages.
	// _.pullAt(src, src.indexOf(devLangFile));
	var tValue;
	var strings = JSON.parse(fs.readFileSync(path.join((opts.localesFolder || this.options.localesFolder), devLangFile), 'utf8'));
	_.each(src, function(lfile) {
		var l = JSON.parse(fs.readFileSync(path.join((opts.localesFolder || this.options.localesFolder), lfile), 'utf8'));
		var la = [];
		// iterate the json devlang file.
		_.each(strings, function(value, key) {
			tValue = options.spaCallbackFunction(l[key].translation, localeData);
			la.push();
		});
		var distLocalesFolder = path.join(dest, 'locales');
		fs.ensureDirSync(distLocalesFolder);
		console.log('Saving the locale file in', path.resolve(path.join(distLocalesFolder, lfile)));
		// fs.writeFileSync(path.join(dest, path.basename(lfile,'.json') + '.js'), 'var ' + path.basename(lfile,'.json') + ' = ' + JSON.stringify(la) + ';');
		fs.writeFileSync(path.join(distLocalesFolder, lfile), JSON.stringify(la));
	});
};

/**
 * Creates a version of the release app tree with references to an array of
 *         localized strings ej: instead of showing "the house is white" will
 *         be someArray[2].
 *
 * In the final app the language will be set by defining 'someArray'. ej:
 *         someArray = es; // 'es' beeing an array of localized strings in the
 *         language.
 *
 * @method spaRelease
 *
 * @param  {Array}   src  Array of files in the app tree.
 * @param  {Object}   options Object specifying the varname that will be used
 *         in the app, in the examples is 'someArray', and devLang, specifying
 *         the language that the app was developed with.
 */
// i18nCompiler.prototype.spaRelease = function(fileStr, localStr, localeData, locales, options){
// 	options = _.extend(this.options, options);

// 	//por cada local voy a agregar data a los archivos .js
// 	_.each(locales, function(local) {
// 		var tValue = options.spaCallbackFunction(local[localeStr].translation, localeData);
// 	})	
// 	// var tValue = options.callbackFunction(locales[localeStr].translation, localeData, path.extname(fileName) === '.js');
// 	count += self.countReplaces(fileStr, rawLocaleArr[1], tValue);
// 	fileStr = self.replaceAll(fileStr, rawLocaleArr[0], tValue);
// 	}
// 	return count;
// };

i18nCompiler.prototype.separateFoldersRelease = function(fileName, locales, destLangFolder, options){
	var self = this;
	var fileStat = fs.statSync(fileName);
	var count = 0;
	if (fileStat && !fileStat.isDirectory()) {
		var fileStr = fs.readFileSync(fileName, 'utf8');
		//get the locals in each files
		var strArray = this.getI18nStrings(path.extname(fileName), fileStr, options);
		//For each local in the source.
		for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
			var rawLocaleArr = strArray[strArrayCont];
			//key to search in the json file.
			var localeStr = self.purifyLocal(rawLocaleArr[1]);
			//Data of the sentence if it exists
			var localeData = self.purifyData(rawLocaleArr[1]);
			//Ignore if only translating the Marked As Translated Strings and is false.
			if (options.markedOnly && !locales[localeStr].translated) {
				fileStr = self.replaceAll(fileStr, rawLocaleArr[0], rawLocaleArr[1]);
			} else {
				var tValue = options.callbackFunction(locales[localeStr].translation, localeData, path.extname(fileName) === '.js');
				count += self.countReplaces(fileStr, rawLocaleArr[1], tValue);
				fileStr = self.replaceAll(fileStr, rawLocaleArr[0], tValue);
			}
		}
		var dFilename = fileName.replace(options.srcFolder + path.sep, '');
		fs.ensureDirSync(path.dirname(path.join(destLangFolder, dFilename)));
		fs.writeFileSync(path.join(destLangFolder, dFilename), fileStr);
	}
	return count;
};


/**
 * Compiles the folder struncture in the source folder with the locals in
 *         each language in the locals folder. Generates the same file structure
 *         in the source folder for each language in the dest folder.
 *
 * @method compile
 *
 * @param  {Array} src  List of files to be processed. Ussualy is the resulting
 *         array of a [glob search pattern](https://github.com/isaacs/node-glob).
 * @param  {strnig} dest Folder for the destination compilation.
 * @param  {string|Array|null} lang The language or languages to be compiled,
 *         a false value will compile them All.
 * @param  {Object} opts Override for the options of the compiler.
 */
i18nCompiler.prototype.compile = function(src, dest, language, opts) {
	var self = this;
	if (!opts && !language && typeof dest === 'object'){
		opts = dest;
	}
	var options = opts ? _.extend(this.options, opts) : this.options;
	var i18n = new CompilerMessageFormat('en');
	var all = true;
	var localesFolderDir = [];
	var locales = {};
	var replacesCount = 0;
	var fileStat, fileStr, strArray;	
	var arrays = {};
	var lang;
	options.srcFolder = src[0];
	// var devArray = JSON.parse(
	// 	fs.readFileSync(
	// 		path.join(
	// 			options.srcFolder, 'locales', options.devLang + '.json'
	// 		), 'utf8'
	// 	)
	// );
	//get the source folder from the file list.
	//set the destination folder in the options. for use in spaRelease
	// options.srcFolder = dest ||;
	//iterating the folders for each localization           
	if (!language) {
		localesFolderDir = fs.readdirSync(options.localesFolder);
		all = true;
	} else if (typeof language === 'string') {
		localesFolderDir[0] = language;
		all = false;
	} else if (language.constructor === 'Array') {
		localesFolderDir = language;
		all = false;
	}
	// iterate each locale in folder
	for (var lc = 0; lc < localesFolderDir.length; lc++) {
		lang = localesFolderDir[lc];
		locales[path.basename(lang,'.json')] = JSON.parse(fs.readFileSync(path.join(options.localesFolder, lang), 'utf8'));		
	}
 	// for each file in src
	for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
		fileStr="";
		fileStat = fs.statSync(src[srcCount]);
		if (!fileStat || fileStat.isDirectory()) { continue;}
		replacesCount = 0;
		//array of locales in the developed language.
		fileStr = fs.readFileSync(src[srcCount], 'utf8');
		//Workaround for the \' characters
 		fileStr = fileStr.replace(/\\\'/g, '"');
		//get the locals in each files
		strArray = this.getI18nStrings(path.extname(src[srcCount]), fileStr, options);
		//For each local in the source.
		for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
			//Local Array
			var rawLocaleArr = strArray[strArrayCont];
			console.log(rawLocaleArr[0]);
			//key to search in the json file.
			var localeStr = self.purifyLocal(rawLocaleArr[1]);
			console.log(localeStr);
			//Data of the sentence if it exists
			var localeData = self.purifyData(rawLocaleArr[1]);
			console.log(localeData);
			// replacesCount += self.spaRelease(src[srcCount], localStr, localeData, locales);
			// _.each(locales, function(local) {
			// });
			var tValue, rValue;
			var tValueIndex;
			_.forIn(locales, function(loc, key) {
				//dirty eval of the function if it has data
				if (localeData){
					tValue = eval(options.spaCallbackFunction(loc[localeStr].translation, localeData));
				} else {
					tValue = '"' + options.spaCallbackFunction(loc[localeStr].translation, localeData) + '"';
				}
				arrays[key] = arrays[key] || {};//{'obj':{}, 'arr':[]};
				arrays[key][localeStr] = tValue;
				tValueIndex = Object.keys(arrays[key]).indexOf(localeStr);
				if (key === options.devLang){
					//replacesCount += self.countReplaces(fileStr, rawLocaleArr[1], tValue);
					rValue = options.spaVarName + '['+ tValueIndex + ']' + (localeData ? '('+localeData+')': '');
					rValue = path.extname(src[srcCount]) === '.html' ? '{{' + rValue + '}}' : rValue;
					fileStr = self.replaceAll(fileStr, rawLocaleArr[0], rValue);
				}
			});
			// for (var locCount = locales.length - 1; locCount >= 0; locCount--) {
			// }
			if (fileStr){
				fs.writeFileSync(src[srcCount], fileStr);
				console.log('The file', src[srcCount], 'had', replacesCount, 'replaces');
			}
		}
	}
	var fileJsLocale;
	_.forIn(arrays, function(value, key) {
		fs.ensureDirSync(path.join(options.srcFolder, 'locales'));
		fileJsLocale = '(function(G){G.locales = G.locales || {};G["lang_'+key+'"]={};';
		fileJsLocale += 'G["lang_'+key+'"].dictionary=[' + _.values(value).toString() + '];';
		if (options.plurals && options.plurals[lang]) {
			fileJsLocale+= 'G["lang_'+key+'"].i18n=' + i18n.functions(options.plurals[lang].fewLimit, options.plurals[lang].manyLimit, true);
		} else {
			fileJsLocale+= 'G["lang_'+key+'"].i18n=' + i18n.functions(options.defaultPlurals.fewLimit, options.defaultPlurals.manyLimit, true);
		}
		fileJsLocale+='})(this);';
		fs.writeFileSync(path.join(options.srcFolder, 'locales', key + '.js'), fileJsLocale);
	});
	console.log('Process Complete!!.');
};

// i18nCompiler.prototype.toArrayString = function(array){
// 	return _.map(array, function(element) {
// 		if (typeof element == 'function')
// 			return element;
// 		else
// 			return  element;
// 	});
// };
// i18nCompiler.prototype.compile = function (src, dest, lang, opts) {
// 	var self = this;
// 	if (!dest && !lang){
// 		dest = opts;
// 	}
// 	var options = opts ? _.extend(this.options, opts) : this.options;
// 	var i18n = new CompilerMessageFormat('en');
// 	var all = true;
// 	var localesFolderDir = [];
// 	//get the source folder from the file list.
// 	options.srcFolder = src[0];
// 	//set the destination folder in the options. for use in spaRelease
// 	// options.srcFolder = dest ||;
// 	//iterating the folders for each localization           
// 	if (!lang) {
// 		localesFolderDir = fs.readdirSync(options.localesFolder);
// 		all = true;
// 	} else if (typeof lang === 'string') {
// 		localesFolderDir[0] = lang;
// 		all = false;
// 	} else if (lang.constructor === 'Array') {
// 		localesFolderDir = lang;
// 		all = false;
// 	}
// 	// iterate each locale in folder
// 	for (var lc = 0; lc < localesFolderDir.length; lc++) {
// 		lang = localesFolderDir[lc];
// 		if (!(fs.statSync(options.localesFolder).isDirectory())) {
// 			continue;
// 		}
// 		var replacesCount = 0;
// 		var locales = JSON.parse(fs.readFileSync(path.join(options.localesFolder, lang), 'utf8'));
// 		//For each file in the source.
// 		if (options.separateFolders){
// 			var destLangFolder = path.join(dest, lang.replace('.json', ''));
// 			//Report progress to console.
// 			console.log('Compiling language: ' + lang + ' in the folder: ' + destLangFolder);
// 			//ensure the folder exists or create it.
// 			fs.ensureDirSync(destLangFolder);
// 			// write a custom js for the client in this lang.
// 			if (options.plurals && options.plurals[lang]) {
// 				fs.writeFileSync(path.join(destLangFolder, 'i18n.js'), i18n.functions(options.plurals[lang].fewLimit, options.plurals[lang].manyLimit));
// 			} else {
// 				fs.writeFileSync(path.join(destLangFolder, 'i18n.js'), i18n.functions(options.defaultPlurals.fewLimit, options.defaultPlurals.manyLimit));
// 			}
// 			console.log('Writed plural file to: ' + path.join(destLangFolder, 'i18n.js'));
// 		}
// 		var fileStat, count, fileStr, strArray;
// 		var devArray = JSON.parse(
// 			fs.readFileSync(
// 				path.join(
// 					options.srcFolder, 'locales', options.devLang + '.json'
// 				), 'utf8'
// 			)
// 		);
// 		for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
// 			fileStat = fs.statSync(src[srcCount]);
// 			if (!fileStat || fileStat.isDirectory()) { continue;}
// 			count = 0;
// 			//array of locales in the developed language.
// 			fileStr = fs.readFileSync(src[srcCount], 'utf8');
// 			//get the locals in each files
// 			strArray = this.getI18nStrings(path.extname(src[srcCount]), fileStr, options);
// 			//For each local in the source.
// 			for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
// 				//Local Array
// 				var rawLocaleArr = strArray[strArrayCont];
// 				//key to search in the json file.
// 				var localeStr = self.purifyLocal(rawLocaleArr[1]);
// 				//Data of the sentence if it exists
// 				var localeData = self.purifyData(rawLocaleArr[1]);
// 				if (options.separateFolders){
// 					replacesCount += self.separateFoldersRelease(src[srcCount], locales, destLangFolder, options);
// 				} else {
// 					replacesCount += self.spaRelease(localStr, localeData, options);
// 				}
// 			}
// 		}
// 		//Report Totals
// 		//Filter only the locals that are translated
// 		console.log('Total of translated strings to replace: ' + Object.keys(_.pick(locales, function (value) {
// 			return value.translated;
// 		})).length);
// 		console.log('Total of ocurrences replaced: ' + replacesCount);
// 		if (options.separateFolders){
// 		}
// 	}
// 	console.log('Process Complete!!.');
// };
/**
 * Search for all the localization strings in the source folder and generates a json file with the locals to be translated for each language supported.
 *
 * @method fetch
 *
 * @param  {Array} src  List of files to be processed. Ussualy is the resulting
 *         array of a glob search pattern. See
 *         https://github.com/isaacs/node-glob
 * @param  {Object} opts Override for the options of the compiler.
 *
 * @return {[type]}      [description]
 */
i18nCompiler.prototype.fetch = function (src, opts) {
	console.log('Fetching');
	var self = this;

	var options = opts ? _.extend(this.options, opts) : this.options;
	var dest = options.localesFolder;
	// var i18n = new CompilerMessageFormat('en');

	var langLocals = [];
	/**
	 * Not Deleted Locals. Array storing the locals that are preset in the
	 *         source file, if the local is not here and it is in the
	 *         existing locales file, will be marked as deleted.
	 *
	 * @type {Array}
	 */
	var NDlangLocals = [];

	for (var i = options.languages.length - 1; i >= 0; i--) {
		var lang = options.languages[i];


		//Validates if the folder exists or create it.
		if (!fs.existsSync(path.join(dest))) {
			fs.ensureDirSync(path.join(dest));
		}
		//validates if the localization file exist or initialize it to an empty object.
		if (fs.existsSync(path.join(dest, lang + '.json'))) {
			langLocals = JSON.parse(fs.readFileSync(path.join(dest, lang + '.json'), 'utf8'));

		} else {
			langLocals = {};
		}

		var fileStr = '';
		var fileName = '';
		for (var srcCount = src.length - 1; srcCount >= 0; srcCount--) {
			fileName = src[srcCount];
			var stat = fs.statSync(fileName);
			if (stat && stat.isDirectory()) {
				continue;
			}
			fileStr = fs.readFileSync(fileName, 'utf8');
			//Workaround for the \' characters
 			fileStr = fileStr.replace(/\\\'/g, '"');
			//get the locals in each files
			var strArray = this.getI18nStrings(path.extname(fileName), fileStr, options);
			for (var strArrayCont = strArray.length - 1; strArrayCont >= 0; strArrayCont--) {
				var rawLocaleArr = strArray[strArrayCont];
				var localeStr = self.purifyLocal(rawLocaleArr[1]);
				if (!langLocals[localeStr]) {
					var l = {};
					l.translation = localeStr;
					l.translated = 0;
					l.deleted = 0;
					langLocals[localeStr] = l;
				} else {
					langLocals[localeStr].deleted = 0;
				}
				//validates if the local does not exist and adds it.
				//Add the local to the NOT DELETED locals array, any local not
				//in here will be marked as deleted in the json file of the local.
				if (NDlangLocals.indexOf(localeStr) === -1) {
					NDlangLocals.push(localeStr);
				}
			}


		}
		//Mark all the locales not found in the src files as deleted in the dst json file.
		langLocals = this.markDeletedLocales(langLocals, NDlangLocals);
		fs.writeFileSync(path.join(dest, lang + '.json'),
			JSON.stringify(langLocals, null, 4));
		var count = Object.keys(langLocals).length;
		console.log('Locale: ' + lang);
		console.log('Strings to Translate found: ' + NDlangLocals.length);
		console.log('Strings to Translate marked to be deleted: ' + (count - NDlangLocals.length));
	}
};

//*******************************************
// Methods and Functions
//*******************************************
/**
 * Extract the localization strings in a raw format
 *
 * @method getI18nStrings
 *
 * @param  {string}       fileExt  The file extention of the source file beeing processed. Depending on it the proccess varies.
 * @param  {string}       fileStr  The content of the file itself.
 * @param  {Object}       options  The i18nCompiler Options to use.
 *                                 	
 * @return {Array}                Returns the localization strings found in the file.
 */
i18nCompiler.prototype.getI18nStrings = function (fileExt, fileStr, options) {
	var reStr;
	if (fileExt === '.js') {
		//	__\s*\(([^\)]*)\)
		reStr = options.localizationFunction + '\\s*\\(([^\\)]*)\\)';
	} else {
		//	__\s*\((.*)\)
		reStr = options.openLocalizationTag +
			options.localizationFunction + '\\s*\\((.*)\\)' +
			options.closeLocalizationTag;
	}
	return this.searchRegExp(reStr, fileStr);
};

/**
 * Returns the local as it will appear in the json files of locals.
 *
 * @method purifyLocal
 *
 * @param  {string}    rawLocal [description]
 *
 * @return {[type]}             [description]
 */
i18nCompiler.prototype.purifyLocal = function (rawLocal) {
	// var locales = [];
	//(?!'|\")(.*)(?=['|\"](?=[,]|$))
	var reStr = '(?!\'|\\")(.*)(?=[\'|\\"](?=[,]|$))';
	return this.searchRegExp(reStr, rawLocal)[0][0];
};

/**
 * Returns the data as it will be used in the json file of locales.
 *
 * @method purifyData
 *
 * @param  {[type]}   rawLocal [description]
 *
 * @return {[type]}            [description]
 */
i18nCompiler.prototype.purifyData = function (rawLocal) {
	// var locales = [];
	//(?!['|\"]).*'\s*,\s*(.*)
	var reStr = /,[\s]*({[\s\S]+)/gm; 
	var result = this.searchRegExp(reStr, rawLocal);

	if (result[0]) {
		return result[0][1];
	} else {
		return null;
	}
};

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
i18nCompiler.prototype.searchRegExp = function (reStr, str) {
	var re = reStr.constructor === RegExp ? reStr : new RegExp(reStr, 'g');
	var regex = [];
	var result = [];
	do {
		regex = re.exec(str);
		if (regex) {
			result.push(regex);
		}
	} while (regex);
	return result;
};
/**
 * [markDeletedLocales description]
 *
 * @method markDeletedLocales
 *
 * @param  {[type]}           locals   [description]
 * @param  {[type]}           ndLocals [description]
 *
 * @return {[type]}                    [description]
 */
i18nCompiler.prototype.markDeletedLocales = function (locals, ndLocals) {
	for (var l in locals) {
		if (ndLocals.indexOf(l) === -1) {
			locals[l].deleted = 1;
		}
	}
	return locals;
};
/**
 * [escapeRegExp description]
 *
 * @method escapeRegExp
 *
 * @param  {[type]}     string [description]
 *
 * @return {[type]}            [description]
 */
i18nCompiler.prototype.escapeRegExp = function (string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
};
/**
 * [countReplaces description]
 *
 * @method countReplaces
 *
 * @param  {[type]}      string  [description]
 * @param  {[type]}      find    [description]
 *
 * @return {[type]}              [description]
 */
i18nCompiler.prototype.countReplaces = function (string, find) {
	var res = string.match(new RegExp(this.escapeRegExp(find), 'g'));
	if (res) {
		return res.length;
	} else {
		return 0;
	}
};
/**
 * [replaceAll description]
 *
 * @method replaceAll
 *
 * @param  {[type]}   string  [description]
 * @param  {[type]}   find    [description]
 * @param  {[type]}   replace [description]
 *
 * @return {[type]}           [description]
 */
i18nCompiler.prototype.replaceAll = function (string, find, replace) {
	return string.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
};
//*******************************************
// module export
//*******************************************
module.exports = i18nCompiler;
