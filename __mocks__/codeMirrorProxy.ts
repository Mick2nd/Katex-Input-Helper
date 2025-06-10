
import { ICodeMirror } from '../src/assets/js/interfaces'

export function codeMirrorFakeProxy(original: ICodeMirror) : ICodeMirror {
	let value = "";
	
	let fake = {
		getValue : () => value,
		replaceSelection : (b: string) => { 
			//console.info(`replaceSelection: ${b}`); 
			value = b; 
		},
		getSelection : () => "",
		setCursor: (cursor) => {  },
		getCursor: () => { return { ch: 0 }; },
		focus : () => { },
	}
	
	return { ...original, ...fake};
}