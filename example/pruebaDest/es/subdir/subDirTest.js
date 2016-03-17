(function(G){
	var tomas = 3;
	console.log((function(d){return "this is a subdir tomas "+i18n.v(d,"NUM")})({'NUM' : tomas}));	
	console.log("this is a subdir tomas");	
})(this);
