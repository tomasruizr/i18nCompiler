(function(G){
	console.log('this is going to be the translated string:');
	var numero = 32;
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': numero}));	
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '3'}));	
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '4'}));	
	this.data = __('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '4'});
})(this);
