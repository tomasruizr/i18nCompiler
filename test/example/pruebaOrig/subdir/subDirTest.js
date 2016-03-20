(function(G){
	var tomas = 3;
	console.log(__('this is a subdir tomas {NUM}', {'NUM' : tomas}));	
	console.log(__('this is a subdir tomas'));	
})(this);
