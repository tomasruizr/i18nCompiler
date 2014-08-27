(function(G){
	console.log('this is going to be the translated string:');
	var numero = 32;
	console.log('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': numero});	
	console.log('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '3'});	
	console.log('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '4'});	
	this.data = 'Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '4'};
})(this);
