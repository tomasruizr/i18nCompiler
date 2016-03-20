var fs = require('fs');
var path = require('path');
var proxyquire = require('proxyquire');
// var i18nCompiler = require('../../i18nCompiler');


describe('i18nCompiler', function () {
	var c;
	describe('build', function () {
		it('should write a file with an array of locales', function () {
			var i18nCompiler = proxyquire('../../i18nCompiler', {
				'fs-extra': {
					readFileSync: function (name) {
						return fs.readFileSync(path.resolve('test/example/locales/' + path.basename(name)), 'utf8');
					},
					writeFileSync: function (name, content) {
						if (name === 'someFolder/en.js'){
							expect(name).to.equal('someFolder/en.js');
							var lang = JSON.parse(content.replace('var en = ', '').replace(';',''));
							expect(lang[1]).to.equal('this is a subdir tomas');
							expect(lang[2]).to.equal('this is a subdir tomas {NUM}');
							expect(lang[3]).to.equal('this is a sentence to be translated in the html file 5');
							expect(lang[4]).to.equal('this is a sentence to be translated in the html file 4');
						}
						if (name === 'someFolder/es.js'){
							expect(name).to.equal('someFolder/es.js');
							var lang = JSON.parse(content.replace('var es = ', '').replace(';',''));
							expect(lang[1]).to.equal('este es un subdirectorio tomas');
							expect(lang[2]).to.equal('este es un subdirectorio tomas {NUM}');
							expect(lang[3]).to.equal('Esta es una frase traducida 5');
							expect(lang[4]).to.equal('Esta es una frase traducida 4');
						}

					}
				}
			});
			c = new i18nCompiler();
			c.build(['en.json', 'es.json'], 'someFolder', ['en', 'es'], { devLang: 'en' });
		});
		it('should replace the strings in the destination folder for the array strings', function() {
			var i18nCompiler = proxyquire('../../i18nCompiler', {
				'fs-extra': {
					readFileSync: function (name) {
						if (path.extname(name, 'json')){
							return fs.readFileSync(path.resolve('test/example/locales/' + path.basename(name)), 'utf8');
						} else{
							return fs.readFileSync(name, 'utf8');
						}
					}
				}
			});
			c = new i18nCompiler();
			c.release(src, opts);
		});
	});
});
