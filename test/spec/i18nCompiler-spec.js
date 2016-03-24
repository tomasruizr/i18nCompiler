var fs = require('fs-extra');
var path = require('path');
var proxyquire = require('proxyquire').noPreserveCache();
var glob = require('globule');
// var i18nCompiler = require('../../i18nCompiler');


describe('i18nCompiler', function () {
	var c;
	var opts = {
		languages:['es','en'],
		separateFolders: false,
		localesFolder: '..example/locales',
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
		it('should replace the strings in the destination folder for the array strings', function() {
			fs.removeSync('test/example/dist');
			fs.copySync('test/example/pruebaOrig', 'test/example/dist');
			var i18nCompiler = require('../../i18nCompiler');
			c = new i18nCompiler();
			var files = glob.find('test/example/dist/**');
			c.fetch(files, opts);
			// c.build('test/example/dist', opts);
			c.compile(files, opts);	
		});
	});
});
