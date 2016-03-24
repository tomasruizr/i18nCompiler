(function(G){
	console.log(_la[1]);
	var numero = 2;
	console.log(_la[0]({'NUM': 1}));	
	console.log(_la[0]({'NUM': numero}));	
	console.log(_la[0]({'NUM': '3'}));	
	console.log(_la[0]({'NUM': '4'}));	
	this.data = _la[0]({'NUM': '4'});
	console.log('de console.log',this.data);
})(this);
