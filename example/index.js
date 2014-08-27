var i18nCompiler = require('../i18nCompiler.js');
var glob = require('glob');
i18n = new i18nCompiler();


var files = glob.sync('./pruebaOrig/**');
i18n.fetch(files, {languages:['en', 'es']});
i18n.compile(files, './pruebaDest', 'en');	
