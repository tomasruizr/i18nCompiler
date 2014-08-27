var i18nCompiler = require('./CompilerMessageFormat.js');
(function(G){
	__ = function (string, data, quote){
		quote = quote | false;
        var compiler = new i18nCompiler('en');
        //if there is no data to translate.
        var result = '';
        if (!data){
            result = string;
        }
        else{
            result = compiler.compile(string)(data);
        }

        return result;
	}

})(this)