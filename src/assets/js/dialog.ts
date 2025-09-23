import './dialog.scss' assert { type: 'css' };

import { VKI_init } from './keyboard/keyboard';
import { FileHandler } from "./fileHandling";

import { inject } from 'inversify';
import { 
	IKatexInputHelper, 
	ILocalizer, localizerId,
	IMessager, messagerId, 
	platformInfoId, 
	IUtilities, utilitiesId, 
	parametersId, 
	IThemes, themesId, 
	IParser, parserId, 
	IMath, mathId, ICodeMirror,
	IPanels, panelsId, matrixWindowId, unicodeWindowId, informationWindowId, moreDialogId, windowId, dynamicPanelId } from './interfaces';

let console: any; 
if (window.console) console = window.console; else console = { log: function(msg) { }, error: function(msg) { } }; 
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
		if (!this.windowIsOpening) {
			let url = this.getUrl(key);
			let name = this.baseInfo[key].name; 

			this.windowIsOpening = true; 
			let params = this.params.join(',');
			let win = window.open(url, name, params); 
			this.windowIsOpening = false; 
			return win; 
		} else { 
			return null; 
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
	runNotMathJax = true;

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
	baseLocation = "";
	parser: IParser = null;
	mathTextInput: any = null;
	mathVisualOutput: any = null;
	VKI_show: any = null;
	
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
		@inject(platformInfoId) platformInfo : any
	) {
		let vme = this;
		window.vme = this;
		globalThis.vme = this;
		this.platformInfo = platformInfo;
	
		$('body').on('error', (event) => {
			console.error(`Error : %O`, event);
		})
		
		// independent of plugin variant
		this.baseLocation = this.setBaseLocation();
		
		// Probably not needed
		console.info(`Url: ${window.location}`);
		
		this.url = {
			param: function(name: string) {
				let params = {
					runLocal: true,
					codeType: "Latex",
				};
				try {
					return vme.parameters[name];				
				} catch(e) {
					console.warn(`Url Access could not resolve name: ${name}`);
					return params[name];
				}
			}
		};
		
		this.parameters = parameters;
		this.localizer = localizer;
		this.messager = messager;
		this.utilities = utilities;
		this.themes = themes;
		this.parser = parser;
		this.math = math;
		this.codeMirrorEditor = math.codeMirror;
		this.panels = panels;
		this.documentations = new Documentations(false, this.baseLocation);

		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput'); 
		
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
	 * Initialize. Performs the whole initialization.
	 */
	async initialise() { 

		let vme = this;
		this.versions = await import( /* webpackInclude: /\.json$/ */ './versions.json');
		
		this.parser.initialise();		
		await this.parameters.queryParameters();							// from Plugin		

		// Query string may be a better solution than detection
		this.platformInfo = { isMobile: this.parameters.isMobile, osFamily: 'Unknown' };
		this.addBuild();
		
		if (this.parameters.isMobile) {
			let opts = { assert: { 
				type: 'css'
			} };
			await import('./jquery-easyui/themes/mobile.css', opts);
			// Throws in matrix window
			let mobile = await import('./jquery-easyui/jquery.easyui.mobile');
			$.mobile.init();
		}

		// IN QUESTION
		await vme.initialiseCodeMirror();
		this.localizer.subscribe(this.onLocaleChanged.bind(this));
		await this.localizer.initialiseLanguageChoice(this.localType);		// Progress dialog uses localized text
		
		$.messager.progress({
			title: "Katex Input Helper", 
			text: vme.getLocalText("WAIT_FOR_EDITOR_DOWNLOAD"), 
			msg:	"<center>&copy; " +
						"<a href='mailto:juergen@habelt-jena.de?subject=Katex%20Input%20Helper' target='_blank' class='bt' >Jürgen Habelt</a> -" + 
						"<a href='https://github.com/Mick2nd/Katex-Input-Helper' target='_blank' class='bt' >A Joplin plug-in</a><br/><br/>" +
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

		vme.endWait(); 
	}
	
	/**
	 * At the end of initialization close Progress dialog and WaitMsg
	 * 			 panel.
	 */
	endWait() { 
		this.initialiseEquation(); 
		$.messager.progress('close'); 
		$("#WaitMsg").panel('close');
		this.setFocus(); 
	}
	
	/**
	 * Set Focus on Editor.
	 */
	setFocus() { 
		$("#mathTextInput").trigger("focus"); 
		if (this.codeMirrorEditor) { this.codeMirrorEditor.focus(); } 
	}
	
	/**
	 * Sets Cursor at editor end.
	 */
	setCodeMirrorCursorAtEnd() { 
		let pos = { 
			line: this.codeMirrorEditor.lastLine(), 
			ch: this.codeMirrorEditor.getValue().length 
		}; 
		this.codeMirrorEditor.setCursor(pos); 
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
	initialiseCodeMirror() { 
		let vme = this; 
		const codeMirrorEditor = this.codeMirrorEditor;
		const option = vme.platformInfo.isMobile ? 'contenteditable' : 'textarea';
		codeMirrorEditor.setOption('inputStyle', option);
		codeMirrorEditor.on("change", function() { vme.autoUpdateOutput(); }); 
		
		if(!vme.platformInfo.isMobile) {
			/*	The context menu appears but throws on click or mouse move afterwards:
				NO OWNER => special handling.
			 */
			$(".CodeMirror").on('contextmenu', (event) => vme.onContextMenu('#mINSERT', event)); 
		} else {
			$('.CodeMirror').css('fontSize', '1.3em');
		}
	}

	/**
	 * Handles context menu invocation.
	 * 
	 * TODO: This is a workaround because of crashs raised otherwise. The hide method
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
		// this code uses CSS to shift the context menu to the desired location (and its)
		// shadow
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
		$("#mFILE, #mINSERT, #mTOOLS, #mVIEW, #mOPTIONS, #mINFORMATIONS").menu({
			onClick: async function(item: any) {
				console.log(`ITEM : %O`, this);
				switch (item.target.id) {
					case "mEDITOR_PARAMETERS": await vme.openWindow('wEDITOR_PARAMETERS'); break; 
					case "mSTYLE_CHOISE": await vme.openWindow('wSTYLE_CHOISE'); break; 
					case "mLANGUAGE_CHOISE": await vme.openWindow('wLANGUAGE_CHOISE'); break; 
					case "mMATRIX": vme.showMatrixWindow(3, 3);  break; 
					case "mCOMMUTATIVE_DIAGRAM": await vme.initialiseUImoreDialogs("f_COMMUTATIVE_DIAGRAM"); break; 
					case "mCHEMICAL_FORMULAE": await vme.initialiseUImoreDialogs("f_CHEMICAL_FORMULAE"); break; 
					case "mSAVE_EQUATION": vme.saveEquationFile(); break; 
					case "mOPEN_EQUATION": vme.testOpenFile(); break; 
					case "mLaTeX_TEXT": vme.insert("\\LaTeX"); break; 
					// No longer functional
					//case "mMATH_ML": vme.viewMathML(vme.mathVisualOutput.id); break; 
					// TODO: complete transfer of functionality to Panels
					case "mUNICODES_LIST": await vme.panels.showWindowDI(unicodeWindowId, 'wUNICODES_LIST', vme.initialiseSymbolContent.bind(vme)); break; 
					case "mLATEX_CODES_LIST": vme.documentations.showKatexFunctions(); break; 
					case "mLANG_RESSOURCE_LIST": await vme.openWindow('wLANGUAGE_LIST'); await vme.initialiseLangRessourcesList(); break; 
					case "mLATEX_DOCUMENTATION": vme.documentations.showLatexDocumentation(); break;
					case "mMHCHEM_DOCUMENTATION": vme.documentations.showMhchemDocumentation(); break;
					case "mAMSCD_DOCUMENTATION": vme.documentations.showAmscdDocumentation(); break;
					case "mMATH_ML_SPECIFICATIONS": vme.documentations.showMathmlSpecifications(); break;
					case "mCOPYRIGHT": await vme.openInformationTab(0); break; 
					case "mVERSION": await vme.openInformationTab(1); break; 
					case "mBUGS": await vme.openInformationTab(2); break; 
					case "mEQUATION_SAMPLE": await vme.openInformationTab(3); break; 
					case "f_GREEK_CHAR": await vme.initialiseUImoreDialogs("f_L_U_GREEK_CHAR"); break; 
					case "mCHARS": 
					case "f_ALL_CHAR": await vme.initialiseUImoreDialogs("f_ALL_CHAR"); break; 
					case "f_FR_CHAR": 
					case "f_BBB_CHAR": await vme.initialiseUImoreDialogs(item.target.id); break; 
					case "mEQUATION": await vme.initialiseUImoreDialogs("f_EQUATION"); break; 
					case "mCUSTOM_EQUATIONS": await vme.panels.showWindowDI(dynamicPanelId, 'wf_CUSTOM_EQUATIONS_MORE', vme.math); break;
					case "mHORIZONTAL_SPACING": await vme.initialiseUImoreDialogs("f_HORIZONTAL_SPACING"); break; 
					case "mVERTICAL_SPACING": await vme.initialiseUImoreDialogs("f_VERTICAL_SPACING"); break; 
					case "mSPECIAL_CHARACTER": await vme.initialiseUImoreDialogs("f_SPECIAL_CHARACTER"); break; 
					case "mKEYBOARD": if (!vme.runNotVirtualKeyboard) { vme.VKI_show(document.getElementById("tKEYBOARD")); $("#keyboardInputMaster").draggable({ handle: '#keyboardTitle' }); } break; 
					default: $.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: item.text }); break;
				}
			}
		});
		
		if (!window.opener) { 
			$("#mQUIT_EDITOR").addClass("menu-item-disabled").on('click', function(event) { }); 
		}
		if (typeof (FileReader) == "undefined") { 
			$("#mOPEN_EQUATION").addClass("menu-item-disabled").on('click', function(event) { vme.testOpenFile(); }); 
		}
		$("#fOPEN_EQUATION").on('change', function(event) { vme.openFile(event); }); 
		
		// The Symbol palettes
		this.initialiseUIaccordion("#f_SYMBOLS"); 
		this.initialiseUIaccordion("#f_SYMBOLS2"); 

		// Configures Clicks on close buttons and Key handlers, Context menus and others
		$('#btSTYLE_CHOISE_CLOSE').on('click', function(event) { 
			event.preventDefault(); 
			$('#wSTYLE_CHOISE').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btLANGUAGE_CHOISE_CLOSE').on('click', function(event) { 
			event.preventDefault(); 
			$('#wLANGUAGE_CHOISE').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btEDITOR_PARAMETERS_CLOSE').on('click', function(event) { 
			event.preventDefault(); 
			$('#wEDITOR_PARAMETERS').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btRESET_WINDOW_POSITIONS').on('click', function(event) { 
			event.preventDefault(); 
			vme.parameters.resetWindowPositions();
			vme.messager.show('RESTART', 'RESTART_REQUIRED');
		}); 
		$("#mathVisualOutput").on('contextmenu', (event) => vme.onContextMenu('#mVIEW', event)); 
		$("[information]").on('mouseover', function(event) { 
			$("#divInformation").html(vme.getLocalText($(this).attr("information"))); 
		}); 
		$("[information]").on('mouseout', function(event) { 
			$("#divInformation").html("&nbsp;"); 
		}); 

		$('body').on('click', '#btCOPYRIGHT', async function(event) { 
			event.preventDefault(); 
			await vme.openInformationTab(0); 
			vme.setFocus(); 
		});
		
		// TEST: MAIL
		$('body')
		.on('mouseover', 'a.bt', function(event) {
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
	
		this.math.updateLatexMenu();
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
		await vme.panels.showWindowDI(moreDialogId, fPanelMoreID, vme.initialiseSymbolContent.bind(vme));
	}
	
	/**
	 * Registers events for a window and opens it.
	 * 
	 * This whole effort is done to get the window position and size persisted.
	 * 
	 * @param id - the HTML id of the window
	 */
	async openWindow(id: string) {
		await this.panels.showWindowDI(windowId, id);
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
		if (param && typeof (param) != "undefined") {
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
		
		$("#autoUpdateTime").on('change', function(event) { 
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
	 * Not defined for Katex. Reserved for future use.
	 */
	async initialiseLatexMathjaxCodesList() {
		if (!this.latexMathjaxCodesListLoaded) {
			function listNames(obj: any, prefix: string) {
				let html = ""; 
				for (let i in obj) { 
					if (obj[i] != 'Space') html += ('<tr><td dir="ltr"><a href="#" class="s" latex="' + prefix + i + '">' + prefix + i + '</a></td><td></td></tr>'); 
				}
				return html;
			}
			function listNamesValues(obj, prefix) {
				let html = ""; 
				let hexa = 0; 
				let output = ""; 
				for (let i in obj) { 
					if (typeof obj[i] === 'object') { 
						hexa = parseInt(obj[i][0], 16); 
						if (isNaN(hexa)) output = obj[i][0]; else output = "&#x" + obj[i][0] + ";"; 
						html += ('<tr><td dir="ltr"><a href="#" class="s" latex="' + prefix + i + '">' + prefix + i + '</a><td style="font-size:150%;"><a href="#" class="s" latex="' + prefix + i + '">' + output + '</a></td></tr>'); 
					} else { 
						hexa = parseInt(obj[i], 16); 
						if (isNaN(hexa)) output = obj[i]; else output = "&#x" + obj[i] + ";"; 
						html += ('<tr><td dir="ltr"><a href="#" class="s" latex="' + prefix + i + '">' + prefix + i + '</a><td style="font-size:150%;"><a href="#" class="s" latex="' + prefix + i + '">' + output + '</a></td></tr>'); 
					} 
				}
				return html;
			}
			if (!Object.keys) {
				Object.keys = function(obj) {
					let keys = [], k; 
					for (k in obj) { 
						if (Object.prototype.hasOwnProperty.call(obj, k)) { keys.push(k); } 
					}
					return keys;
				};
			}
			let special = {}; 
			let remap = {}; 
			let mathchar0mi = {}; 
			let mathchar0mo = {}; 
			let mathchar7 = {}; 
			let delimiter = {}; 
			let macros = {}; 
			let environment = {}; 
			let length = (Object.keys(special).length + Object.keys(remap).length + Object.keys(mathchar0mi).length + Object.keys(mathchar0mo).length + Object.keys(mathchar7).length + Object.keys(delimiter).length + Object.keys(macros).length + Object.keys(environment).length); let html = ("<table border='1' cellspacing='0' style='margin-left:20px;border-spacing:0px;border-collapse:collapse;'><caption>" + length + " <span locate='MATHJAX_LATEX_SYMBOLS'>" + this.getLocalText("MATHJAX_LATEX_SYMBOLS") + "</span></caption>"); html += ("\n<tr><th><span locate='MATHJAX_LATEX_INPUT'>" + this.getLocalText("MATHJAX_LATEX_INPUT") + "</span></th><th><span locate='OUTPUT'>" + this.getLocalText("OUTPUT") + "</span></th></tr>"); 
			html += listNames(special, ""); 
			html += listNamesValues(remap, ""); 
			html += listNamesValues(mathchar0mi, "\\"); 
			html += listNamesValues(mathchar0mo, "\\"); 
			html += listNamesValues(mathchar7, "\\"); 
			html += listNamesValues(delimiter, ""); 
			html += listNames(macros, "\\"); 
			html += listNames(environment, ""); 
			html += "\n</table>"; 
			$("#cLATEX_CODES_LIST").html(html); 
			await this.initialiseSymbolContent("cLATEX_CODES_LIST"); 
			this.latexMathjaxCodesListLoaded = true;
		}
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
	async onLocaleChanged(localizer) {
		this.localType = this.localizer.currentLocale;
		console.log(`Entry into onLocaleChanged, localType is: ${this.localType}`);
		let vme = this; 
		
		$("html").attr("xml:lang", vme.getLocalText("_i18n_HTML_Lang")); 
		$("html").attr("lang", vme.getLocalText("_i18n_HTML_Lang")); 
		$("html").attr("dir", vme.getLocalText("_i18n_HTML_Dir")); 
		vme.setRTLstyle();
		
		$("span[locate]").each(
			function() { 
				if (typeof ($(this).attr("locate")) != "undefined") { 
					let localText = vme.getLocalText($(this).attr("locate")); 
					if (typeof (localText) != "undefined") $(this).html(localText); 
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
		if (typeof (vme.autoUpdateOutputTimeout) != "undefined" && vme.autoUpdateOutputTimeout != null) { 
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
	 * Plays a role in Html, possibly for formulae with insertion point.
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
	openFile(event) {
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
	onStyleChanged(style: string, rtlStyle: string, colorType: string) {
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
				$("#colorpickerCSSblack").prop('disabled', !(colorpickerCSS == "black"));
				$("#colorpickerCSSgray").prop('disabled', !(colorpickerCSS == "gray"));
			}
			let posColor, posExt; 
			$(".symbol_btn").each(function(index) { 
				if (this.className.indexOf("icon-matrix") > -1) { 
					posColor = this.className.lastIndexOf("_"); 
					if (posColor) this.className = this.className.substr(0, posColor + 1) + colorImg; 
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
			onSelect: function(title: string) {

				let fPanel = $(accordionID).accordion("getSelected"); 
				if (fPanel) { 
					let fPanelID = $(fPanel).attr("id"); 
					if (vme.symbolPanelsLoaded.indexOf(fPanelID) == -1) { 
						vme.symbolPanelsLoaded.push(fPanelID);
						$(fPanel).html(`<img src="icons/loading.gif" />`);
						
						let options = $(fPanel).panel('options');				// avoid recreation of panel (arrows lost)
						options.onLoad = async function() { 
							await vme.initialiseSymbolContent(fPanelID); 
							vme.math.updateHeaders(`#${fPanelID}`);				// with panel id not working
							await vme.themes.activateStyle(vme.style);
						};
						
						$(fPanel).panel('refresh', `formulas/${fPanelID}.html`);
						
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
			if (typeof ($(a).attr("lbegin")) != "undefined" && typeof ($(a).attr("lend")) != "undefined") 
				return [$(a).attr("lbegin"), $(a).attr("lend")];
			return null; 
		};
		
		/**
		 * Returns the latex info of an anchor.
		 */
		function latex(a: any) {
			if (typeof ($(a).attr("latex")) != "undefined")
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
		.attr("title", function(index: number, attr: any) { return "Loading more formulae"; });

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
		$('div[href]')
		.each(function( idx: number ) {
			let href = $(this).attr('href');
			let id = $(this).attr('id');
			if (href.length <= 1) {													// info html !
				console.info(`Info dialog with : id : ${id}, href : ${href}`);
				let newHref = `information/${id}.html`;								// lazily load html info
				$(this).attr('href', newHref);
				$(this).load(newHref);
			}
		});

		await vme.parser.parseAsync('div[href]', 0, 100);
		console.info(`Parse completed for : div[href]`);

		$("#VMEversion").html(`
				<table class="inline-table">
					<tr><td><b> ${vme.versions.version} </b></td><td><b>Katex Input Helper / Visual Math Editor</b>, (This software)</td></tr>
					<tr><td> ${vme.versions.katexVersion} </td><td>Katex</td></tr>
					<tr><td> ${vme.codeMirrorEditor.version} </td><td>Code Mirror</td></tr>
					<tr><td> ${vme.versions.VKI_version} </td><td>Virtual Keyboard</td></tr>
					<tr><td> ${$.fn.jquery} </td><td>Jquery</td></tr>
					<tr><td> ${vme.versions.easyuiVersion} </td><td>Jquery Easyui</td></tr>
					<tr><td> ${vme.versions.colorPickerVersion} </td><td>Jquery Color Picker</td></tr>
				<table>`); 
		$("#VMEdate").html((new Date()).getFullYear().toString());
		
		// updates exactly 2 dialogs (see selectors)
		// TODO: necessary and additional ones required?
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
			window.location.protocol == 'file:') {		// local file system
			bundlePath = `${window.location}`
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20') + '/';			
		}
		// TEST CODE to check path OR mobile detection
		// $('h3').text(bundlePath);
		// let heading = $('h3').text();
		// $('h3').text(`${heading} on ${this.mobile ? 'mobile' : 'desktop'} device`);

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
		const osFamily = this.platformInfo.osFamily;
		if (!PRODUCTION) {
			$('h3').text(`${heading} : ${build} on ${mobile}`);
		}
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { KatexInputHelper };
} catch(e) { }

