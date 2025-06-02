declare let PRODUCTION: boolean;
declare let KIH_VERSION: string;

declare module "*.css" {
	const content: Record<string, string>;
	export default content;
};

interface JQuery {
    panel(p1?: any, p2?: any): any;
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
	
	ColorPicker(p1?: any, p2?: any): any;
	ColorPickerHide(p1?: any, p2?: any): any;
	attr(p1?: any, p2?: any): any;
}

interface JQueryStatic {
	parser: Parser;
	messager: any;
}

interface Parser {
	onComplete(ctx: any) : any;
	parse(selector: any) : any;
}

interface Window {
	webviewApi?: any;
	bootLoaderLoaded?: boolean;
	vme?: any;
}

interface Navigator {
	userAgentData?: any;
}

interface HTMLElement {
	files?: any;
	fireEvent?: any;
	value?: any;
}

interface Document {
	createEventObject?: any;
	formMATRIX?: any;
}

interface EditorFromTextArea {
	version?: string;
}