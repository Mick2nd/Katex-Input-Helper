
	
/**
 * @abstract Sets the base location.
 * 
 * This will be needed for relative paths of some content like css or html files.
 */
setBaseLocation() {
	var location = $("script[src]")
		.last()
		.attr("src")
		.split('/')
		.slice(0, -2)
		.join('/')
		.replace(/ /g, '%20')
		.replace('file:///', 'file://')
		.replace('file://', 'file:///') + '/';
	console.info(`Base location is : ${location}`);
	$('base').attr('href', location);
	return location;
}

/**
 * @abstract Main invocation logic.
 */
$(document).ready(async function initSequence() {
	console.info('Document ready.');
	var vme = null;
	var fatalError = null;
	try {
	} catch(e) {
		fatalError = e;
	}
});
