(function(G){
	console.log("this is going to be the translated string:");
	var numero = 32;
	console.log((function(d){return "Your "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"message","other":"messages"})+" go here."})({'NUM': numero}));	
	console.log((function(d){return "Your "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"message","other":"messages"})+" go here."})({'NUM': '3'}));	
	console.log((function(d){return "Your "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"message","other":"messages"})+" go here."})({'NUM': '4'}));	
	this.data = (function(d){return "Your "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"message","other":"messages"})+" go here."})({'NUM': '4'});
})(this);
