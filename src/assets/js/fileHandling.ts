import { promisify } from './parserExtension';

/**
 * Supports some (asynchronous) file operations.
 */
export class FileHandler {
	
	/**
	 * Selects a file from file open dialog.
	 * 
	 * This works in tandem with the callback selectFileCb.
	 * 
	 * @param fileInputId - the id of an input field serving for file open clicks.
	 */
	async selectFile(fileInputId:string) {
		return promisify(this, this.selectFileCb, fileInputId);
	}
	
	/**
	 * Select request with callback.
	 */
	selectFileCb(fileInputId: string, cb: any) {
		$(`#${fileInputId}`)
		.on('change', function(event) { 
			let file = event.target.files ? event.target.files[0] : event.target.value; 
			cb(null, file); 
		}); 
		
		document.getElementById(fileInputId).click(); 
	}
	
	/**
	 * Reads a file.
	 * 
	 * A File object must be given, provided by the FileReader object.
	 * 
	 * @param file - the file object
	 */
	async readFile(file: any) : Promise<string> {
		return promisify(this, this.readFileCb, file) as Promise<string>;
	}
	
	/**
	 * Read request with callback.
	 */
	readFileCb(file: any, cb: any) {
		let reader = new FileReader(); 
		reader.onload = function() {
			cb(null, this.result); 
		}; 
		reader.readAsText(file, "UTF-8");
	}
	
	/**
	 * A load file transaction.
	 * 
	 * Selects a file with the file open dialog and reads and returns the file content.
	 */
	async loadFile(fileInputId: string) : Promise<string> {
		
		let file = await this.selectFile(fileInputId);
		let text = await this.readFile(file);

		return text;
	}

	/**
	 * Lets You select a file where the given content is written to.
	 * 
	 * The output is written by the system after the file selection is initiated.
	 * 
	 * @param content - the content string
	 * @param type - a type string (MIME type)
	 * @param fileAnchorId - the id field of an anchor to be used by the operation  
	 */	
	saveFile(content: string, type: string, fileAnchorId: string) {

		let selector = `#${fileAnchorId}`;
		let name = "equation_vme_latex.txt"; 
		let blob = null;
		
		try { 
			blob = new Blob([ content ], { type: type }); 
		} catch (e) { } 
		
		let bloburl = null; 
		if (blob) { 
			let URL = window.URL || window.webkitURL; 
			try { 
				bloburl = URL.createObjectURL(blob); 
			} catch (e) { } 
		}
		
		$(selector).attr("href", bloburl); 
		$(selector).attr("download", name); 
		$(selector).attr("type", type); 
		let comp = document.getElementById(fileAnchorId); 

		// Test: TRIAL 1 was working, most probably we do not need the remaining code.
		try { 
			comp.click();
			console.info(`File Save : TRIAL 1`);
			return; 
		} catch (ex) { }

		try { 
			if (document.createEvent) { 
				let e = new MouseEvent('click', { bubbles: true, cancelable: true });
				comp.dispatchEvent(e); 
				console.info(`File Save : TRIAL 2`);
				return; 
			} 
		} catch (ex) { }

		try { 
			if (document.createEventObject) { 
				let evObj = document.createEventObject(); 
				comp.fireEvent("onclick", evObj); 
				console.info(`File Save : TRIAL 3`);
				return; 
			} 
		} catch (ex) { }

		if (bloburl) { 
			window.location.href = bloburl; 
			console.info(`File Save : OUTCOME 4`);
			return; 
		}

		console.info(`File Save : OUTCOME 5`); 
	}
}

// This helps to import symbols in test suite
try {
	module.exports = FileHandler;
} catch(e) { }
