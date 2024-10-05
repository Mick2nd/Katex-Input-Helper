
/*
$(document).ready(function() { 
	$.parser.onComplete = function() {
		$('#cc').layout();
		console.info('EASYUI test');
	}; 
}); 
 */

var timer = setInterval(() => 
{ 
	$('#myContainer').layout({fit: true});
	console.info('EASYUI test');
	clearInterval(timer);
}, 1000);

