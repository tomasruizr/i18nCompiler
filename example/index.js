var i18nCompiler = require('../i18nCompiler.js');
var glob = require('glob');
i18n = new i18nCompiler();



glob('./pruebaOrig/**', function(){console.log('JA')})
.then(function(){
	console.log('ASDFO');
});
//var files = glob.sync('./pruebaOrig/**');
// i18n.fetch(files, {languages:['en', 'es']}, function(){
// });
//i18n.compile(files, './pruebaDest');	
