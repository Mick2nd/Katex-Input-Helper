
class KatexStarter {
	
	starts = 0;
	
	constructor() {
	}

	/**
	 * Sets the base href to the url of the last script.
	 */
	setBaseLocation() {
		var location = $("script[src]")
			.last()
			.attr("src")
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20')
			.replace('file:///', 'file://')
			.replace('file://', 'file:///') + '/';
		
		console.debug(`Base Definition : ${++ this.starts} : ${location}`);
		$('head').append(`<base href="${location}"></base>`)

		return location;
	}
	
	/**
	 * Reserved.
	 * Comments on ACTION:
	 * - we can inspect contents of #exchange, it is present
	 * - each is not called, no log message
	 * - work with callback, then each LINK or SCRIPT
	 * - LINK works, css can be transferred from Plugin -> Html
	 * - the same is not true for JS
	 */
	mergeHtml() {
		console.debug(`mergeHtml`);
		$('#exchange').load('./head.html', function() {
			console.debug('mergeHtml : load performed')
			$('#exchange script,#exchange link').each(function(idx) {
				console.debug(`mergeHtml : ${$(this).prop('tagName')}`);
				$('head').append($(this));
			});
			
			// here change is ready
			$('#myContainer').layout({fit: true});			
		});
	}
	
	/**
	 * Reserved.
	 */
	restart() {
		console.debug(`Base Definition : url was ${location.href}`);
		location.replace('./testDialog.html');
		
		var timer = setInterval(function() {
			this.setBaseLocation(false);
			clearInterval(timer);			
		}, 500);
	}
}

$(document).ready(async function() {
	
	console.info('Document ready : starter');
	/*
	*/
	var katexStarter = new KatexStarter();
	katexStarter.setBaseLocation();
	katexStarter.mergeHtml();
});
