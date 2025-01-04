
	
/**
 * @abstract Converts a method with given signature and callback to a Promise returning method.
 * 
 * @param fnc - a function object to be invoked
 * @param args - args of the function. The function has one additional callback parameter
 * @returns the Promise, will be fulfilled if the callback is invoked
 */
async function promisify2(fnc, ...args) {
	return new Promise(function(resolve, reject) {
		try {
			function resolveFunc() {
				var msg = `Promise check: ${args} `;
				console.debug(msg);
				resolve('Success');
			}
			
			if (fnc === setTimeout) {
				setTimeout(function() {
					resolveFunc();
				}, ...args);
			} else {
				fnc(...args, function() {
					resolveFunc();
				});
			}
		} catch(err) {
			console.error(`Error occurred: ${err} `);		
			reject(err);
		}		
	});
}

/**
 * @abstract A using function encapsulated by a Promise.
 * 
 * @param script - the url of the script to be loaded
 * @returns - the Promise indicating the state of the transaction
 */
async function usingAsync(script) {
	return promisify2(/*using*/easyloader.load.bind(easyloader), script);
}

async function readyAsync() {
	var doc = $(document);
	return promisify2(doc.ready.bind(doc));
}

async function setTimeoutAsync(delay) {
	return promisify2(setTimeout, delay);
}

	
/**
 * @abstract Sets the base location.
 * 
 * This will be needed for relative paths of some content like css or html files.
 */
function getBaseLocation() {
	var location = document.currentScript.src
		.split('/')
		.slice(0, -2)
		.join('/')
		.replace(/ /g, '%20')
		.replace('file:///', 'file://')
		.replace('file://', 'file:///') + '/';
		
	return location;
}

var baseLocation = null;
async function initScripts() {
	baseLocation = getBaseLocation();
	easyloader.base = baseLocation;    								// set the easyui base directory
	easyloader.css = false;

	var scripts = [
		"./js/jquery-easyui/jquery.easyui.min.js",
		"./js/jquery-easyui/datagrid-cellediting.js",
		"./js/jquery-easyui/datagrid-filter.js",
		"./js/jquery-colorpicker/js/colorpicker.js",
		"./js/codemirror/lib/codemirror.js",
		"./js/katex/katex.min.js",
		"./js/katex/mhchem.min.js",
		
		"./js/patterns/observable.js",
		"./js/localization.js",
		"./js/themes.js",
		"./js/parserExtension.js",
		"./js/parameters.js",
		"./js/fileHandling.js",
		"./js/helpers.js",
		"./js/math.js",
		"./js/categoriesTree.js",
		"./js/panels.js",
		"./js/dialog.js"
		/*
		*/
	];
	
	var csss = [
		"./js/jquery-easyui/themes/default/easyui.css",
		"./js/jquery-easyui/themes/icon.css",
		"./js/jquery-easyui-MathEditorExtend/themes/aguas/easyui.css",
		"./js/jquery-easyui-MathEditorExtend/themes/icon.css",
		"./js/jquery-colorpicker/css/colorpicker.css",
		"./js/codemirror/lib/codemirror.css",
		"./js/keyboard/Keyboard.css",
		"./js/katex/katex.min.css",
		"./js/dialog.css"
	];

	await usingAsync('./js/jquery-easyui/jquery.min.js');

	for (var css of csss) {
		await usingAsync(css);
		// works but has no effect
		$('link')
		.last()
		.removeAttr('media');
	}
	
	for (var script of scripts) {
		await usingAsync(script);
	}
}

function check() {
	var ids = [
		'html',
		'head',
		'body',
		'#bodyPage',
		'#myContainer',
		'.easyui-layout', 
		'.easyui-menubutton',
		'.easyui-dialog',
	];
	for (var id of ids) {
		$(id)
		.each(function() {
			console.debug(`Element check : ${$(this).prop('tagName')} : ${$(this).attr('id')} `);
		});
	}
}

async function initApp() {
	var vme = null;
	var fatalError = null;

	vme = new KatexInputHelper();
	window.vme = vme;											// prevents garbage collection?
	await vme.initialise();
	$('#myContainer').layout({fit: true});
	$('#divEquationInputOutput').layout({});
}

async function init() {
	while (typeof easyloader !== 'object' || document.currentScript == null) {
		await setTimeoutAsync(100);
	}
	console.info(`easyloader loaded : ${typeof easyloader} `);
	await initScripts();
	console.debug('Promise check : scripts loaded.');
	await readyAsync();
	console.debug('Promise check : document ready.');
	
	// trial to shift misplaced menus
	$('#mFile, #mInsert, #mTools, #mView, #mOptions, #mInformations').append($('#menu'));
	
	await initApp();
	console.debug('Promise check : app started.');
	check();
}

init()
.then(() => {
	// alert('Initialization finished');
	check();
})
.catch(err => {
	console.error(`Error ${err} `);
	alert(`Error ${err} `);
});

/*
initScripts()
.then(() => {
	$(document).ready(function() {
		initApp()
		.then(function() {
			alert('Initialization finished');
		})
		.catch(function(err) {
			alert(`An error occurred : ${err} `);
		});
	});
})
.catch(err => {
	alert(`Error ${err} `);
});
*/