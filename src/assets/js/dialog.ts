import './dialog.css' assert { type: 'css' };

const CodeMirror = (await import('codemirror')).default;
await import('codemirror/mode/stex/stex');						// manual recommendation

await import('jquery-contextmenu');

import { VKI_init } from './keyboard/keyboard';
import { ParametersProxy } from "./parameters";
import { Localizer } from './localization';
import { Themes } from './themes';
import { Messager, Utilities } from './helpers';
import { ParserExtension } from './parserExtension';
import { MathFormulae } from './math';
import { KIHPanels } from "./panels";
import { FileHandler } from "./fileHandling";


let console; 
if (window.console) console = window.console; else console = { log: function(msg) { }, error: function(msg) { } }; 
console.log(KIH_VERSION);

/**
 * @abstract Responsible for showing documentation.
 */
class Documentations {

	windowIsOpening = false;
	runLocal = false;
	baseLocation = "";
	baseInfo = null;
	params = [];
	
	/**
	 * @abstract Constructor.
	 * 
	 * @param runLocal - true for local source
	 * @param baseLocation - to be used for local document path
	 */
	constructor(runLocal, baseLocation) {
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

	getUrl(key) {
		let info = this.baseInfo[key];
		return this.runLocal ? (this.baseLocation + 'doc/' + info.file) : info.url;
	}

	showWindow(key) {
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
 * @abstract The main class Katex Input Helper
 */
export class KatexInputHelper {

	versions = null;
	codeType = 'Latex'; 
	saveOptionInCookies = false; 
	isBuild = false; 
	windowIsOpenning = false; 
	textareaIgnore = false; 
	textareaID = null; 
	codeMirrorEditor = null;
	codeMirrorTheme = '';
	mobile = false;
	symbolPanelsLoaded = []; 
	latexMathjaxCodesListLoaded = false; 
	uniCodesListLoaded = false; 
	autoUpdateOutputTimeout = null; 
	notAllowedKeys = [9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 91, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145]; 
	allowedCtrlKeys = [86, 88, 89, 90]
	notAllowedCtrlKeys = []; 
	notAllowedAltKeys = []; 
	
	// The Color Picker is a fixed instance and can be used to work with colors
	runNotColorPicker = true;
	runNotVirtualKeyboard = false;
	runNotMathJax = true;
	runNotCodeMirror = false;

	url: any = null;
	rtlStyle = 'ltr';
	location = "";
	documentations = null;
	localizer = null;
	themes = null;
	math = null;
	parameters = null;
	utilities = null;
	messager = null;
	panels = null;
	useEasyLoader = true;
	baseLocation = "";
	fromContextMenu = false;
	parser: any = null;
	mathTextInput: any = null;
	mathVisualOutput: any = null;
	VKI_show: any = null;
	
	/**
	 * Constructor
	 */
	constructor(mobile = false) {
		let vme = this;
		window.vme = this;
		globalThis.vme = this;
		this.mobile = mobile;
	
		$('body').on('error', (event) => {
			console.error(`Error : %O`, event);
		})
		
		// independent of plugin variant
		this.baseLocation = this.setBaseLocation();
		
		// Probably not needed
		console.info(`Url: ${window.location}`);
		
		this.url = {
			param: function(name) {
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
		
		this.documentations = new Documentations(false, this.baseLocation);
		this.parameters = ParametersProxy();
		this.localizer = new Localizer();
		this.messager = new Messager(this.localizer);
		this.utilities = new Utilities(this.localizer);
		this.themes = new Themes();
		this.parser = new ParserExtension(true);
		this.math = new MathFormulae(false, this.localizer, null, this.parameters, this.parser);	// code mirror per method injection
		this.panels = new KIHPanels(this.parameters, this.localizer, this.parser);

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
	 * @abstract Initialize. Performs the whole initialization.
	 */
	async initialise() { 

		let vme = this;
		this.versions = await import( /* webpackInclude: /\.json$/ */ './versions.json');
		this.addBuild();
		
		this.parser.initialise();		
		await this.parameters.queryParameters();							// from Plugin		

		// IN QUESTION
		await vme.initialiseCodeMirror();
		this.localizer.subscribe(this.onLocaleChanged.bind(this));
		await this.localizer.initialiseLanguageChoice(this.localType);		// Progress dialog uses localized text
		
		$.messager.progress({
			title: "VisualMathEditor", 
			text: vme.getLocalText("WAIT_FOR_EDITOR_DOWNLOAD"), 
			msg: "<center>&copy; <a href='mailto:contact@equatheque.com?subject=VisualMathEditor' target='_blank' class='bt' >David Grima</a> - <a href='http://www.equatheque.net' target='_blank' class='bt' >EquaThEque</a><br/><br/></center>", 
			interval: 300 
		}); 
		$('#form').hide();
		
		await vme.initialiseUI(); 
		await vme.updateInfo();												// updates a few dialogs
		vme.initialiseParameters(); 
		vme.initialiseCodeType(); 
		await vme.initialiseVirtualKeyboard(); 

		// IN QUESTION
		await this.onLocaleChanged(this.localizer);							// repeat because too soon after initialiseLanguageChoice
		this.themes.subscribe(this.onStyleChanged.bind(this));
		await this.themes.initialiseThemeChoice(this.style, this.rtlStyle); // RTL STYLE defined after locale language

		vme.endWait(); 
		vme.isBuild = true;
	}
	
	/**
	 * @abstract At the end of initialization close Progress dialog and WaitMsg
	 * 			 panel.
	 */
	endWait() { 
		this.initialiseEquation(); 
		$.messager.progress('close'); 
		$("#WaitMsg").panel('close');
		this.setFocus(); 
	}
	
	/**
	 * @abstract Set Focus on Editor.
	 */
	setFocus() { 
		$("#mathTextInput").focus(); 
		if (this.codeMirrorEditor) { this.codeMirrorEditor.focus(); } 
	}
	
	/**
	 * @abstract Sets Cursor at editor end.
	 */
	setCodeMirrorCursorAtEnd() { 
		let pos = { 
			line: this.codeMirrorEditor.lastLine(), 
			ch: this.codeMirrorEditor.getValue().length 
		}; 
		this.codeMirrorEditor.setCursor(pos); 
	}

	/**
	 * @abstract Initializes the virtual keyboard by loading a script.
	 */	
	async initialiseVirtualKeyboard() { 
		
		if (!this.runNotVirtualKeyboard) {
			VKI_init.bind(this)();
		}
	}
	
	/**
	 * @abstract Initialise the Code Mirror Editor.
	 * 
	 * This includes:
	 * - instance creation with parameters
	 * - change handler -> auto update of formula
	 * - context menu binding
	 */
	async initialiseCodeMirror() { 
		let vme = this; 
		vme.codeMirrorEditor = CodeMirror.fromTextArea($("#mathTextInput")[0] as HTMLTextAreaElement, { 
			mode: vme.encloseAllFormula ? "text/html" : "text/x-latex", 
			autofocus: true, 
			showCursorWhenSelecting: true, 
			// Unknown property
			//styleActiveLine: true, 
			lineNumbers: true, 
			lineWrapping: true, 
			// Unknown property
			//matchBrackets: true, 
			//autoCloseBrackets: true, 
			//autoCloseTags: vme.encloseAllFormula ? true : false, 
			//tabMode: "indent", 
			tabSize: 4, 
			indentUnit: 4, 
			indentWithTabs: true, 
			theme: "default",
			inputStyle: vme.mobile ? 'contenteditable' : 'textarea'
		}); 
		vme.codeMirrorEditor.on("change", function() { vme.autoUpdateOutput(); }); 
		
		if(!vme.mobile) {
			/*	The context menu appears but throws on click or mouse move afterwards:
				NO OWNER.
			 */
			$(".CodeMirror").bind('contextmenu', (event) => vme.onContextMenu('#mINSERT', event)); 
		} else {
			$('.CodeMirror').css('fontSize', '1.3em');
		}
		
		this.math.setEditorInstance(this.codeMirrorEditor);
		
		let panelOptions = $('#divMathTextInput').panel('options');
		panelOptions.onResize = function(width, height) {
			try {
				vme.codeMirrorEditor.setSize(width, height);
				vme.codeMirrorEditor.refresh();
			} catch(e) { }
		};
	}

	/**
	 * @abstract Handles context menu invocation.
	 * 
	 * TODO: This is a workaround because of crashs raised otherwise. The hide method
	 * will be overridden. Left unwanted effect: display of menu at false location,
	 * this can be handled by shifting the menu via CSS.
	 */	
	onContextMenu(selector, event) {
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
	 */
	logProperties(selector) {
		console.log(`Context-menu display : ${$(selector).css('display')}, ${$(selector).css('position')}`);
		console.log(`Context-menu %O`, $(selector)[0]);
	}
	
	/**
	 * @abstract Initializes the User Interface.
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
		$(document).bind('contextmenu', function(event) { event.preventDefault(); return false; }); 
		
		// The whole menu commands.
		// TRY different way: use options
		$("#mFILE, #mINSERT, #mTOOLS, #mVIEW, #mOPTIONS, #mINFORMATIONS").menu({
			onClick: async function(item) {
				console.log(`ITEM : %O`, this);
				switch (item.target.id) {
					case "mEDITOR_PARAMETERS": await vme.openWindow('wEDITOR_PARAMETERS'); break; 
					case "mSTYLE_CHOISE": await vme.openWindow('wSTYLE_CHOISE'); break; 
					case "mLANGUAGE_CHOISE": await vme.openWindow('wLANGUAGE_CHOISE'); break; 
					case "mMATRIX": vme.showMatrixWindow(3, 3); break; 
					case "mCOMMUTATIVE_DIAGRAM": await vme.initialiseUImoreDialogs("f_COMMUTATIVE_DIAGRAM"); break; 
					case "mCHEMICAL_FORMULAE": await vme.initialiseUImoreDialogs("f_CHEMICAL_FORMULAE"); break; 
					case "mSAVE_EQUATION": vme.saveEquationFile(); break; 
					case "mOPEN_EQUATION": vme.testOpenFile(); break; 
					case "mLaTeX_TEXT": vme.insert("\\LaTeX"); break; 
					//case "mMATH_ML": vme.viewMathML(vme.mathVisualOutput.id); break; 
					case "mUNICODES_LIST": await vme.openWindow('wUNICODES_LIST'); await vme.initialiseUniCodesList(); break; 
					case "mLATEX_CODES_LIST": await vme.openWindow('wLATEX_CODES_LIST'); await vme.initialiseLatexMathjaxCodesList(); break; 
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
					case "mCUSTOM_EQUATIONS": await vme.panels.showDynamicPanel(vme.math); break;
					case "mHORIZONTAL_SPACING": await vme.initialiseUImoreDialogs("f_HORIZONTAL_SPACING"); break; 
					case "mVERTICAL_SPACING": await vme.initialiseUImoreDialogs("f_VERTICAL_SPACING"); break; 
					case "mSPECIAL_CHARACTER": await vme.initialiseUImoreDialogs("f_SPECIAL_CHARACTER"); break; 
					case "mHTML_MODE": $("#btENCLOSE_TYPE").click(); break; 
					case "mKEYBOARD": if (!vme.runNotVirtualKeyboard) { vme.VKI_show(document.getElementById("tKEYBOARD")); $("#keyboardInputMaster").draggable({ handle: '#keyboardTitle' }); } break; 
					default: $.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: item.text }); break;
				}
			}
		});
		
		if (!window.opener) { 
			$("#mQUIT_EDITOR").addClass("menu-item-disabled").click(function(event) { }); 
		}
		if (typeof (FileReader) == "undefined") { 
			$("#mOPEN_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.testOpenFile(); }); 
		}
		$("#fOPEN_EQUATION").change(function(event) { vme.openFile(event); }); 
		
		// The Symbol palettes
		this.initialiseUIaccordion("#f_SYMBOLS"); 
		this.initialiseUIaccordion("#f_SYMBOLS2"); 

		// Configures Clicks on close buttons and Key handlers, Context menus and others
		$('#btMATRIX_CLOSE').click(function(event) { 
			event.preventDefault(); 
			$('#wMATRIX').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btMATRIX_SET').click(function(event) { 
			event.preventDefault(); 
			vme.setLatexMatrixInEditor(); 
			vme.updateOutput(); 
			$('#wMATRIX').dialog('close'); vme.setFocus(); 
		}); 
		$('#colsMATRIX, #rowsMATRIX').keyup(function(event) { 
			vme.updateMatrixWindow(); 
		}); 
		$('#btSTYLE_CHOISE_CLOSE').click(function(event) { 
			event.preventDefault(); 
			$('#wSTYLE_CHOISE').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btLANGUAGE_CHOISE_CLOSE').click(function(event) { 
			event.preventDefault(); 
			$('#wLANGUAGE_CHOISE').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btEDITOR_PARAMETERS_CLOSE').click(function(event) { 
			event.preventDefault(); 
			$('#wEDITOR_PARAMETERS').dialog('close'); 
			vme.setFocus(); 
		}); 
		$('#btRESET_WINDOW_POSITIONS').click(function(event) { 
			event.preventDefault(); 
			vme.parameters.resetWindowPositions();
			vme.messager.show('RESTART', 'RESTART_REQUIRED');
		}); 
		$("input[name='codeType']").change(function() { 
			vme.codeType = $("input[name='codeType']:checked").val() as string; 
			vme.printCodeType(); 
			vme.updateOutput(); 
		});
		$("#mathVisualOutput").bind('contextmenu', (event) => vme.onContextMenu('#mVIEW', event)); 
		$("[information]").mouseover(function(event) { 
			$("#divInformation").html(vme.getLocalText($(this).attr("information"))); 
		}); 
		$("[information]").mouseout(function(event) { 
			$("#divInformation").html("&nbsp;"); 
		}); 
		$('#unicodeChoise').combobox({ 
			valueField: 'value', 
			textField: 'text', 
			onSelect: async function(record) { 
				let range = record.value.split(","); 
				await vme.setUniCodesValues(vme.h2d(range[0]), 
				vme.h2d(range[1])); 
			}, 
			onLoadSuccess: async function() { 
				$(this).combobox("select", "0x25A0,0x25FF"); 
				await vme.setUniCodesValues(0x25A0, 0x25FF); 
			} 
		});

		$('body').on('click', '#btCOPYRIGHT', async function(event) { 
			event.preventDefault(); 
			await vme.openInformationTab(0); 
			vme.setFocus(); 
		});

		$('body').on('click', '#btTITLE_EDITION_SYNTAX,#btENCLOSE_TYPE', async function(event) { 
			event.preventDefault(); 
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
		this.htmlToolbarButtons(); 
	}
	
	/**
	 * @abstract Activates information tabs on the information dialog.
	 * 
	 * @param numTab - number (index) of the tab (0..3)
	 */
	async openInformationTab(numTab) { 
		await this.openWindow('wINFORMATIONS');
		$('#tINFORMATIONS').tabs('select', numTab); 
	}
	
	/**
	 * @abstract Initializes one of the "MORE" dialogs.
	 * 
	 * @param fPanelID - the panel id (this is the panel from which the more dialog is originating)
	 */
	async initialiseUImoreDialogs(fPanelID) {
		let vme = this;
		let fPanelMoreID = 'w' + fPanelID + '_MORE';
		await vme.panels.showMoreDialog(fPanelMoreID, vme.initialiseSymbolContent.bind(vme));
	}
	
	/**
	 * @abstract Registers events for a window and opens it.
	 * 
	 * This whole effort is done to get the window position and size persisted.
	 * 
	 * @param id - the HTML id of the window
	 */
	async openWindow(id) {
		await this.panels.showWindow(id);
	}
	
	/**
	 * @abstract Adapt UI to code type. (Latex or Ascii).
	 * 
	 * TODO: This is obsolete and can be removed in the future.
	 */
	printCodeType() { 
		$("[name='codeType']").filter("[value=" + this.codeType + "]").attr("checked", "checked"); 
		$("#title_Edition_Current_Syntax").text(this.codeType); 
		$("#title_Edition_Other_Syntax").text((this.codeType == "AsciiMath") ? "Latex" : "AsciiMath"); 
	}
	
	/**
	 * @abstract Same as *printCodeType*.
	 */
	initialiseCodeType() {
		this.printCodeType();
	}

	/**
	 * @abstract Initializes the Equation from the parameters.
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
	 * @abstract Initialises all **configuration** parameters including start time initialisation and change
	 * 			 handlers.
	 */
	initialiseParameters() {
		
		let vme = this;
		function onChange(target, value) {
			console.debug(`Checkbox content of ${$(target).attr('id')} changed to : ${value} `);
			if (value) {
				$(target).attr('checked', 'checked');
			} else {
				$(target).removeAttr('checked');
			}
		}
		
		function onAdditionalChange(value) {
			if (value) {
				$("#btENCLOSE_TYPE").removeClass("unselect"); 
				$('#HTML_TAG').show(); 
				vme.codeMirrorEditor.setOption("mode", "text/html"); 
				vme.codeMirrorEditor.setOption("autoCloseTags", true); 
			} else {
				$("#btENCLOSE_TYPE").addClass("unselect"); 
				$('#HTML_TAG').hide(); 
				vme.codeMirrorEditor.setOption("mode", "text/x-latex"); 
				vme.codeMirrorEditor.setOption("autoCloseTags", false); 
			}
		}

		onChange('#encloseType', this.encloseAllFormula);
		onAdditionalChange(this.encloseAllFormula);
		$("#autoUpdateTime").val(this.autoUpdateTime);
		onChange('#menuupdateType', this.menuupdateType);
		onChange('#autoupdateType', this.autoupdateType);
		onChange('#persistWindowPositions', this.persistWindowPositions);
		onChange('#persistEquations', this.persistEquations);
		
		$("#encloseType").change(function(event) {
			vme.encloseAllFormula = !vme.encloseAllFormula;
			onChange(event.target, vme.encloseAllFormula);
			onAdditionalChange(vme.encloseAllFormula);
			vme.updateOutput(); 
		}); 
		$("#autoUpdateTime").change(function(event) { 
			vme.autoUpdateTime = $("#autoUpdateTime").val(); 
		});
		$("#menuupdateType").change(function(event) {
			vme.menuupdateType = !vme.menuupdateType;
			onChange(event.target, vme.menuupdateType);
		}); 
		$("#autoupdateType").change(function(event) { 
			vme.autoupdateType = !vme.autoupdateType;
			onChange(event.target, vme.autoupdateType);
		}); 
		$("#persistWindowPositions").change(function(event) { 
			vme.persistWindowPositions = !vme.persistWindowPositions;
			onChange(event.target, vme.persistWindowPositions);
		}); 
		$("#persistEquations").change(function(event) { 
			vme.persistEquations = !vme.persistEquations;
			onChange(event.target, vme.persistEquations);
		}); 
	}
	
	/**
	 * @abstract Not defined for Katex. Reserved for future use.
	 */
	async initialiseLatexMathjaxCodesList() {
		if (!this.latexMathjaxCodesListLoaded) {
			function listNames(obj, prefix) {
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
	 * @abstract Initialises the Unicode List.
	 */
	async initialiseUniCodesList() : Promise<void> {
		let vme = this;
		if (!this.uniCodesListLoaded) {
			let html = "<table><caption>[0x0000,0xFFFF]</caption>"; 
			for (let i = 0; i <= 650; i = i + 10) {
				html += "\n<tr>"; 
				for (let j = i; j < i + 10; j++) { 
					if (j > 655) break;
					let cellDec = (i < 10 ? "00" : (i < 100 ? "0" : "")) + j;
					html += `<td><a style='border:1px solid #f0f0f0;' class='s' href='#'>${cellDec}</a></td>`; 
				}
				html += "</tr>";
			}
			html = html + "\n</table>"; 
			$("#cUNICODES_LIST").html(html);
			$("#cUNICODES_LIST a.s")
				.click(async function(event) {
					console.debug(`click event`);
					event.preventDefault();
					let j = parseInt($(this).text());
					await vme.selectUniCodesValues(((j * 100) + 1), ((j + 1) * 100));
					return false;	
				}); 
			this.uniCodesListLoaded = true; 
			let json = await import(
				/* webpackInclude: /\.json$/ */
				`../formulas/unicodeChoiseData.json`);
			$('#unicodeChoise').combobox('loadData', json);
		}
	}
	
	/**
	 * @abstract Selects a range of Unicode Characters and inserts it in a table.
	 */
	async selectUniCodesValues(i1, i2) { 
		$('#unicodeChoise').combobox("select", ""); 
		await this.setUniCodesValues(i1, i2, true); 
	}
	
	/**
	 * @abstract Inserts a range of Unicode Characters for display in the table.
	 * 
	 * @param {boolean} breakFFFF - breaks rendering, TODO: default added, correct?
	 */
	async setUniCodesValues(i1, i2, breakFFFF = false) {
		let html = ("<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;'>"); 
		html += `
			<tr>
				<th><span locate='UNICODES_INPUT'>${this.getLocalText("UNICODES_INPUT")}</span></th>
				<th>HEXA</th>
				<th><span locate='OUTPUT'>${this.getLocalText("OUTPUT")}</span></th>
			</tr>
		`;
		for (let i = i1; i <= i2; i++) { 
			if (breakFFFF && i > 65535) break; 
			html += `
				<tr>
					<td>${i}</td>
					<td style='text-align:center;'>${this.d2h(i)}</td>
					<td style='font-size:150%;text-align:center;'>
						<a href='#' class='s' latex='\\char"${this.d2h(i)} '>&#${i};</a>
					</td>
				</tr> 
			`;
		}
		html = html + "\n</table>"; 
		$("#cUNICODES_VALUES").html(html); 
		$("#cUNICODES_VALUES").scrollTop(0); 
		await this.initialiseSymbolContent("cUNICODES_VALUES");
	}
	
	/**
	 * @abstract Opens the Matrix window with given rows and columns values.
	 * 
	 * @param {int} rows - the number of matrix rows 
	 * @param {int} cols - the number of matrix columns
	 */
	showMatrixWindow(rows, cols) { 
		this.openWindow('wMATRIX'); 
		this.updateMatrixWindow(rows, cols); 
	}
	
	/**
	 * @abstract Updates the Matrix window with given rows and columns values.
	 * 
	 * @param {int} rows - the number of matrix rows 
	 * @param {int} cols - the number of matrix columns
	 */
	async updateMatrixWindow(rows = 3, cols = 3) {
		let vme = this;
		if (typeof rows != "undefined" && rows != null) document.formMATRIX.rowsMATRIX.value = rows; 
		if (typeof cols != "undefined" && cols != null) document.formMATRIX.colsMATRIX.value = cols; 
		rows = document.formMATRIX.rowsMATRIX.value; 
		cols = document.formMATRIX.colsMATRIX.value; 
		let html = '<table style="border-spacing:0px; border-collapse:collapse;">'; 
		let r, c, value; for (r = 1; r <= rows; r++) {
			html += "<tr>"; 
			for (c = 1; c <= cols; c++) {
				value = ("a_{" + r + c + "}");
				html = html + "<td><input type='text' size='5' name='a_" + r + c + "' value='" + value + "'/></td>";
			}
			html += "</tr>";
		}
		html += "</table>"; 
		$("#showMATRIX").html(html); 
		await this.parser.parseAsync('#wMATRIX');										// after dynamically set the content
		$('#wMATRIX').dialog('open'); 
		let width = 20 + $("#tableMATRIX").width(); 
		let height = 100 + $("#tableMATRIX").height(); 
		if (width < 240) width = 240; 
		if (height < 160) height = 160;
		
		let options = $('#wMATRIX').dialog('options');
		$('#wMATRIX').dialog({ 
			title: vme.getLocalText("MATRIX"), 
			width: width, 
			height: height,
			left: options.left,									// HAS NO EFFECT !!
			top: options.top 
		}); 
		$('#wMATRIX').dialog('open');
	}
	
	/**
	 * @abstract Transfers the Matrix displayed in the Matrix window to the Editor.
	 */
	setLatexMatrixInEditor() {
		let vme = this; 
		let cols = document.formMATRIX.colsMATRIX.value; 
		let rows = document.formMATRIX.rowsMATRIX.value; 
		let formula = ""; 
		let r, c; 
		for (r = 1; r <= rows; r++) {
			for (c = 1; c <= cols; c++) { 
				eval("formula = formula + document.formMATRIX.a_" + r + c + ".value"); 
				if (c < cols) formula += " & "; 
			}
			if (r < rows) formula += " \\\\ ";
		}
		let left = document.formMATRIX.leftbracketMATRIX.value; 
		let right = document.formMATRIX.rightbracketMATRIX.value; 
		let matrix = ""; 
		if (left != "{:") matrix += "\\left "; 
		if (left == "{" || left == "}") matrix += "\\"; 
		if (left == "||") matrix += "\\|"; 
		if (left == "(:") matrix += "\\langle"; 
		if (left == ":)") matrix += "\\rangle"; 
		if (left != "{:" && left != "||" && left != ":)" && left != "(:") matrix += document.formMATRIX.leftbracketMATRIX.value; 
		matrix += " \\begin{matrix} "; matrix += formula; 
		matrix += " \\end{matrix} "; 
		if (right != ":}") matrix += " \\right "; 
		if (right == "}" || right == "{") matrix += "\\";
		if (right == "||") matrix += "\\|"; 
		if (right == "(:") matrix += "\\langle"; 
		if (right == ":)") matrix += "\\rangle"; 
		if (right != ":}" && right != "||" && right != ":)" && right != "(:") matrix += document.formMATRIX.rightbracketMATRIX.value; 
		matrix += " "; 
		vme.insert(matrix);
	}

	/**
	 * @abstract Wrapper of the Localizer routine.
	 */	
	getLocalText(TEXT_CODE) { 
		try { 
			return this.localizer.getLocalText(TEXT_CODE);
		} catch (e) { return ""; } 
	}
	
	/**
	 * @abstract This is the observer for Language changes, it switches the language of the UI.
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

		vme.switchHtmlMode(vme.encloseAllFormula);
		
		this.printCodeType();
	}
	
	/**
	 * @abstract Handlers for the HTML toolbar buttons.
	 * 
	 * This is the only place, where the ColorPicker is used. The click events
	 * are assigned to static Html content, no need to re-invoke this in
	 * *onLocaleChanged*.
	 */
	htmlToolbarButtons() {
		let vme = this;
		$("#btHTML_STRONG").click(function(event) { event.preventDefault(); vme.tag("<strong>", "</strong>"); }); 
		$("#btHTML_EM").click(function(event) { event.preventDefault(); vme.tag("<em>", "</em>"); }); 
		$("#btHTML_U").click(function(event) { event.preventDefault(); vme.tag("<u>", "</u>"); }); 
		$("#btHTML_S").click(function(event) { event.preventDefault(); vme.tag("<s>", "</s>"); }); 
		$("#btHTML_BR").click(function(event) { event.preventDefault(); vme.insert("<br/>"); }); 
		$("#btHTML_P").click(function(event) { event.preventDefault(); vme.tag("<p>", "</p>"); }); 
		$("#btHTML_H1").click(function(event) { event.preventDefault(); vme.tag("<h1>", "</h1>"); }); 
		$("#btHTML_H2").click(function(event) { event.preventDefault(); vme.tag("<h2>", "</h2>"); }); 
		$("#btHTML_H3").click(function(event) { event.preventDefault(); vme.tag("<h3>", "</h3>"); }); 
		$("#btHTML_Latex").click(function(event) { event.preventDefault(); vme.tag("$", " $"); }); 
		$("#btHTML_LatexLine").click(function(event) { event.preventDefault(); vme.tag("$$", " $$"); }); 
		$("#btHTML_AsciiMath").click(function(event) { event.preventDefault(); vme.tag("`", " `"); }); 
		$("#btHTML_OL").click(function(event) { event.preventDefault(); vme.tag("\n<ol>\n\t<li>", "</li>\n</ol>\n"); }); 
		$("#btHTML_UL").click(function(event) { event.preventDefault(); vme.tag("\n<ul>\n\t<li>", "</li>\n</ul>\n"); }); 
		$("#btHTML_A").click(function(event) { event.preventDefault(); vme.tag("<a href=\"http://www.equatheque.net\">", "</a>"); }); 
		$("#btHTML_HR").click(function(event) { event.preventDefault(); vme.insert("<hr/>"); }); 
		$("#btHTML_IMG").click(function(event) { event.preventDefault(); vme.insert("<img src=\"http://www.equatheque.net/image/EquaThEque.png\"/>"); }); 
		$("#btHTML_CENTER").click(function(event) { event.preventDefault(); vme.tag("<p style=\"text-align:center\">", "</p>"); }); 
		$("#btHTML_LEFT").click(function(event) { event.preventDefault(); vme.tag("<p style=\"text-align:left\">", "</p>"); }); 
		$("#btHTML_RIGHT").click(function(event) { event.preventDefault(); vme.tag("<p style=\"text-align:right\">", "</p>"); }); 
		$("#btHTML_JUSTIFY").click(function(event) { event.preventDefault(); vme.tag("<p style=\"text-align:justify\">", "</p>"); }); 
		$("#btHTML_INDENT").click(function(event) { event.preventDefault(); vme.tag("<p style=\"margin-left:40px;text-align:justify\">", "</p>"); }); 
		if (!vme.runNotColorPicker) { 
			$('#btHTML_TEXTCOLOR').ColorPicker({ 
				color: '#0000ff', 
				flat: false, 
				onShow: function(colpkr) { $(colpkr).fadeIn(500); return false; }, 
				onHide: function(colpkr) { $(colpkr).fadeOut(500); return false; }, 
				onChange: function(hsb, hex, rgb) { $('#btHTML_TEXTCOLOR').css('backgroundColor', '#' + hex); }, 
				onSubmit: function(hsb, hex, rgb, el) { 
					$(el).css('backgroundColor', '#' + hex); 
					$(el).ColorPickerHide(); 
					vme.tag("<span style=\"color:#" + hex + "\">", "</span>"); 
				} 
			}); 
			$('#btHTML_FORECOLOR').ColorPicker({ 
				color: '#0000ff', 
				flat: false, 
				onShow: function(colpkr) { $(colpkr).fadeIn(500); return false; }, 
				onHide: function(colpkr) { $(colpkr).fadeOut(500); return false; }, 
				onChange: function(hsb, hex, rgb) { $('#btHTML_FORECOLOR').css('backgroundColor', '#' + hex); }, 
				onSubmit: function(hsb, hex, rgb, el) { 
					$(el).css('backgroundColor', '#' + hex); 
					$(el).ColorPickerHide(); 
					vme.tag("<span style=\"background-color:#" + hex + "\">", "</span>"); 
				} 
			}); 
		}
	}
	
	/**
	 * @abstract Switches the Html mode into a given state.
	 * 
	 * @param toEnclose - target state
	 */
	switchHtmlMode(toEnclose) {
		
		let vme = this; 
		if (toEnclose) { 
			$("#encloseType").attr("checked", "checked"); 
			$("#btENCLOSE_TYPE").removeClass("unselect"); 
			$('#HTML_TAG').show(); 
			vme.codeMirrorEditor.setOption("mode", "text/html"); 
			vme.codeMirrorEditor.setOption("autoCloseTags", true); 
		} else { 
			$("#encloseType").removeAttr("checked"); 
			$("#btENCLOSE_TYPE").addClass("unselect"); 
			$('#HTML_TAG').hide(); 
			vme.codeMirrorEditor.setOption("mode", "text/x-latex"); 
			vme.codeMirrorEditor.setOption("autoCloseTags", false); 
		}
		$('#innerLayout').layout();
	}
	
	/**
	 * @abstract Wrapper around Localizer routine. Builds resources dialog.
	 */
	async initialiseLangRessourcesList() {
		await this.localizer.buildLocalResources();
	}
	
	/**
	 * @abstract Establishs an *autoUpdateType* mode, if active.
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
	 * @abstract Wrapper of the appropriate Math routine. Updates the math in the 
	 * 			 output window.
	 */
	updateOutput() {
		this.math.updateOutput();
	}

	/**
	 * @abstract Wrapper of the appropriate Math routine. Inserts a piece of 
	 * 			 math code into the editor and updates the output.
	 */	
	insert(b) {
		this.math.insert(b);
		this.setFocus();
	}
	
	/**
	 * @abstract OBSOLETE. NOT USED.
	 *	
	insertBeforeEachLine(b) { 
		this.encloseSelection("", "", function(a) { a = a.replace(/\r/g, ""); 
			return b + a.replace(/\n/g, "\n" + b) }) 
		}
	*/
	
	/**
	 * @abstract Plays a role in Html mode (obsolete).
	 */
	tag(b, a) {
		b = b || null; a = a || b; if (!b || !a) { return }
		this.codeMirrorEditor.replaceSelection(b + this.codeMirrorEditor.getSelection() + a); 
		let pos = this.codeMirrorEditor.getCursor(); 
		pos.ch = pos.ch - a.length; this.codeMirrorEditor.setCursor(pos); 
		if (this.menuupdateType) this.updateOutput(); 
		this.setFocus();
	}
	
	/**
	 * @abstract OBSOLETE. NOT USED.
	 *
	encloseSelection(f, j, h) {
		this.mathTextInput.focus(); 
		f = f || ""; 
		j = j || ""; 
		let a, d, c, b, i, g; 
		if (typeof (document.selection) != "undefined") { 
			c = document.selection.createRange().text 
		} else { 
			if (typeof (this.mathTextInput.setSelectionRange) != "undefined") { 
				a = this.mathTextInput.selectionStart; 
				d = this.mathTextInput.selectionEnd; 
				b = this.mathTextInput.scrollTop; 
				c = this.mathTextInput.value.substring(a, d) 
			} 
		}
		if (c.match(/ $/)) { 
			c = c.substring(0, c.length - 1); 
			j = j + " " 
		}
		if (typeof (h) == "function") { 
			g = (c) ? h.call(this, c) : h("") 
		} else { 
			g = (c) ? c : "" 
		}
		i = f + g + j; 
		if (typeof (document.selection) != "undefined") { 
			let e = document.selection.createRange().text = i; 
			this.mathTextInput.caretPos -= j.length; 
		} else {
			if (typeof (this.mathTextInput.setSelectionRange) != "undefined") {
				this.mathTextInput.value = this.mathTextInput.value.substring(0, a) + i + this.mathTextInput.value.substring(d); 
				if (c) { 
					this.mathTextInput.setSelectionRange(a + i.length, a + i.length); 
				} else {
					if (j != "") { 
						this.mathTextInput.setSelectionRange(a + f.length, a + f.length); 
					} else { 
						this.mathTextInput.setSelectionRange(a + i.length, a + i.length); 
					}
				}
				this.mathTextInput.scrollTop = b
			}
		}
		if (this.menuupdateType) this.updateOutput();
	}
	*/
	
	/**
	 * @abstract Menu command to open a file with formula.
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
	 * @abstract The initiated file open action, implemented by clicking onan anchor element.
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
	 * @abstract Saves the formula in Editor to a file.
	 */
	saveEquationFile() {
		let vme = this;
		let content = ""; 
		content = vme.codeMirrorEditor.getValue();
		
		let fileHandler = new FileHandler();
		fileHandler.saveFile(content, "application/x-download", "fSAVE_EQUATION"); 
	}
	
	/**
	 * @abstract The style chosen is set up for the UI.
	 */
	onStyleChanged(style, rtlStyle, colorType) {
		this.style = style;																// necessary to persist and delegate
		try {
			let colorImg = "black", codemirrorCSS = "default", colorpickerCSS = "gray"; 
			
			if (colorType == "black") {
				colorImg = "white"
				codemirrorCSS = "zenburn"; 
				colorpickerCSS = "black";
			}
			this.codeMirrorTheme = codemirrorCSS;
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
	 * @abstract Updates the RTL flag after the language resource is updated.
	 * 
	 * Evt transfer this functionality to Themes.
	 */	
	setRTLstyle() {
		let dir = this.getLocalText("_i18n_HTML_Dir");
		this.rtlStyle = dir;
		this.themes.setRTLstyle(dir);
	}
	
	/**
	 * @abstract Convert text to boolean. Only "true" is truthy.
	 */
	getBoolean(text) { return (text == "true"); }
	
	/**
	 * @abstract Decimal to hex conversion.
	 */
	d2h(d) { return d.toString(16).toUpperCase(); }
	
	/**
	 * @abstract Hex to decimal conversion.
	 */
	h2d(h) { return parseInt(h, 16); }
	
	/**
	 * @abstract Html-encodes string for attributes (quotes only).
	 */
	encodeStringForHTMLAttr(s) { 
		if (typeof s == "string") return s.replace("\"", "&quot;"); else return ""; 
	}
	
	/**
	 * @abstract Loads a script. Actually only used by virtual keyboard.
	 * WE HAVE other solution for this.
	 * 
	loadScript(url, callback) {
		let script = document.createElement("script"); 
		script.type = "text/javascript"; 
		script.src = url; 
		if (script.readyState) { 
			script.onreadystatechange = function() {
				 
				if (script.readyState == "loaded" || script.readyState == "complete") { 
					script.onreadystatechange = null; 
					callback(); 
				} 
			}; 
		} else { 
			script.onload = function() { callback(); }; 
		}
		document.body.appendChild(script);
	}
	*/
	
	/**
	 * @abstract Initializes an accordion (several palettes with symbols).
	 */
	initialiseUIaccordion(accordionID) {
		let vme = this; 
		$(accordionID).accordion({
			onSelect: function(title) {

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
		this.math.updateHeaders();
	}
	
	/**
	 * @abstract The routine equips the entries in the given panel with functionality.
	 * 
	 * This is:
	 * - tool tip
	 * - info line
	 * - click event
	 */
	async initialiseSymbolContent(fPanelID) { 
		let vme = this; 
		/**
		 * @abstract Given an anchor object, determines and returns the included
		 * 			 LATEX code used as info for tool tip and info line.
		 */
		function getSymbol(a) {
			let info: any = beginEndInfo(a);
			if (info !== null) return info[0] + info[1];
			info = latex(a);
			if (info !== null) return info;
			return vme.getLocalText("NO_LATEX"); 
		};
		
		/**
		 * @abstract Returns the begin to end info of an anchor.
		 */
		function beginEndInfo(a) {
			if (typeof ($(a).attr("lbegin")) != "undefined" && typeof ($(a).attr("lend")) != "undefined") 
				return [$(a).attr("lbegin"), $(a).attr("lend")];
			return null; 
		};
		
		/**
		 * @abstract Returns the latex info of an anchor.
		 */
		function latex(a) {
			if (typeof ($(a).attr("latex")) != "undefined")
				return $(a).attr("latex");
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
			$.messager.show({ 
				title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", 
				msg: vme.getLocalText("NO_LATEX") 
			}); 
		}); 
		
		// this is solely for a single ...more button linking to a dialog
		// containing more formulae.
		$(`#${fPanelID} a.more`)
		.addClass("easyui-tooltip")
		.attr("title", function(index, attr) { return "Loading more formulae"; });

		await vme.parser.parseAsync("#" + fPanelID); 
		await this.math.updateTables();
	}
	
	/**
	 * @abstract Updates a few dialogs with formulae.
	 * 
	 * The candidates here are:
	 * - the panels of the info dialog
	 * - the equation dialog
	 * - the special characters dialog
	 */
	async updateInfo() {
		let vme = this;
		$('div[href]')
		.each(function( idx ) {
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
					<tr><td> ${CodeMirror.version} </td><td>Code Mirror</td></tr>
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
	 * @abstract Sets the base location.
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

		$('html > head').append($('<base />'));
		$('html > head > base').attr('href', bundlePath);
		
		return bundlePath;
	}
	
	/**
	 * @abstract Adds a build number to the developer version.
	 */
	addBuild() {
		const heading = $('h3').text();
		const build = `build ${String(this.versions.build).padStart(4, '0')}`;
		const platform = `${this.mobile ? 'mobile' : 'desktop'}`;
		if (!PRODUCTION) {
			$('h3').text(`${heading} : ${build} on ${platform}`);
		}
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { KatexInputHelper };
} catch(e) { }

