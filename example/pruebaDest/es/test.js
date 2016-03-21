(function(G){
	console.log("this is going to be the translated string:");
	var numero = 32;
	console.log((function(d){return "Tu "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"mensaje","other":"mensajes"})+" van aqui."})({'NUM': numero}));	
	console.log((function(d){return "Tu "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"mensaje","other":"mensajes"})+" van aqui."})({'NUM': '3'}));	
	console.log((function(d){return "Tu "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"mensaje","other":"mensajes"})+" van aqui."})({'NUM': '4'}));	
	this.data = (function(d){return "Tu "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"mensaje","other":"mensajes"})+" van aqui."})({'NUM': '4'});
})(this);
