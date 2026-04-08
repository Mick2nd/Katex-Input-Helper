

declare global {
	export interface JQuery {
	    panel(p1?: any, p2?: any): any;
		navpanel(p1?: any, p2?: any): any;
		window(p1?: any, p2?: any): any;
		dialog(p1?: any, p2?: any): any;
		menu(p1?: any, p2?: any): any;
		linkbutton(p1?: any, p2?: any): any;
		draggable(p1?: any, p2?: any): any;
		droppable: any;
		combobox(p1?: any, p2?: any): any;
		tabs(p1?: any, p2?: any): any;
		layout(p1?: any, p2?: any): any;
		accordion(p1?: any, p2?: any): any;
		tooltip(p1?: any, p2?: any): any;
		datagrid: any;
		tree: any;
		resizable: any;
		sidemenu: any;
		drawer: any;
		
		ColorPicker(p1?: any, p2?: any): any;
		ColorPickerHide(p1?: any, p2?: any): any;
		attr(p1?: any, p2?: any): any;
	}
	
	export interface JQueryStatic {
		parser: Parser;
		messager: any;
		mobile: any;
	}
	
	export interface Parser {
		onComplete(ctx: any) : any;
		parse(selector: any) : any;
	}
	
	export interface Window {
		webviewApi?: any;
		bootLoaderLoaded?: boolean;
		vme?: any;
	}
	
	export interface Navigator {
		userAgentData?: any;
	}
	
	export interface HTMLElement {
		files?: any;
		fireEvent?: any;
		value?: any;
	}
	
	export interface Document {
		createEventObject?: any;
		formMATRIX?: any;
	}
	
	export interface EditorFromTextArea {
		version?: string;
	}
}
