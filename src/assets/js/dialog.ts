import Hammer from 'hammerjs';
import './easyui';
import './sass/dialog.scss' assert { type: 'css' };

import { VKI_init } from './keyboard/keyboard';
import { FileHandler } from "./fileHandling";
import { Versions } from "./versions";

import { inject } from 'inversify';
import { 
	IKatexInputHelper, 
	ILocalizer, localizerId,
	IMessager, messagerId, 
	IUtilities, utilitiesId, State, 
	parametersId, 
	IThemes, themesId, 
	IParser, parserId, 
	IMath, mathId, ICodeMirror,
	IPanels, panelsId, matrixWindowId, unicodeWindowId, informationWindowId, moreDialogId, windowId, dialogId, dynamicPanelId, 
    IMenus, menusId} from './interfaces';

let console: any; 
if (globalThis.console) console = globalThis.console; else console = { log: function(_: string) { }, error: function(_: string) { } }; 
console.log(KIH_VERSION);

/**
 * Responsible for showing documentation. At present only the external documentation is shown.
 */
class Documentations {

	windowIsOpening = false;
	runLocal = false;
	baseLocation = "";
	baseInfo = null;
	params = [];
	
	/**
	 * Constructor.
	 * 
	 * @param runLocal - true for local source
	 * @param baseLocation - to be used for local document path
	 */
	constructor(runLocal: boolean, baseLocation: string) {
		this.runLocal = runLocal;
		this.baseLocation = baseLocation;
		
		this.baseInfo = {
			LATEX: {
				file: "symbols-a4.pdf",
				url: "https://www.tug.org/twg/mactex/tutorials/ltxprimer-1.0.pdf",
				name: "wLATEX_DOCUMENTATION"
			},
			MHCHEM: {
				file: "mhchem.pdf",
				url: "https://mirror.dogado.de/tex-archive/macros/latex/contrib/mhchem/mhchem.pdf",
				name: "wMHCHEM_DOCUMENTATION"
			},
			AMSCD: {
				file: "Mamscd.pdf",
				url: "https://ctan.math.washington.edu/tex-archive/macros/latex/required/amsmath/amscd.pdf",
				name: "wAMSCD_DOCUMENTATION"
			},
			MATHML: {
				file: "mathml.pdf",
				url: "https://www.w3.org/TR/MathML2/mathml-s.pdf",
				name: "wMATH_ML_SPECIFICATIONS"
			},
			KATEX: {
				file: "",
				url: "https://katex.org/docs/supported",
				name: "wKATEX_FUNCTIONS"
			}
		};
		
		this.params = [
			'width=780',
			'height=580',
			'top=100',
			'left=100',
			'status=yes',
			'toolbar=no',
			'menubar=no',
			'location=no',
			'resizable=yes',
			'scrollbars=yes',
			'modal=no',
			'dependable=yes'			
		];
	}
	
	showLatexDocumentation() {
		return this.showWindow('LATEX');
	}

	showMhchemDocumentation() {
		return this.showWindow('MHCHEM');
	}

	showAmscdDocumentation() {
		return this.showWindow('AMSCD');
	}

	showMathmlSpecifications() {
		return this.showWindow('MATHML');
	}

	showKatexFunctions() {
		return this.showWindow('KATEX');
	}

	getUrl(key: string) {
		let info = this.baseInfo[key];
		return this.runLocal ? (this.baseLocation + 'doc/' + info.file) : info.url;
	}

	showWindow(key: string) {
		if (this.windowIsOpening) { 
			return null; 
		} else {
			let url = this.getUrl(key);
			let name = this.baseInfo[key].name; 

			this.windowIsOpening = true; 
			let params = this.params.join(',');
			let win = window.open(url, name, params); 
			this.windowIsOpening = false; 
			return win; 
		}
	}	
}


/**
 * The main class Katex Input Helper
 */
export class KatexInputHelper implements IKatexInputHelper {

	versions = null;
	codeType = 'Latex'; 
	codeMirrorEditor: ICodeMirror = null;
	cmSelector = ".cm-editor";
	platformInfo = null;
	symbolPanelsLoaded = []; 			// accordion only
	latexMathjaxCodesListLoaded = false; 
	autoUpdateOutputTimeout = null; 
	notAllowedKeys = [9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 91, 93, 
		112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145]; 
	allowedCtrlKeys = [86, 88, 89, 90];
	notAllowedCtrlKeys = []; 
	notAllowedAltKeys = []; 
	
	// The Color Picker is a fixed instance and can be used to work with colors
	runNotColorPicker = true;
	runNotVirtualKeyboard = false;

	url: any = null;
	rtlStyle = 'ltr';
	documentations = null;
	localizer: ILocalizer = null;
	themes: IThemes = null;
	math: IMath = null;
	parameters = null;
	utilities: IUtilities = null;
	messager: IMessager = null;
	panels: IPanels = null;
	menus: IMenus = null;
	baseLocation = "";
	parser: IParser = null;
	VKI_show: any = null;
	sidemenuData: any = { };
	customEquationsToggler = null;
	unicodeToggler = null;
	cursorAtInsertionPoint = false;
	
	/**
	 * Constructor
	 */
	constructor(
		@inject(parametersId) parameters: any,
		@inject(localizerId) localizer: ILocalizer,
		@inject(messagerId) messager : IMessager,
		@inject(utilitiesId) utilities : IUtilities,
		@inject(themesId) themes : IThemes,
		@inject(parserId) parser : IParser,
		@inject(mathId) math : IMath,
		@inject(panelsId) panels : IPanels,
		@inject(menusId) menus : IMenus,
	) {
		globalThis.vme = this;
	
		$('body').on('error', (event) => {
			console.error(`Error : %O`, event);
		})
		
		// independent of plugin variant
		this.baseLocation = this.setBaseLocation();
		
		// Probably not needed
		console.info(`Url: ${globalThis.location}`);
		
		this.parameters = parameters;
		this.localizer = localizer;
		this.messager = messager;
		this.utilities = utilities;
		this.themes = themes;
		this.parser = parser;
		this.math = math;
		this.panels = panels;
		this.menus = menus;
		this.documentations = new Documentations(false, this.baseLocation);
		
		for (let i = 65; i <= 90; i++) if ($.inArray(i, this.allowedCtrlKeys) == -1) this.notAllowedCtrlKeys.push(i); 
		for (let i = 65; i < 90; i++) this.notAllowedAltKeys.push(i);
	}

	get localType() {
		return this.parameters.localType;
	}
	set localType(value) {
		this.parameters.localType = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}

	get style() {
		return this.parameters.style;
	}
	set style(value) {
		this.parameters.style = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}
	
	get encloseAllFormula() {
		return this.parameters.encloseAllFormula;
	}
	set encloseAllFormula(value) {
		this.parameters.encloseAllFormula = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}
	
	get autoUpdateTime() {
		return this.parameters.autoUpdateTime;
	}
	set autoUpdateTime(value) {
		this.parameters.autoUpdateTime = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}
	
	get menuupdateType() {
		return this.parameters.menuupdateType;
	}
	set menuupdateType(value) {
		this.parameters.menuupdateType = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}
	
	get autoupdateType() {
		return this.parameters.autoupdateType;
	}
	set autoupdateType(value) {
		this.parameters.autoupdateType = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}

	
	get persistWindowPositions() {
		return this.parameters.persistWindowPositions;
	}
	set persistWindowPositions(value) {
		this.parameters.persistWindowPositions = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}
	
	get persistEquations() {
		return this.parameters.persistEquations;
	}
	set persistEquations(value) {
		this.parameters.persistEquations = value;
		// Seems to be unnecessary (setter interceptor in parameters)
		// this.parameters.writeParameters();
	}

	/**
	 * A Prefetch cycle to load the required HTML document. The intent is to 
	 * load the mobile or desktop version depending on configuration.
	 * 
	 * @returns true, if a document could be loaded
	 */
	async prefetch() : Promise<boolean> {
		
		/**
		 * Transfers HTML from a second document to the original start document.
		 * Transfers the whole innerHTML and the attributes replacing the old ones.
		 * RESERVED.
		 * 
		 * @param from - body element of the new document
		 * @param to - body selector of the old, original document
		 * 
		 */
		function transfer(from: HTMLElement, to: string) {
			$(to).html(from.innerHTML);
			for (const attrib of from.attributes) {
				$(to).attr(attrib.name, attrib.value);
			}
		}
		/**
		 * Transfers HTML from a second document to the original start document.
		 * Appends the whole innerHTML replacing the old one. This is the preferred
		 * method, because it enables a better experience of the SPLASH screen.
		 * The SPLASH screen is loaded in the starter document and hidden if 
		 * initialization is over.
		 * 
		 * @param from - body element of the new document
		 * @param to - body selector of the old, original document
		 */
		function append(from: HTMLElement, to: string) {
			$(to).append($(from.innerHTML));
		}
		
		await this.parameters.queryParameters();				// from Plugin or web query parameters
		const app = this.parameters.isMobile ? 'mobile' : 'desktop';
		const htmlString = (await import(`../dialog-${app}.hbs`)).default;
		
		// Experiments manipulating HTML
		const root = document.createElement('html');
		root.innerHTML = htmlString;
		console.log(`Parsed HTML : %O`, root);					// this is a full html DOM node with head and body
		const body = (root.lastChild as HTMLElement);
		append(body, 'body');
		
		this.math.injectCodeMirror();
		this.codeMirrorEditor = this.math.codeMirror;			// lazy injection
		console.debug(`Document check : ${document.URL}.`);
		
		// TEST to set app window size
		// This works but not on Android !!!
		// TODO: make it work on Android and only Android
		/*
		const containerElement = window.frames.top.top.document.getElementsByClassName('user-webview-dialog')[0];
		$(containerElement).css("--content-height", "80vh");
		*/
		
		return true;
	}

	/**
	 * Initialize. Performs the whole initialization.
	 */
	async initialise() { 

		let vme = this;
		this.versions = new Versions();
		
		// Initialize is done lazily
		//this.parser.initialise();		

		// Query string may be a better solution than detection
		this.platformInfo = { isMobile: this.parameters.isMobile, osFamily: 'Unknown' };
		this.addBuild();

		// As early as possible 
		await this.initialiseMobile(this.parameters.isMobile);

		// IN QUESTION
		await vme.initialiseCodeMirror();
		this.localizer.subscribe(this.onLocaleChanged.bind(this));
		await this.localizer.initialiseLanguageChoice(this.localType);		// Progress dialog uses localized text
		// NO ACTION on language choice dialog
		// await this.parser.parseAsync('#wLANGUAGE_CHOISE');
		
		$.messager.progress({
			title: "Katex Input Helper", 
			text: vme.getLocalText("WAIT_FOR_EDITOR_DOWNLOAD"), 
			msg:	"<center>&copy; " +
						"<a href='mailto:juergen@habelt-jena.de?subject=Katex%20Input%20Helper' target='_blank' class='bt progress' >Jürgen Habelt</a> -" + 
						"<a href='https://github.com/Mick2nd/Katex-Input-Helper' target='_blank' class='bt progress' >A Joplin plug-in</a><br/><br/>" +
					"</center>", 
			interval: 300 
		}); 
		$('#form').hide();
		
		await vme.initialiseUI(); 
		await vme.updateInfo();												// updates a few dialogs
		vme.initialiseParameters(); 
		vme.initialiseCodeType(); 											// for correct display of header, no interactivity
		await vme.initialiseVirtualKeyboard(); 

		// IN QUESTION
		await this.onLocaleChanged(this.localizer);							// repeat because too soon after initialiseLanguageChoice
		this.themes.subscribe(this.onStyleChanged.bind(this));
		await this.themes.initialiseThemeChoice(this.style, this.rtlStyle); // RTL STYLE defined after locale language

		if (!this.platformInfo.isMobile) {
			$('#myContainer').layout({fit: true});
		}
		$('#innerLayout').layout({fit: true});
		vme.endWait();
	}

	/**
	 * Initializes the differences of mobile / desktop variant.
	 * 
	 * @param mobile - true in the mobile variant.
	 */	
	async initialiseMobile(mobile: boolean) {
		let opts = { assert: { 
			type: 'css'
		} };

		/**
		 * Defines the proportions of 2 regions of a layout.
		 * 
		 * @param selector - the selector of the layout.
		 * @param region - the region to be sized
		 * @param part - the percentage of the height of the layout to assign to the region
		 */
		function defineProportions(selector: string, region: string, part: number | string) {
			const panel = $(selector).layout('panel', region);
			panel.panel('resize', { height: `${part}%` });
			$(selector).layout('resize');
		}
		
		// Intent: to restore original web page structure (required by Joplin plugin).
		// Here: the viewport
		// TODO: required? CHECK FUNCTIONALITY WITHOUT THIS
		// It seems the functionality is given without this !!
		/*
		const content = $("body meta[name='viewport']").attr('content');
		if (content) {
			const html = `<meta name="viewport" content="${content}" ></meta>`;
			$("meta[name='viewport']").remove();
			$('html > head').append(html);
		}
		*/

		// Here: the body content
		$('body').prepend($('#joplin-plugin-content > div'));

		if (mobile) {
			const inst = this;
			$("body").addClass("katex-mobile");
			$("div.katex-mobile").removeClass("katex-mobile");
			
			if (!CSS.supports('height: 100vh')) {
				console.warn('No support for Viewport Height units');
			}
			if (!CSS.supports('width: 100vw')) {
				console.warn('No support for Viewport Width units');
			}
			console.log(`Menu3 : ${$('#main-menu').html()}`);
			
			// For the working of the mobile variant order of these statements is essential
			await import('./jquery-easyui/themes/mobile.css', opts);
			await import('./jquery-easyui/jquery.easyui.mobile');
			await this.parser.parseAsync('body');

			console.log(`Menu4 : ${$('#main-menu').html()}`);
			$('body').prepend($('div:has(> .easyui-navpanel)'));
			// Placement of "navpanels" in body initiates buggy behavior
			//$('body').prepend($('.easyui-navpanel'));
			
			$.mobile.init();
			await this.parser.parseAsync('html'); // ?

			// click handler for mobile			
			$("#goWest").on('click', function(event) { 
				event.preventDefault();
				$.mobile.go('#westRegion', 'slide', 'right');
			});
			$("#goEast").on('click', function(event) { 
				event.preventDefault(); 
				$.mobile.go('#eastRegion', 'slide', 'left');
			});
			$("#goMenu").on('click', function(event) { 
				event.preventDefault(); 
				$.mobile.go('#wrapperPanelMenu', 'slide', 'left');
			});
			$("header:has(+ #wrapperPanel) a.back").on('click', function(_) { 
				inst.panels.closeOpen(); 
			});
			$("header:has(+ #westRegion) a.back, header:has(+ #eastRegion) a.back, header:has(+ #wrapperPanelMenu) a.back").on('click', function(_) { 
			});
			
			// Implements a handler for panel open events for the main panel.
			$('#myContainer').panel({
				fit: true,
				onOpen: function() {
					inst.codeMirrorEditor.focus(!inst.cursorAtInsertionPoint);
					inst.cursorAtInsertionPoint = false;
				}
			});
			
			// Handles orientation changes
			screen.orientation.addEventListener('change', async function() {
				await inst.panels.refresh();
			});
			
			/**
			 * Installs a swipe handler for certain nav panels.
			 * 
			 * @param from - selector of the origin window
			 * @param dir - direction (left, right, down)
			 * @param [to=''] - target panel, empty for switch back
			 */
			function navigate(from: string, dir: string, to: string = '') {
				const wnd = $(from)[0];
				const hammer = new Hammer(wnd);
				hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
				if (to === '') {
					hammer.on('swipedown', function(event: any) {
						event.preventDefault(); 
						$.mobile.back();
						inst.panels.closeOpen(); 
					});
					return;
				}
				hammer.on('swipe' + dir, function(event: any) {
					event.preventDefault(); 
					$.mobile.go(to, 'slide', dir);
				});
			}
			
			navigate('div:has(#myContainer) header', 'left', '#eastRegion');
			navigate('div:has(#myContainer) header', 'right', '#westRegion');
			navigate('div:has(#eastRegion) header', 'right', '#myContainer');
			navigate('div:has(#westRegion) header', 'left', '#myContainer');
			navigate('div:has(#wrapperPanel) header', 'down', '');
			navigate('div:has(#wrapperPanelMenu) header', 'down', '');
			
			defineProportions('#innerLayout', 'south', 50);
						
			this.sidemenuData = this.getSidemenuData();
			console.log(`Sidemenu data : %O`, this.sidemenuData);
			this.populateSidemenu(this.sidemenuData);
			
		} else {
			$("body").addClass("katex-desktop");
			$("div.katex-desktop").removeClass("katex-desktop");
			
			await this.parser.parseAsync('html');
			defineProportions('#innerLayout', 'south', 50);						
		}
	}
	
	/**
	 * Using the traditional (desktop) menu, extracts data for the side menu.
	 */
	getSidemenuData() {
		const inst = this;

		function parseMenu(id: string, level: number = 0) : any {
			const level1Submenus = [ 'mFILE', 'mINSERT', 'mTOOLS', 'mVIEW', 'mOPTIONS', 'mINFORMATIONS' ];
			
			console.log(`Parsing with selector #${id}`);
			const data = $(`#${id} > div`).map(function(idx: number, dom) {
				console.log(`Found menu item : %O`, dom);
				if ($(this).hasClass('menu-sep')) {
					return {
						id: '',
						text: '',
						iconCls: ''
					};
				}
				const span = $(this).find('span');
				let children = undefined;
				if (level == 0) {
					children = parseMenu(level1Submenus[idx - 1], level + 1);
				}
				if (level == 1 && id == 'mINSERT' && idx == 1) {
					children = parseMenu('mCHARS', level + 1);
				}
				const locate = span.attr('locate');
				span.text(inst.getLocalText(locate));
				const spanHtml = span.get(0) == undefined ? '' : span.get(0).outerHTML;
				if (spanHtml == '') {
					return null;
				}
				const line: any = {
					text: spanHtml,
					iconCls: $(this).attr('iconcls'),
					children: children
				};
				const itemId = $(this).attr('id');
				if (itemId) {
					line.id = itemId + '_side';
				}
				console.log(`Found menu data : %O`, line);
				return line;
			});
			return data.get();
		}

		const data = parseMenu('main-menu');
		return data;
	}
	
	/**
	 * Populates a side menu in a wrapper menu panel for reduced space.
	 * 
	 * @param data - the data structure used to describe the menu
	 */
	populateSidemenu(data: any) {
		$('#sm').sidemenu({
			data: data,
			floatMenuPosition: 'left',
			multiple: false,
			onSelect: this.onMenuClick.bind(this)
		});
		
		$('ul.sidemenu-tree span.tree-title').each(function(idx) {		// set the css class for menu separator
			if ($(this).text() == '') {
				$(this).addClass('menu-sep');
			}
		})
		
		$('#sm').sidemenu('expand');
	}
	
	/**
	 * At the end of initialization close Progress dialog and WaitMsg
	 * panel.
	 */
	endWait() { 
		this.initialiseEquation(); 
		$.messager.progress('close'); 
		$("#WaitMsgPre,#WaitMsg").panel('close');
		this.setFocus(); 
	}
	
	/**
	 * Set Focus on Editor.
	 */
	setFocus() { 
		if (this.codeMirrorEditor) { this.codeMirrorEditor.focus(); } 
	}
	
	/**
	 * Sets Cursor at editor end.
	 * TODO: Probably erroneous .. getValue queries the whole content
	 */
	setCodeMirrorCursorAtEnd() { 
		this.codeMirrorEditor.setCursor(-1); 
	}

	/**
	 * Initializes the virtual keyboard by loading a script.
	 */	
	async initialiseVirtualKeyboard() { 
		
		if (!this.runNotVirtualKeyboard) {
			VKI_init.bind(this)();
		}
	}
	
	/**
	 * Initialise the Code Mirror Editor.
	 * 
	 * This includes:
	 * - instance creation with parameters
	 * - change handler -> auto update of formula
	 * - context menu binding
	 */
	async initialiseCodeMirror() { 
		let vme = this; 
		const codeMirrorEditor = this.codeMirrorEditor;
		await this.versions.init(codeMirrorEditor.version);
		// Reserved.
		const option = vme.platformInfo.isMobile ? 'contenteditable' : 'textarea';	// RESERVED
		try { codeMirrorEditor.setOption('inputStyle', option); } catch(e) {}
		codeMirrorEditor.on("change", function() { vme.autoUpdateOutput(); }); 
		
		if(vme.platformInfo.isMobile) {
			$(vme.cmSelector).css('font-size', '1.3em');
			// NO ACTION on Android
			// $('.cm-content').attr('inputmethod', 'none');
		} else {
			/*	The context menu appears but throws on click or mouse move afterwards:
			 *	NO OWNER => special handling.
			 */
			$(vme.cmSelector).on('contextmenu', (event) => vme.onContextMenu('#mINSERT', event)); 
		}
	}

	/**
	 * Handles context menu invocation.
	 * 
	 * This is a workaround because of crashs raised otherwise. The hide method
	 * will be overridden. Left unwanted effect: display of menu at false location,
	 * this can be handled by shifting the menu via CSS.
	 * 
	 * @param selector - the selector of the html element which caused the event
	 * @param event - the event
	 */	
	onContextMenu(selector: string, event: any) {
		event.preventDefault();
		
		let options = $(selector).menu('options');
		let onHide = options.onHide;
		let onShow = options.onShow;
		
		// has the effect of not highlighting main menu
		options.onShow = function() {
			return false;
		}

		// has the effect of avoiding crash		
		options.onHide = function() {
			$(this).menu('hide');
			options.onHide = onHide;
			options.onShow = onShow;
			return false;
		};
		
		this.logProperties(selector);
		// this code uses CSS to shift the context menu to the desired location (and its
		// shadow)
		try {
			$(selector).menu('show', { left: event.pageX, top: event.pageY });
			$(`${selector}`).css({
				position: 'absolute',
				left: `${event.pageX}px`,
				top: `${event.pageY}px`,
				display: 'block'
			});
			
			let next = $(selector).next();
			if (next.hasClass('menu-shadow')) {
				next.css({
					position: 'absolute',
					left: `${event.pageX}px`,
					top: `${event.pageY}px`,
					display: 'block'
				});
			}
		} catch(e) { 
		}
		return false;
	}
	
	/**
	 * Logs some properties of the element selected by the selector.
	 * 
	 * @param selector - the selector
	 */
	logProperties(selector: string) {
		console.log(`Context-menu display : ${$(selector).css('display')}, ${$(selector).css('position')}`);
		console.log(`Context-menu %O`, $(selector)[0]);
	}
	
	/**
	 * Initializes the User Interface.
	 * 
	 * This includes:
	 * - assignes menu commands
	 * - prepares the accordion panels with symbol templates
	 * - prepares the **info** dialog
	 * - assigns button handlers
	 * - additional handlers ...
	 */
	async initialiseUI() {
		
		let vme = this;
		$("a.easyui-linkbutton").linkbutton({ plain: true }); 
		$(document).on('contextmenu', function(event) { event.preventDefault(); return false; }); 
		
		// The whole menu commands.
		// TRY different way: use options
		$("#mFILE, #mINSERT, #mTOOLS, #mVIEW, #mOPTIONS, #mINFORMATIONS, #main-menu").menu({
			onClick: vme.onMenuClick.bind(vme)
		});
		
		if (!window.opener) { 
			$("#mQUIT_EDITOR").addClass("menu-item-disabled").on('click', function(_) { }); 
		}
		if (typeof (FileReader) == "undefined") { 
			$("#mOPEN_EQUATION").addClass("menu-item-disabled").on('click', function(_) { vme.testOpenFile(); }); 
		}
		$("#fOPEN_EQUATION").on('change', function(event) { vme.openFile(event); }); 
		
		// The Symbol palettes
		// test mobile : throws
		try {
			this.initialiseUIaccordion("#f_SYMBOLS"); 
			this.initialiseUIaccordion("#f_SYMBOLS2"); 
		} catch(e) {
			
		}
		
		// Configures Clicks on close buttons and Key handlers, Context menus and others
		/* Moved to panels : Close button click handler
		*/
		 
		$('#btRESET_WINDOW_POSITIONS').on('click', function(event) { 
			event.preventDefault(); 
			vme.parameters.resetWindowPositions();
			vme.messager.show('RESTART', 'RESTART_REQUIRED');
		}); 
		$("#mathVisualOutput").on('contextmenu', (event) => vme.onContextMenu('#mVIEW', event)); 
		$("[information]").on('mouseover', function(_event) { 
			$(".divInformation").html(vme.getLocalText($(this).attr("information"))); 
		}); 
		$("[information]").on('mouseout', function(_event) { 
			$(".divInformation").html("&nbsp;"); 
		}); 

		$('body').on('click', '#btCOPYRIGHT', async function(event) { 
			event.preventDefault(); 
			await vme.openInformationTab(0); 
			vme.setFocus(); 
		});
		
		// TEST: MAIL
		$('body')
		.on('mouseover', 'a.bt', function(_event) {
			let href = $(this).attr('href');
			if (!$(this).hasClass('easyui-tooltip')) {
				$(this)
				.addClass('easyui-tooltip')
				.tooltip({
					position: 'bottom',
					content: `<span>${href}</span>`
				});
			}
		});
		/* NOT WORKING
		.on('click', 'a.bt', function(event) {
			let href = $(this).attr('href');
			if (href.startsWith('mailto')) {
				console.info(`Mail request to : ${href}`);
				event.preventDefault();
				window.open(href, '_blank', 'popup=true');			
			}
		});
		*/
		
		this.customEquationsToggler = this.utilities.regionToggler(
			'#toggle_btn_1',
			'#CUSTOM_EQUATIONS_LAYOUT',
			this.platformInfo.isMobile ? State.Second : State.Both
		);
		this.unicodeToggler = this.utilities.containerToggler(
			'#toggle_btn_2',
			'#cUNICODES_LIST',
			!this.platformInfo.isMobile								// true for desktop variant
		);
	
		this.math.updateLatexMenu();
	}
	
	/**
	 * Handles menu clicks of the main menu. This handler performs an additional
	 * handling of the side menu.
	 */
	async onMenuClick(item: any) {
		let vme = this;
		console.log(`Click with id ${item.target.id} of %O`, item);
		
		const functions = {
			"mEDITOR_PARAMETERS": () => vme.openDialog('wEDITOR_PARAMETERS'), 
			"mSTYLE_CHOISE": () => vme.openDialog('wSTYLE_CHOISE'),
			"mLANGUAGE_CHOISE": () => vme.openDialog('wLANGUAGE_CHOISE'), 
			"mMATRIX": () => vme.showMatrixWindow(3, 3), 
			"mCOMMUTATIVE_DIAGRAM": () => vme.initialiseUImoreDialogs("f_COMMUTATIVE_DIAGRAM"), 
			"mCHEMICAL_FORMULAE": () => vme.initialiseUImoreDialogs("f_CHEMICAL_FORMULAE"), 
			"mSAVE_EQUATION": () => vme.saveEquationFile(), 
			"mOPEN_EQUATION": () => vme.testOpenFile(), 
			"mLaTeX_TEXT": () => vme.insert(String.raw`\LaTeX`), 
			"mUNICODES_LIST": () => vme.panels.showWindowDI(unicodeWindowId, 'wUNICODES_LIST', vme.initialiseSymbolContent.bind(vme)), 
			"mLATEX_CODES_LIST": () => vme.documentations.showKatexFunctions(), 
			"mLANG_RESSOURCE_LIST": async () => { await vme.openWindow('wLANGUAGE_LIST'); await vme.initialiseLangRessourcesList() }, 
			"mLATEX_DOCUMENTATION": () => vme.documentations.showLatexDocumentation(),
			"mMHCHEM_DOCUMENTATION": () => vme.documentations.showMhchemDocumentation(),
			"mAMSCD_DOCUMENTATION": () => vme.documentations.showAmscdDocumentation(),
			"mMATH_ML_SPECIFICATIONS": () => vme.documentations.showMathmlSpecifications(),
			"mCOPYRIGHT": () => vme.openInformationTab(0), 
			"mVERSION": () => vme.openInformationTab(1), 
			"mBUGS": () => vme.openInformationTab(2), 
			"mEQUATION_SAMPLE": () => vme.openInformationTab(3), 
			"f_GREEK_CHAR": () => vme.initialiseUImoreDialogs("f_L_U_GREEK_CHAR"), 
			"f_ALL_CHAR": () => vme.initialiseUImoreDialogs("f_ALL_CHAR"), 
			"f_FR_CHAR": () =>  vme.initialiseUImoreDialogs("f_FR_CHAR"),
			"f_BBB_CHAR": () => vme.initialiseUImoreDialogs("f_BBB_CHAR"), 
			"mEQUATION": () => vme.initialiseUImoreDialogs("f_EQUATION"), 
			"mCUSTOM_EQUATIONS": () => vme.panels.showWindowDI(dynamicPanelId, 'wf_CUSTOM_EQUATIONS_MORE', vme.math),
			"mHORIZONTAL_SPACING": () => vme.initialiseUImoreDialogs("f_HORIZONTAL_SPACING"), 
			"mVERTICAL_SPACING": () => vme.initialiseUImoreDialogs("f_VERTICAL_SPACING"), 
			"mSPECIAL_CHARACTER": () => vme.initialiseUImoreDialogs("f_SPECIAL_CHARACTER"), 
			"mKEYBOARD": () => { if (!vme.runNotVirtualKeyboard) { vme.VKI_show(document.getElementById("tKEYBOARD")); $("#keyboardInputMaster").draggable({ handle: '#keyboardTitle' }); }}
		};
		
		const rawId = item.id ? item.id : item.target.id;
		const id = rawId.endsWith('_side') ? rawId.substring(0, rawId.length - 5) : rawId;
		if (id in functions) {
			await functions[id]();
		} else {
			if (id === '' || item.text === '') { return; }			// probably menu separator
			$.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: item.text });
		}
	}
	
	/**
	 * Activates information tabs on the information dialog.
	 * 
	 * @param numTab - number (index) of the tab (0..3)
	 */
	async openInformationTab(numTab: number) { 
		this.panels.showWindowDI(informationWindowId, 'wINFORMATIONS', numTab); 
	}
	
	/**
	 * Initializes one of the "MORE" dialogs.
	 * 
	 * @param fPanelID - the panel id (this is the panel from which the more dialog is originating)
	 */
	async initialiseUImoreDialogs(fPanelID: string) {
		let vme = this;
		let fPanelMoreID = 'w' + fPanelID + '_MORE';
		vme.panels.showWindowDI(moreDialogId, fPanelMoreID, vme.initialiseSymbolContent.bind(vme));
	}
	
	/**
	 * Registers events for a window and opens it.
	 * 
	 * This whole effort is done to get the window position and size persisted.
	 * 
	 * @param id - the HTML id of the window
	 */
	async openWindow(id: string) {
		this.panels.showWindowDI(windowId, id);
	}

	/**
	 * Registers events for a window and opens it.
	 * 
	 * This whole effort is done to get the window position and size persisted.
	 * 
	 * @param id - the HTML id of the window
	 */
	async openDialog(id: string) {
		this.panels.showWindowDI(dialogId, id);
	}
	
	/**
	 * Adapt UI to code type. (Latex or Ascii). For correct display of header only.
	 */
	printCodeType() { 
		$("#title_Edition_Current_Syntax").text(this.codeType); 
		$("#title_Edition_Other_Syntax").text((this.codeType == "AsciiMath") ? "Latex" : "AsciiMath"); 
	}
	
	/**
	 * Same as *printCodeType*.
	 */
	initialiseCodeType() {
		this.printCodeType();
	}

	/**
	 * Initializes the Equation from the parameters.
	 * 
	 * This includes copying it to the editor and displaying it in the output field.
	 */
	initialiseEquation() {
		let param = this.parameters.equation;
		if (param && param != undefined) {
			this.codeMirrorEditor.setValue(param); 
			this.setCodeMirrorCursorAtEnd(); 
			this.updateOutput();
		} 
	}
	
	/**
	 * Initialises all **configuration** parameters including start time initialisation and change
	 * handlers.
	 */
	initialiseParameters() {
		
		let vme = this;
		function onChange(target: any, value: boolean) {
			console.debug(`Checkbox content of ${$(target).attr('id')} changed to : ${value} `);
			if (value) {
				$(target).attr('checked', 'checked');
			} else {
				$(target).removeAttr('checked');
			}
		}
		
		$("#autoUpdateTime").val(this.autoUpdateTime);
		onChange('#menuupdateType', this.menuupdateType);
		onChange('#autoupdateType', this.autoupdateType);
		onChange('#persistWindowPositions', this.persistWindowPositions);
		onChange('#persistEquations', this.persistEquations);
		
		$("#autoUpdateTime").on('change', function(_event) { 
			vme.autoUpdateTime = $("#autoUpdateTime").val(); 
		});
		$("#menuupdateType").on('change', function(event) {
			vme.menuupdateType = !vme.menuupdateType;
			onChange(event.target, vme.menuupdateType);
		}); 
		$("#autoupdateType").on('change', function(event) { 
			vme.autoupdateType = !vme.autoupdateType;
			onChange(event.target, vme.autoupdateType);
		}); 
		$("#persistWindowPositions").on('change', function(event) { 
			vme.persistWindowPositions = !vme.persistWindowPositions;
			onChange(event.target, vme.persistWindowPositions);
		}); 
		$("#persistEquations").on('change', function(event) { 
			vme.persistEquations = !vme.persistEquations;
			onChange(event.target, vme.persistEquations);
		}); 
	}

	/**
	 * Opens the Matrix window with given rows and columns values.
	 * 
	 * @param rows - the number of matrix rows 
	 * @param cols - the number of matrix columns
	 */
	showMatrixWindow(rows: number, cols: number) {
		this.panels.showWindowDI(matrixWindowId, 'wMATRIX', rows, cols); 
	}

	/**
	 * Wrapper of the Localizer routine.
	 */	
	getLocalText(TEXT_CODE: string) : string { 
		try { 
			return this.localizer.getLocalText(TEXT_CODE);
		} catch (e) { return ""; } 
	}
	
	/**
	 * This is the observer for Language changes, it switches the language of the UI.
	 * 
	 * It does this by:
	 * - setting document language
	 * - setting the RTL style
	 * - localize all entries of the UI (using *span[locate]*)
	 */
	async onLocaleChanged(_localizer: ILocalizer) {
		this.localType = this.localizer.currentLocale;
		console.log(`Entry into onLocaleChanged, localType is: ${this.localType}`);
		let vme = this; 
		
		$("html").attr("xml:lang", vme.getLocalText("_i18n_HTML_Lang")); 
		$("html").attr("lang", vme.getLocalText("_i18n_HTML_Lang")); 
		$("html").attr("dir", vme.getLocalText("_i18n_HTML_Dir")); 
		vme.setRTLstyle();
		
		$("span[locate]").each(
			function() { 
				if ($(this).attr("locate") != undefined) { 
					let localText = vme.getLocalText($(this).attr("locate")); 
					if (localText != undefined) $(this).html(localText); 
				} 
			});
			
		this.printCodeType();
	}
	
	/**
	 * Wrapper around Localizer routine. Builds resources dialog.
	 */
	async initialiseLangRessourcesList() {
		await this.localizer.buildLocalResources();
	}
	
	/**
	 * Establishs an *autoUpdateType* mode, if active.
	 */
	autoUpdateOutput() {
		let vme = this; 
		if (vme.autoUpdateOutputTimeout != undefined && vme.autoUpdateOutputTimeout != null) { 
			clearTimeout(vme.autoUpdateOutputTimeout); 
			delete vme.autoUpdateOutputTimeout; 
		}
		if (vme.autoupdateType) vme.autoUpdateOutputTimeout = setTimeout("vme.updateOutput();", vme.autoUpdateTime);
	}
	
	/**
	 * Wrapper of the appropriate Math routine. Updates the math in the 
	 * 			 output window.
	 */
	updateOutput() {
		this.math.updateOutput();
	}

	/**
	 * Wrapper of the appropriate Math routine. Inserts a piece of 
	 * math code into the editor and updates the output.
	 */	
	insert(b: string) {
		this.math.insert(b);
		this.setFocus();
	}
	
	/**
	 * OBSOLETE. NOT USED.
	 *	
	insertBeforeEachLine(b) { 
		this.encloseSelection("", "", function(a) { a = a.replace(/\r/g, ""); 
			return b + a.replace(/\n/g, "\n" + b) }) 
		}
	*/
	
	/**
	 * For insertion of formulae with insertion point..
	 */
	tag(b: any, a: any) {
		b = b || null; 
		a = a || b; 
		if (!b || !a) { return }
		this.codeMirrorEditor.replaceSelection(b + this.codeMirrorEditor.getSelection() + a); 
		let pos = this.codeMirrorEditor.getCursor(); 
		pos.ch = pos.ch - a.length; 
		this.codeMirrorEditor.setCursor(pos); 
		if (this.menuupdateType) this.updateOutput(); 
		this.setFocus();		
		this.cursorAtInsertionPoint = true;				// used in mobile only
	}
	
	/**
	 * Menu command to open a file with formula.
	 * 
	 * Checks, if *FileReader* is present and if so, initiates a file open action.
	 */
	testOpenFile() { 
		if (typeof (FileReader) == "undefined") { 
			$.messager.alert(
				"<span class='rtl-title-withicon'>" + this.getLocalText("ERROR") + "</span>", 
				"VisualMathEditor JAVASCRIPT ERROR : \n\nFileReader isn't supported!", 
				'error'); 
		} else { 
			document.getElementById("fOPEN_EQUATION").click(); 
		} 
	}
	
	/**
	 * The initiated file open action, implemented by clicking on an anchor element.
	 */
	openFile(event: any) {
		let vme = this;
		let file = event.target.files ? event.target.files[0] : event.target.value; 
		let reader = new FileReader(); 
		reader.onload = function() {
			vme.codeMirrorEditor.setValue(this.result); 
			vme.setCodeMirrorCursorAtEnd(); 
			vme.updateOutput();
		}; 
		reader.readAsText(file, "UTF-8");
	}
	
	/**
	 * Saves the formula in Editor to a file.
	 */
	saveEquationFile() {
		let vme = this;
		let content = ""; 
		content = vme.codeMirrorEditor.getValue();
		
		let fileHandler = new FileHandler();
		fileHandler.saveFile(content, "application/x-download", "fSAVE_EQUATION"); 
	}
	
	/**
	 * The style chosen is set up for the UI.
	 */
	onStyleChanged(style: string, _rtlStyle: string, colorType: string) {
		this.style = style;																// necessary to persist and delegate
		try {
			let colorImg = "black", codemirrorCSS = "default", colorpickerCSS = "gray"; 
			
			if (colorType == "black") {
				colorImg = "white"
				codemirrorCSS = "zenburn"; 
				colorpickerCSS = "black";
			}
			this.codeMirrorEditor.setOption("theme", codemirrorCSS); 
			if (!this.runNotColorPicker) { 
				$("#colorpickerCSSblack").prop('disabled', colorpickerCSS != "black");
				$("#colorpickerCSSgray").prop('disabled', colorpickerCSS != "gray");
			}
			let posColor: number; 
			$(".symbol_btn").each(function(_index) { 
				if (this.className.includes("icon-matrix")) { 
					posColor = this.className.lastIndexOf("_"); 
					if (posColor) this.className = this.className.substring(0, posColor + 1) + colorImg; 
				} 
			}); 
			this.setRTLstyle();
		}
		catch(e) {
			console.error(`onStyleChanged error: ${e}`);		
		}
	}

	/**
	 * Updates the RTL flag after the language resource is updated.
	 * 
	 * Evt transfer this functionality to Themes.
	 */	
	setRTLstyle() {
		let dir = this.getLocalText("_i18n_HTML_Dir");
		this.rtlStyle = dir;
		this.themes.setRTLstyle(dir);
	}
	
	/**
	 * Convert text to boolean. Only "true" is truthy.
	 */
	getBoolean(text: string) { return (text == "true"); }
		
	/**
	 * Html-encodes string for attributes (quotes only).
	 */
	encodeStringForHTMLAttr(s: any) { 
		if (typeof s == "string") return s.replace("\"", "&quot;"); else return ""; 
	}
	
	/**
	 * Initializes an accordion (several palettes with symbols).
	 */
	initialiseUIaccordion(accordionID: string) {
		let vme = this; 
		$(accordionID).accordion({
			onSelect: async function(_title: string) {

				let fPanel = $(accordionID).accordion("getSelected"); 
				if (fPanel) { 
					let fPanelID = $(fPanel).attr("id");
					if (!vme.symbolPanelsLoaded.includes(fPanelID)) { 
						vme.symbolPanelsLoaded.push(fPanelID);
						// OLD - not functional in MOBILE
						$(fPanel).html(`<img src="icons/loading.gif" />`);
						
						// Trial for Android 
						let html = (await import(
							/* webpackInclude: /\.html$/ */ 
							`../formulas/${fPanelID}.html`)).default;
						$(fPanel).html(html);
						
						await vme.initialiseSymbolContent(fPanelID); 
						await vme.themes.activateStyle(vme.style);
						
						$(`#${fPanelID}`).on('click', 'a.more', 
							async function(event) { 
								event.preventDefault(); 
								await vme.initialiseUImoreDialogs(fPanelID); 
							}
						);
					} 
				}
				vme.setFocus();
			}
		}); 
		let p = $(accordionID).accordion('getSelected'); 
		if (p) { p.panel('collapse', false); }
		this.math.updateHeaders("");
	}
	
	/**
	 * The routine equips the entries in the given panel with functionality.
	 * 
	 * This is:
	 * - tool tip
	 * - info line
	 * - click event
	 */
	async initialiseSymbolContent(fPanelID: string) { 
		let vme = this; 
		/**
		 * Given an anchor object, determines and returns the included
		 * LATEX code used as info for tool tip and info line.
		 */
		function getSymbol(a: any) {
			let info: any = beginEndInfo(a);
			if (info !== null) return info[0] + info[1];
			info = latex(a);
			if (info !== null) return info;
			return vme.getLocalText("NO_LATEX"); 
		};
		
		/**
		 * Returns the begin to end info of an anchor.
		 */
		function beginEndInfo(a: any) {
			if ($(a).attr("lbegin") != undefined && $(a).attr("lend") != undefined) 
				return [$(a).attr("lbegin"), $(a).attr("lend")];
			return null; 
		};
		
		/**
		 * Returns the latex info of an anchor.
		 */
		function latex(a: any) {
			if ($(a).attr("latex") != undefined)
				return $(a).attr("latex");
			return null;
		};
		
		$(`#${fPanelID} a.s`)
		.each(function() {
			let tt = getSymbol(this);
			vme.math.equipWithTooltip($(this), tt, true);
		});
		$(`#${fPanelID} a.s`).on('click', function(event) {
			event.preventDefault(); 
			let info: any = beginEndInfo(this);
			if (info !== null) {
				const [ a, b ] = info;
				vme.tag(a, b);
				return;
			}
			info = latex(this);
			if (info !== null) {
				vme.insert(info);
				return;
			}
			vme.messager.show("INFORMATION", "NO_LATEX");
		}); 
		
		// this is solely for a single ...more button linking to a dialog
		// containing more formulae.
		$(`#${fPanelID} a.more`)
		.addClass("easyui-tooltip")
		.attr("title", function(_index: number, _attr: any) { return "Loading more formulae"; });

		await vme.parser.parseAsync("#" + fPanelID); 
		await this.math.updateTables();
	}
	
	/**
	 * Updates a few dialogs with formulae.
	 * 
	 * The candidates here are:
	 * - the panels of the info dialog
	 * - the equation dialog
	 * - the special characters dialog
	 */
	async updateInfo() {
		let vme = this;
		await vme.parser.parseAsync('div[href]', 0, 100);
		console.info(`Parse completed for : div[href]`);

		// updates exactly 2 dialogs (see selectors)
		// Necessary and additional ones required?
		vme.math.inplaceUpdate('#tEQUATION div a.s[latex], #mSPECIAL_CHARACTER div a.s[latex]', true);	// where and when to do that
	}
	
	/**
	 * Sets the base location.
	 * 
	 * This will be needed for relative paths of some content like css or html files.
	 * This method is only called once in constructor.
	 */
	setBaseLocation() : string {
		let bundlePath = $("script[src$='main.js']")
			.last()
			.attr("src")
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20') + '/';
		if (bundlePath == '/' && 
			globalThis.location.protocol == 'file:') {		// local file system
			bundlePath = `${globalThis.location}`
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20') + '/';			
		}

		console.info(`Base location is : ${bundlePath}`);
		
		$('html > head').append($('<base />'));
		$('html > head > base').attr('href', bundlePath);
		
		return bundlePath;
	}
	
	/**
	 * Adds a build number to the developer version.
	 */
	addBuild() {
		const heading = $('h3').text();
		const build = `build ${String(this.versions.build).padStart(4, '0')}`;
		const mobile = `${this.platformInfo.isMobile ? 'mobile' : 'desktop'}`;
		if (!PRODUCTION) {
			$('h3').text(`${heading} : ${build} on ${mobile}`);
		}
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { KatexInputHelper };
} catch(e) { }

