(function(G){
	console.log(__('this is going to be the translated string:'));
	var numero = 2;
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': 1}));	
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': numero}));	
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '3'}));	
	console.log(__('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '4'}));	
	this.data = __('Your {NUM} {NUM, plural, one{message} other{messages}} go here.', {'NUM': '4'});
	console.log('de console.log',this.data);
})(this);
