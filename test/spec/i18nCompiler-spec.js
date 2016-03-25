'use strict';
var fs = require('fs-extra');
// var path = require('path');
// var proxyquire = require('proxyquire').noPreserveCache();
var glob = require('globule');
var i18nCompiler = require('../../i18nCompiler');


describe('i18nCompiler', function () {
	var c;
	var opts = {
		languages:['es','en'],
		separateFolders: false,
		localesFolder: '../example/locales',
		devLang: 'en'
	};
	describe('build', function () {
		// it('should write a file with an array of locales', function () {
		// 	var i18nCompiler = proxyquire('../../i18nCompiler', {
		// 		'fs-extra': {
		// 			'@global': false,
		// 			// readFileSync: function (name) {
		// 			// 	return fs.readFileSync(path.resolve('test/example/locales/' + path.basename(name)), 'utf8');
		// 			// },
		// 			writeFileSync: function (name, content) {
		// 				if (name === 'someFolder/locales/en.json'){
		// 					// var lang = JSON.parse(content.replace('var en = ', '').replace(';',''));
		// 					var lang = JSON.parse(content);
		// 					expect(lang[1]).to.equal('this is a subdir tomas');
		// 					expect(lang[2]).to.equal('this is a subdir tomas {NUM}');
		// 					expect(lang[3]).to.equal('this is a sentence to be translated in the html file 5');
		// 					expect(lang[4]).to.equal('this is a sentence to be translated in the html file 4');
		// 				}
		// 				if (name === 'someFolder/locales/es.json'){
		// 					// var lang = JSON.parse(content.replace('var es = ', '').replace(';',''));
		// 					var lang = JSON.parse(content);
		// 					expect(lang[1]).to.equal('este es un subdirectorio tomas');
		// 					expect(lang[2]).to.equal('este es un subdirectorio tomas {NUM}');
		// 					expect(lang[3]).to.equal('Esta es una frase traducida 5');
		// 					expect(lang[4]).to.equal('Esta es una frase traducida 4');
		// 				}

		// 			}
		// 		}
		// 	});
		// 	c = new i18nCompiler();
		// 	c.build('someFolder', opts);
		// });
	});
	describe('compile', function () {
		it('should replace the strings in the destination folder for the array strings', function() {
			fs.removeSync('test/example/dist');
			fs.copySync('test/example/pruebaOrig', 'test/example/dist');
			
			c = new i18nCompiler();
			var files = glob.find('test/example/dist/**');
			c.fetch(files, opts);
			// c.build('test/example/dist', opts);
			c.compile(files, opts);	
		});
	});
	describe('getI18nStrings', function () {
		// it('should capture the strings for localization in a js file if the function is inside a string', function() {
		// 	// var str = "'vaScript.</p> <p>{{__(\'Hola Pana mio que tal {N}\', {\'N\':4})}}</p> </div>'";
		// 	// var str = fs.readFileSync('test/mocks/main.js', 'utf8');
		// 	fs.removeSync('test/example/dist');
		// 	fs.copySync('test/example/pruebaOrig', 'test/example/dist');
			
		// 	c = new i18nCompiler();
		// 	var files = glob.find('test/example/dist/**');
		// 	c.fetch(files, opts);
		// 	var str = fs.readFileSync('test/mocks/simple.js', 'utf8');
		// 	str = str.replace(/\\\'/g, '"');
		// 	var res = c.getI18nStrings('.js', str, {
		// 		openLocalizationTag : '{{',
		// 		localizationFunction : '__',
		// 		closeLocalizationTag : '}}'
		// 	});
		// 	for (var strArrayCont = res.length - 1; strArrayCont >= 0; strArrayCont--) {
		// 	//Local Array
		// 		var rawLocaleArr = res[strArrayCont];
		// 		// console.log('The rawLocaleArr', rawLocaleArr);
		// 	//key to search in the json file.
		// 		var localeStr = c.purifyLocal(rawLocaleArr[1]);
		// 		console.log('The localeStr', localeStr);
		// 	//Data of the sentence if it exists
		// 		var localeData = c.purifyData(rawLocaleArr[1]);
		// 		console.log('The localeData', localeData);
		// 	}
		// 	// console.log(res);
		// });
	});
});
