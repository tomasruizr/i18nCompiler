var i18nCompiler = require('../i18nCompiler.js');
var glob = require('globule')	;
i18n = new i18nCompiler();


var files = glob.find('./pruebaOrig/**');
i18n.fetch(files, {languages:['es','en']});
i18n.compile(files, './pruebaDest');	
