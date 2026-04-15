const withEasyLoader = true;


/**
 * Converts a method with given signature and callback to a Promise returning method.
 * A special case is the use of setTimeout, where the order of arguments is swapped.
 * 
 * @async implements the Promise contract
 * @param fnc - a function object to be invoked
 * @param args - args of the function. The function has one additional callback parameter
 * @returns the Promise, will be fulfilled if the callback is invoked
 */
async function promisify(fnc: any, ...args: any[]) {
	return new Promise(function(resolve, reject) {
		try {
			function resolveFunc() {
				let msg = `Promise check: ${args} `;
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

let EL: any = null;

/**
 * A using function encapsulated by a Promise.
 * 
 * @async implements the Promise contract
 * @param script - the url of the script to be loaded
 * @returns - the Promise indicating the state of the transaction
 */
async function usingAsync(modules: string[]) : Promise<any> {
	try {
		if (EL == null) {
			const { easyloader } = (await import('./jquery-easyui/easyloader.js'));
			easyloader.base = getBaseLocation();
			EL = easyloader;
		}
		const ready = await promisify(/*using*/EL.load.bind(EL), modules);
		return ready;
	} catch(e) {
		console.error(`Could not load 'easyui' ${e}`);
		throw e;
	}
}

/**
 * Sets the base location.
 * 
 * This will be needed for relative paths of some content like css or js files.
 * Is here used only for *easyloader*.
 * 
 * @returns the location of this script, ending with a slash
 */
function getBaseLocation() : string {
	const location = (document.currentScript as HTMLScriptElement).src
		.split('/')
		.slice(0, -1)
		.join('/')
		.replace(/ /g, '%20')
		.replace('file:///', 'file://')
		.replace('file://', 'file:///') + '/';
		
	console.info(`Base location is : '${location}'`);
	return location;
}


/**
 * Registers extensions for the EASYUI plugins, here: datagrid.
 */
function registerExtensions(easyloader: any) {
	$.extend(easyloader.modules, {
		datagriddnd: {
			js:'../datagrid-dnd.js',
			dependencies: ['datagrid']
		},
		datagridfilter: {
			js:'../datagrid-filter.js',
			dependencies: ['datagrid']
		},
		datagridcellediting: {
			js:'../datagrid-cellediting.js',
			dependencies: ['datagrid']
		}
	});
}


if (withEasyLoader) {
	window.$ = window.jQuery = $;			// provides access for easyloader and easyui

	const deferredList: string[] = [			
		'datagriddnd',
		'datagridfilter',
		'datagridcellediting',
	];
	const primaryList = EASYUI_INCLUDES.filter((elem) => !deferredList.includes(elem));
	
	/**
	 * Essential workflow (other trials did not work):
	 * - first load basic plugins
	 * - then register plugin-extensions
	 * - finally load those plugin-extensions
	 */
	await usingAsync(primaryList);
	registerExtensions(EL);	
	await usingAsync(deferredList);
	
} else {
	// Leave this code outcommented, because otherwise the package size would
	// grow.
	//await import('./jquery-easyui/jquery.easyui.min.js');
	//await import('./jquery-easyui/datagrid-dnd.js');
	//await import('./jquery-easyui/datagrid-filter.js');
	//await import('./jquery-easyui/datagrid-cellediting.js');
}

export default 1;