
/**
 *	Vom Vorbild kopiert, nicht funktional
 *  
function initialScript() {
	var runLocal = (window.location.search.indexOf("runLocal", 0) > 0); 
	var runNotCodeMirror = (window.location.search.indexOf("runNotCodeMirror", 0) > 0); 
	var runNotMathJax = (window.location.search.indexOf("runNotMathJax", 0) > 0); 
	var runNotVirtualKeyboard = (window.location.search.indexOf("runNotVirtualKeyboard", 0) > 0); 
	var runNotColorPicker = (window.location.search.indexOf("runNotColorPicker", 0) > 0); 
	runLocal ? document.write("<script type=\"text\/javascript\" src=\"js\/jquery-plugin\/jquery.min.js\"><\/script>") : document.write("<script type=\"text\/javascript\" src=\"https:\/\/ajax.googleapis.com\/ajax\/libs\/jquery\/1.8.0\/jquery.min.js\"><\/script>"); document.write("<script type=\"text\/javascript\" src=\"js\/jquery-plugin\/jquery.url.js\"><\/script>"); document.write("<script type=\"text\/javascript\" src=\"js\/jquery-easyui\/jquery.easyui.min.js\"><\/script>"); if (!runNotColorPicker) {document.write("<link rel=\"stylesheet\" id=\"colorpickerCSSblack\" type=\"text\/css\" href=\"js\/jquery-colorpicker\/css\/colorpicker.css\" disabled=\"true\" >"); document.write("<link rel=\"stylesheet\" id=\"colorpickerCSSgray\" type=\"text\/css\" href=\"js\/jquery-colorpicker\/css\/colorpicker_gray.css\" disabled=\"true\" >"); document.write("<script type=\"text\/javascript\" src=\"js\/jquery-colorpicker\/js\/colorpicker.js\"><\/script>");}
	if (!runNotMathJax) {
		var vmeURL = window.location.protocol + "//" + window.location.host + window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1); 
		runLocal ? document.write("<script type=\"text\/javascript\" id=\"MathJaxScript\" src=\"js\/mathjax\/MathJax.js?config=" + vmeURL + "js\/mathjax-MathEditorExtend\/x-mathjax-config.js\"><\/script>") : document.write("<script type=\"text\/javascript\" id=\"MathJaxScript\" src=\"http:\/\/cdn.mathjax.org\/mathjax\/latest\/MathJax.js?config=" + vmeURL + "js\/mathjax-MathEditorExtend\/x-mathjax-config.js\"><\/script>");
	}
	var vmeRunParam = ""; 
	if (runLocal) vmeRunParam += "runLocal=true"; 
	if (runNotCodeMirror) {
		if (vmeRunParam.length > 0) vmeRunParam += "&"; 
		vmeRunParam += "runNotCodeMirror=true";
	}
	if (runNotMathJax) {
		if (vmeRunParam.length > 0) vmeRunParam += "&"; 
		vmeRunParam += "runNotMathJax=true";
	}
	if (runNotVirtualKeyboard) {
		if (vmeRunParam.length > 0) vmeRunParam += "&"; 
		vmeRunParam += "runNotVirtualKeyboard=true";
	}
	if (runNotColorPicker) {
		if (vmeRunParam.length > 0) vmeRunParam += "&"; 
		vmeRunParam += "runNotColorPicker=true";
	}
	if (vmeRunParam.length > 0) vmeRunParam = "?" + vmeRunParam; 
	document.write("<script type=\"text\/javascript\" id=\"vmeScript\" src=\"js\/VisualMathEditor.js" + vmeRunParam + "\"><\/script>"); if (!runNotCodeMirror) {document.write("<link rel=\"stylesheet\" type=\"text\/css\" href=\"js\/codemirror\/lib\/codemirror.css\">"); document.write("<link rel=\"stylesheet\" type=\"text\/css\" href=\"js\/codemirror\/theme\/twilight.css\">"); document.write("<script src=\"js\/codemirror\/lib\/codemirror.js\"><\/script>");}
	if (!runNotVirtualKeyboard) {
		document.write("<link rel=\"stylesheet\" type=\"text\/css\" href=\"js\/keyboard\/keyboard.css\">");
	}	
}
 */

/**
 *	Former initial script invocation, no longer used.
 *  
	this.url = $.url(true);
	this.runLocal = eval($.url(document.getElementById("vmeScript").src).param('runLocal'));
	this.runNotCodeMirror = eval($.url(document.getElementById("vmeScript").src).param('runNotCodeMirror'));
	this.runNotMathJax = eval($.url(document.getElementById("vmeScript").src).param('runNotMathJax')); 
	this.runNotVirtualKeyboard = eval($.url(document.getElementById("vmeScript").src).param('runNotVirtualKeyboard')); 
	this.runNotColorPicker = eval($.url(document.getElementById("vmeScript").src).param('runNotColorPicker')); 
*/


var console; 
if (window.console) console = window.console; else console = { log: function(msg) { }, error: function(msg) { } }; 

class KatexInputHelper {

	version = "1.0.0"; 
	codeType = 'Latex'; 
	encloseAllFormula = false; 
	saveOptionInCookies = false; 
	autoUpdateTime = 500; 
	menuupdateType = true; 
	autoupdateType = true; 
	menuMathjaxType = false; 
	isBuild = false; 
	windowIsOpenning = false; 
	textareaIgnore = false; 
	textareaID = null; 
	textAreaForSaveASCII = null; 
	codeMirrorEditor = null; 
	symbolPanelsLoaded = []; 
	asciiMathCodesListLoaded = false; 
	latexMathjaxCodesListLoaded = false; 
	uniCodesListLoaded = false; 
	autoUpdateOutputTimeout = null; 
	notAllowedKeys = [9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 91, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145]; 
	allowedCtrlKeys = [86, 88, 89, 90]
	notAllowedCtrlKeys = []; 
	notAllowedAltKeys = []; 
	runNotColorPicker = false;

	runNotMathJax = true;
	runNotCodeMirror = false;

	location = "";
	localizer = null;
	themes = null;
	math = null;
	parameters = null;
	
	/**
	 * Constructor
	 */
	constructor() {
		window.vme = this;
		var vme = this;
	
		// independant of plugin variant
		this.location = getScriptLocation();
		
		// Probably not needed
		console.info(`Url: ${window.location}`);
		var adr = "https://visualmatheditor.equatheque.net/VisualMathEditor.html?runLocal&codeType=Latex&encloseAllFormula=false&style=default&localType=en_US&equation=\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}";
		var pars = "?runLocal&codeType=Latex&encloseAllFormula=false&style=default&localType=en_US&equation=\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}";
		
		this.url = {
			param: function(name) {
				var params = {
					runLocal: true,
					codeType: "Latex",
					encloseAllFormula: false,
					
					style: "aguas",
					localType: "en_US",
					equation: "\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}"				
				};
				try {
					return vme.parameters[name];				
				} catch(e) {
					console.warn(`Url Access could not resolve name: ${name}`);
					return params[name];
				}
			}
		};
		
		this.parameters = new Parameters();
		this.localizer = new Localizer();
		this.themes = new Themes();
		this.parser = new ParserExtension(true);
		this.math = new MathFormulae(false, this.localizer, null, this.parameters, this.parser);	// code mirror per method injection

		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput'); 
		
		for (var i = 65; i <= 90; i++) if ($.inArray(i, this.allowedCtrlKeys) == -1) this.notAllowedCtrlKeys.push(i); 
		for (var i = 65; i < 90; i++) this.notAllowedAltKeys.push(i); 
	}

	get localType() {
		return this.parameters.localType;
	}
	set localType(value) {
		this.parameters.localType = value;
		this.parameters.writeParameters();
	}

	get style() {
		return this.parameters.style;
	}
	set style(value) {
		this.parameters.style = value;
		this.parameters.writeParameters();
	}


	/**
	 * initialize. Performs the whole initialization. Part of it is invoked after Local Type initialisation
	 * by a calback.
	 */
	async initialise() { 
		var vme = this; 
		$.messager.progress({ 
			title: "VisualMathEditor", 
			text: vme.getLocalText("WAIT_FOR_EDITOR_DOWNLOAD"), 
			msg: "<center>&copy; <a href='mailto:contact@equatheque.com?subject=VisualMathEditor' target='_blank' class='bt' >David Grima</a> - <a href='http://www.equatheque.net' target='_blank' class='bt' >EquaThEque</a><br/><br/></center>", 
			interval: 300 
		}); 
		$('#form').hide();

		this.parser.initialise();		
		await this.parameters.queryParameters();
		await this.initialiseLocalType();
		vme.themes.appendCss(this.style);
		await vme.updateInfo();
		await vme.initialiseUI(); 
		vme.initialiseParameters(); 
		vme.initialiseCodeMirror(); 
		vme.initialiseStyle(); 
		await vme.initialiseLanguage();
		vme.localType = vme.url.param('localType');
		vme.initialiseCodeType(); 
		vme.initialiseVirtualKeyboard(); 
		vme.endWait(); 
		vme.isBuild = true;
	}
	
	endWait() { 
		this.initialiseEquation(); 
		this.switchMathJaxMenu(); 
		$.messager.progress('close'); 
		$("#WaitMsg").hide(); 
		this.setFocus(); 
	}
	
	setFocus() { 
		if (this.codeMirrorEditor) this.codeMirrorEditor.focus(); 
		$("#mathTextInput").focus(); 
	}
	
	setCodeMirrorCursorAtEnd() { 
		var pos = { 
			line: this.codeMirrorEditor.lastLine(), 
			ch: this.codeMirrorEditor.getValue().length 
		}; 
		this.codeMirrorEditor.setCursor(pos); 
	}
	
	initialiseMathJax() {
		var vme = this; 
		MathJax.Hub.Queue(function() {
			vme.endWait()
			setTimeout(function() { MathJax.Hub.Queue(["Typeset", MathJax.Hub]); }, 1000);
		});
	}
	
	initialiseVirtualKeyboard() { 
		if (!this.runNotVirtualKeyboard) this.loadScript(`${this.location}keyboard/keyboard.js`, function() { return true; }); 
	}
	
	initialiseCodeMirror() { 
		var vme = this; 
		vme.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("mathTextInput"), { 
			mode: vme.encloseAllFormula ? "text/html" : "text/x-latex", 
			autofocus: true, 
			showCursorWhenSelecting: true, 
			styleActiveLine: true, 
			lineNumbers: true, 
			lineWrapping: true, 
			matchBrackets: true, 
			autoCloseBrackets: true, 
			autoCloseTags: vme.encloseAllFormula ? true : false, 
			tabMode: "indent", 
			tabSize: 4, 
			indentUnit: 4, 
			indentWithTabs: true, 
			theme: "default"
		}); 
		vme.codeMirrorEditor.on("change", function() { vme.autoUpdateOutput(); }); 
		$(".CodeMirror").bind('contextmenu', function(event) { 
			event.preventDefault(); 
			$('#mINSERT').menu('show', { left: event.pageX, top: event.pageY }); 
			return false; 
		}); 
		
		this.math.setEditorInstance(this.codeMirrorEditor);
	}
	
	/**
	 * Initializes the User Interface.
	 */
	async initialiseUI() {
		var vme = this;
		this.math.updateLatexMenu();
		$("a.easyui-linkbutton").linkbutton({ plain: true }); 
		$(document).bind('contextmenu', function(event) { event.preventDefault(); return false; }); 
		$("#mFILE, #mINSERT, #mTOOLS, #mVIEW, #mOPTIONS, #mINFORMATIONS").menu({
			onClick: async function(item) {
				switch (item.target.id) {
					case "mEDITOR_PARAMETERS": await vme.openWindow('wEDITOR_PARAMETERS'); break; 
					case "mSTYLE_CHOISE": await vme.openWindow('wSTYLE_CHOISE'); break; 
					case "mLANGUAGE_CHOISE": await vme.openWindow('wLANGUAGE_CHOISE'); break; 
					case "mMATRIX": vme.showMatrixWindow(3, 3); break; 
					case "mCOMMUTATIVE_DIAGRAM": await vme.initialiseUImoreDialogs("f_COMMUTATIVE_DIAGRAM"); break; 
					case "mCHEMICAL_FORMULAE": await vme.initialiseUImoreDialogs("f_CHEMICAL_FORMULAE"); break; 
					case "mNEW_EDITOR": vme.newEditor(); break; 
					case "mQUIT_EDITOR": vme.closeEditor(); break; 
					case "mSAVE_EQUATION": vme.saveEquationFile(); break; 
					case "mOPEN_EQUATION": vme.testOpenFile(); break; 
					case "mUPDATE_EQUATION": vme.getEquationFromCaller(); break; 
					case "mSET_EQUATION": vme.setEquationInCaller(); break; 
					case "mLaTeX_TEXT": vme.insert("\\LaTeX"); break; 
					case "mMATH_ML": vme.viewMathML(vme.mathVisualOutput.id); break; 
					case "mUNICODES_LIST": await vme.openWindow('wUNICODES_LIST'); await vme.initialiseUniCodesList(); break; 
					case "mLATEX_CODES_LIST": await vme.openWindow('wLATEX_CODES_LIST'); await vme.initialiseLatexMathjaxCodesList(); break; 
					case "mLANG_RESSOURCE_LIST": await vme.openWindow('wLANGUAGE_LIST'); vme.initialiseLangRessourcesList(); break; 
					case "mLATEX_DOCUMENTATION": var file = (vme.runLocal ? `${this.location}../doc/` : "http://www.tex.ac.uk/tex-archive/info/symbols/comprehensive/") + "symbols-a4.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wLATEX_DOCUMENTATION', 'yes', 'yes', 'no', 'no'); break; 
					case "mMHCHEM_DOCUMENTATION": var file = (vme.runLocal ? `${this.location}../doc/` : "http://www.ctan.org/tex-archive/macros/latex/contrib/mhchem/") + "mhchem.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wMHCHEM_DOCUMENTATION', 'yes', 'yes', 'no', 'no'); break; 
					case "mAMSCD_DOCUMENTATION": var file = (vme.runLocal ? `${this.location}../doc/` : "http://www.jmilne.org/not/") + "Mamscd.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wAMSCD_DOCUMENTATION', 'yes', 'yes', 'no', 'no'); break; 
					case "mMATH_ML_SPECIFICATIONS": var file = (vme.runLocal ? `${this.location}../doc/` : "http://www.w3.org/TR/MathML/") + "mathml.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wMATH_ML_SPECIFICATIONS', 'yes', 'yes', 'no', 'no'); break; 
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
					case "mCUSTOM_EQUATIONS": 
						await vme.math.initialiseDynamicPanel("f_CUSTOM_EQUATIONS"); 
						break;
					case "mHORIZONTAL_SPACING": await vme.initialiseUImoreDialogs("f_HORIZONTAL_SPACING"); break; 
					case "mVERTICAL_SPACING": await vme.initialiseUImoreDialogs("f_VERTICAL_SPACING"); break; 
					case "mSPECIAL_CHARACTER": await vme.initialiseUImoreDialogs("f_SPECIAL_CHARACTER"); break; 
					case "mHTML_MODE": $("#btENCLOSE_TYPE").click(); break; 
					case "mKEYBOARD": if (!vme.runNotVirtualKeyboard) { VKI_show(document.getElementById("tKEYBOARD")); $("#keyboardInputMaster").draggable({ handle: '#keyboardTitle' }); } break; 
					default: $.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: item.text }); break;
				}
			}
		}); 
		if (!window.opener) { 
			$("#mQUIT_EDITOR").addClass("menu-item-disabled").click(function(event) { vme.closeEditor(); }); 
		}
		if (typeof (FileReader) == "undefined") { 
			$("#mOPEN_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.testOpenFile(); }); 
		}
		$("#fOPEN_EQUATION").change(function(event) { vme.openFile(event); }); 
		this.initialiseUIaccordion("#f_SYMBOLS"); 
		this.initialiseUIaccordion("#f_SYMBOLS2"); 
		
		$('#tINFORMATIONS').tabs({
			onLoad: async function(panel) {
				switch (panel.attr("id")) { 
					case "tCOPYRIGHT": 
						$("#VMEdate").html((new Date()).getFullYear()); 
						break; 
					case "tVERSION": 
						$("#VMEversion").html("<table>" + "<tr><td><b>" + vme.version + "</b></td><td><b>Visual Math Editor</b>, (This software)</td></tr>" + (vme.runNotMathJax ? "" : ("<tr><td>" + MathJax.version + " </td><td>Math Jax</td></tr>")) + (("<tr><td>" + CodeMirror.version + " </td><td>Code Mirror</td></tr>")) + (vme.runNotVirtualKeyboard ? "" : ("<tr><td>" + VKI_version + " </td><td>Virtual Keyboard</td></tr>")) + "<tr><td>" + $.fn.jquery + " </td><td>Jquery</td></tr>" + "<tr><td>" + "1.3.3" + " </td><td>Jquery Easyui</td></tr>" + (vme.runNotColorPicker ? "" : ("<tr><td>" + "23/05/2009" + " </td><td>Jquery Color Picker</td></tr>")) + "<table>"); 
						break; 
					case "tEQUATION": 
						await vme.initialiseSymbolContent(panel.attr("id")); 
						break; 
				}
			}
		}); 
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
		$("input[name='localType']").change(async function() { 
			vme.localType = $("input[name='localType']:checked").val(); 
			await vme.localize(); 
			vme.printCodeType(); 
		}); 
		$("input[name='codeType']").change(function() { 
			vme.codeType = $("input[name='codeType']:checked").val(); 
			vme.printCodeType(); 
			vme.updateOutput(); 
		}); 
		$("input[name='style']").change(function() { 
			vme.style = $("input[name='style']:checked").val(); 
			vme.chooseStyle(); 
		}); 
		$("#encloseType").change(function() {
			if (!(typeof ($('#encloseType').attr('checked')) == "undefined")) { 
				vme.encloseAllFormula = true; 
				$("#btENCLOSE_TYPE").removeClass("unselect"); 
				$('#HTML_TAG').show(); 
				vme.codeMirrorEditor.setOption("mode", "text/html"); 
				vme.codeMirrorEditor.setOption("autoCloseTags", true); 
			} else { 
				vme.encloseAllFormula = false; 
				$("#btENCLOSE_TYPE").addClass("unselect"); 
				$('#HTML_TAG').hide(); 
				vme.codeMirrorEditor.setOption("mode", "text/x-latex"); 
				vme.codeMirrorEditor.setOption("autoCloseTags", false); 
			}
			vme.updateOutput(); 
		}); 
		$("#autoUpdateTime").change(function() { 
			vme.autoUpdateTime = $("#autoUpdateTime").val(); 
		}); 
		$("#menuupdateType").change(function() { 
			(typeof ($('#menuupdateType').attr('checked')) == "undefined") ? vme.menuupdateType = false : vme.menuupdateType = true; 
		}); 
		$("#autoupdateType").change(function() { 
			(typeof ($('#autoupdateType').attr('checked')) == "undefined") ? vme.autoupdateType = false : vme.autoupdateType = true; 
		}); 
		$("#menuMathjaxType").change(function() { 
			vme.switchMathJaxMenu(); 
		}); 
		$("#cookieType").change(function() { 
		}); 
		$(window).resize(function() {
			/// TODO : any functionality, fit property used 
		}); 
		$("#mathVisualOutput").bind('contextmenu', function(event) { 
			event.preventDefault(); 
			$('#mVIEW').menu('show', { left: event.pageX, top: event.pageY }); 
			return false; 
		}); 
		$("[information]").mouseover(function(event) { 
			$("#divInformation").html(vme.getLocalText($(this).attr("information"))); 
		}); 
		$("[information]").mouseout(function(event) { 
			$("#divInformation").html("&nbsp;"); 
		}); 
		$('#unicodeChoise').combobox({ 
			valueField: 'value', 
			textField: 'text', 
			onSelect: async function(record) { var range = record.value.split(","); await vme.setUniCodesValues(vme.h2d(range[0]), vme.h2d(range[1])); }, 
			onLoadSuccess: async function() { $(this).combobox("select", "0x25A0,0x25FF"); await vme.setUniCodesValues(0x25A0, 0x25FF); } 
		});
	}
	
	/**
	 * Activates information tabs on the information dialog.
	 */
	async openInformationTab(numTab) { 
		await this.openWindow('wINFORMATIONS');
		$('#tINFORMATIONS').tabs('select', numTab); 
	}
	
	async initialiseUImoreDialogs(fPanelID) {
		var vme = this;
		var fPanelMoreID = 'w' + fPanelID + '_MORE';
		var fPanelMore = $('#' + fPanelMoreID); 
		if (vme.symbolPanelsLoaded.indexOf(fPanelMoreID) == -1) { 
			vme.symbolPanelsLoaded[vme.symbolPanelsLoaded.length] = fPanelMoreID; 
			$(fPanelMore).dialog({ 
				onLoad: 
					async function() { await vme.initialiseSymbolContent(fPanelMoreID); }, 
				title: $("#" + fPanelMoreID + "_TITLE").html() 
			}); 
			await vme.registerEvents(fPanelMoreID);
			$(fPanelMore).dialog('open'); 
			$(fPanelMore).dialog('refresh', `${vme.location}../formulas/` + fPanelID + "_MORE.html");
		} else { 
			$(fPanelMore).dialog('open'); 
		}
	}
	
	/**
	 * @abstract Registers events for a window and opens it.
	 * 
	 * This whole effort is done to get the window position and size persisted.
	 */
	async openWindow(id) {
		var inst = this;
		await this.registerEvents(id, false);
		$(`#${id}`).window('open');
	}
	
	/**
	 * This method registers 2 events for the MORE dialogs and intentionally also for 2 additional
	 * dialogs. 
	 */
	async registerEvents(id, isPanel = true) {
		var inst = this;
		var handlers = {
			onMove: 
				function(left, top) { 
					console.info(`Panel with id ${id} moved : ${left},${top}`);
					inst.parameters.onPanelMove(id, left, top);
				}, 
			onResize:
				function(width, height) {
					console.info(`Panel with id ${id} resized : ${width},${height}`);
					inst.parameters.onPanelResize(id, width, height);
				}
		};
		if (isPanel) {
			$(`#${id}`).dialog(handlers);
		} else {
			var title = this.localizeOption(id, 'title');								// do something to preserve the TITLE
			console.info(`Assigning window event handler for id : ${id}, title: ${title}`);
			handlers.title = title;
			$(`#${id}`).window(handlers);
		}
	}

	/**
	 * Used to localize an option.
	 */	
	localizeOption(id, option) {
		var text = $(`#${id}`).window('options')[option];								// do something to preserve the TITLE: this is a option
		var html = $.parseHTML(text);													// parse it into html object
		var key = $(html).attr('locate');												// extract the locate attribute
		var located = this.getLocalText(key);											// use it to get localized text
		html = $(html).html(located)[0].outerHTML;										// insert it into orginal html
		return html;
	}
	
	printCodeType() { 
		$("[name='codeType']").filter("[value=" + this.codeType + "]").attr("checked", "checked"); 
		$("#title_Edition_Current_Syntax").text(this.codeType); 
		$("#title_Edition_Other_Syntax").text((this.codeType == "AsciiMath") ? "Latex" : "AsciiMath"); 
	}
	
	initialiseCodeType() {
		var param = this.url.param('codeType'); 
		if (param && typeof (param) != "undefined") { 
			this.codeType = param; 
		}
		this.printCodeType();
	}
	
	initialiseStyle() {
		var param = this.url.param('style'); 
		if (param && typeof (param) != "undefined") { 
			this.style = param; 
		}
		$("[name='style']").filter("[value=" + this.style + "]").attr("checked", "checked"); 
		this.chooseStyle();
	}
	
	async initialiseLocalType() {
		var param = this.url.param('localType'); 
		if (param && typeof (param) != "undefined") { 
			this.localType = param; 
		} 

		await this.localizer.load(this.localType);
		var html = await this.localizer.buildLocalTypes();
		$("#formLANGUAGE_CHOISE").html(html);
	}
	
	async initialiseLanguage() { 
		$("[name='localType']").filter("[value=" + this.localType + "]").attr("checked", "checked"); 
		await this.localizeIt(); 
	}
	
	initialiseEquation() {
		var param = this.url.param('equation'); 
		param = this.parameters.equation;
		if (param && typeof (param) != "undefined") {
			this.codeMirrorEditor.setValue(param); 
			this.setCodeMirrorCursorAtEnd(); 
			this.updateOutput();
		} else { 
			this.getEquationFromCaller(); 
		}
		if (!this.textAreaForSaveASCII) { 
			$("#mUPDATE_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.getEquationFromCaller(); }); 
			$("#mSET_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.setEquationInCaller(); }); }
	}
	
	initialiseParameters() {
		var param = null; 
		var param = this.url.param('encloseAllFormula'); 
		if (param && typeof (param) != "undefined") { 
			this.encloseAllFormula = this.getBoolean(param); 
		} 
		this.encloseAllFormula ? $("#encloseType").attr("checked", "checked") : $("#btENCLOSE_TYPE").addClass("unselect"); 
		var param = this.url.param('autoUpdateTime'); 
		if (param && typeof (param) != "undefined") { 
			this.autoUpdateTime = param; 
		}
		if (this.autoUpdateTime) $("#autoUpdateTime").val(this.autoUpdateTime); 
		var param = this.url.param('menuupdateType'); 
		if (param && typeof (param) != "undefined") { 
			this.menuupdateType = this.getBoolean(param); 
		}
		if (this.menuupdateType) $("#menuupdateType").attr("checked", "checked"); 
		var param = this.url.param('autoupdateType'); 
		if (param && typeof (param) != "undefined") { 
			this.autoupdateType = this.getBoolean(param); 
		}
		if (this.autoupdateType) $("#autoupdateType").attr("checked", "checked"); 
		var param = this.url.param('menuMathjaxType'); 
		if (param && typeof (param) != "undefined") { 
			this.menuMathjaxType = this.getBoolean(param); 
		} 
		if (this.menuMathjaxType) $("#menuMathjaxType").attr("checked", "checked"); 
		this.switchMathJaxMenu();
	}
	
	switchMathJaxMenu() { 
		if (typeof ($('#menuMathjaxType').attr('checked')) == "undefined") { 
			this.menuMathjaxType = false; 
		} else { 
			this.menuMathjaxType = true; 
		} 
	}
	
	async initialiseLatexMathjaxCodesList() {
		if (!this.latexMathjaxCodesListLoaded) {
			function listNames(obj, prefix) {
				var html = ""; 
				for (var i in obj) { 
					if (obj[i] != 'Space') html += ('<tr><td dir="ltr"><a href="#" class="s" latex="' + prefix + i + '">' + prefix + i + '</a></td><td></td></tr>'); 
				}
				return html;
			}
			function listNamesValues(obj, prefix) {
				var html = ""; 
				var hexa = 0; 
				var output = ""; 
				for (var i in obj) { 
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
					var keys = [], k; 
					for (k in obj) { 
						if (Object.prototype.hasOwnProperty.call(obj, k)) { keys.push(k); } 
					}
					return keys;
				};
			}
			var special = {}; 
			var remap = {}; 
			var mathchar0mi = {}; 
			var mathchar0mo = {}; 
			var mathchar7 = {}; 
			var delimiter = {}; 
			var macros = {}; 
			var environment = {}; 
			var length = (Object.keys(special).length + Object.keys(remap).length + Object.keys(mathchar0mi).length + Object.keys(mathchar0mo).length + Object.keys(mathchar7).length + Object.keys(delimiter).length + Object.keys(macros).length + Object.keys(environment).length); var html = ("<table border='1' cellspacing='0' style='margin-left:20px;border-spacing:0px;border-collapse:collapse;'><caption>" + length + " <span locate='MATHJAX_LATEX_SYMBOLS'>" + this.getLocalText("MATHJAX_LATEX_SYMBOLS") + "</span></caption>"); html += ("\n<tr><th><span locate='MATHJAX_LATEX_INPUT'>" + this.getLocalText("MATHJAX_LATEX_INPUT") + "</span></th><th><span locate='OUTPUT'>" + this.getLocalText("OUTPUT") + "</span></th></tr>"); 
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
	
	async initialiseUniCodesList() {
		if (!this.uniCodesListLoaded) {
			var html = "<table><caption>[0x0000,0xFFFF]</caption>"; 
			for (var i = 0; i <= 650; i = i + 10) {
				html += "\n<tr>"; 
				for (var j = i; j < i + 10; j++) { 
					if (j > 655) break; 
					html += "<td><a style='border:1px solid #f0f0f0;' class='s' href='#' onclick='async vme.selectUniCodesValues(" + ((j * 100) + 1) + "," + ((j + 1) * 100) + ");return false;'>" + (i < 10 ? "00" : (i < 100 ? "0" : "")) + j + "</a></td>"; 
				}
				html += "</tr>";
			}
			html = html + "\n</table>"; 
			$("#cUNICODES_LIST").html(html); 
			this.uniCodesListLoaded = true; 
			$('#unicodeChoise').combobox("reload", `${vme.location}../formulas/unicodeChoiseData.json`);
		}
	}
	
	async selectUniCodesValues(i1, i2) { 
		$('#unicodeChoise').combobox("select", ""); await this.setUniCodesValues(i1, i2, true); 
	}
	
	async setUniCodesValues(i1, i2, breakFFFF) {
		var html = ("<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;'>"); 
		html += ("\n<tr><th><span locate='UNICODES_INPUT'>" + this.getLocalText("UNICODES_INPUT") + "</span></th><th>HEXA</th><th><span locate='OUTPUT'>" + this.getLocalText("OUTPUT") + "</span></th></tr>"); 
		for (var i = i1; i <= i2; i++) { 
			if (breakFFFF & i > 65535) break; 
			html += ("\n<tr><td>" + i + "<td style='text-align:center;'>" + this.d2h(i) + "</td><td style='font-size:150%;text-align:center;'><a href='#' class='s' latex='\\unicode{" + i + "} '>&#" + i + ";</a></td></tr>"); 
		}
		html = html + "\n</table>"; 
		$("#cUNICODES_VALUES").html(html); 
		$("#cUNICODES_VALUES").scrollTop(0); 
		await this.initialiseSymbolContent("cUNICODES_VALUES");
	}
	
	showMatrixWindow(rows, cols) { 
		this.openWindow('wMATRIX'); 
		this.updateMatrixWindow(rows, cols); 
	}
	
	updateMatrixWindow(rows, cols) {
		if (typeof (rows != "undefined") && rows != null) document.formMATRIX.rowsMATRIX.value = rows; 
		if (typeof (cols != "undefined") && cols != null) document.formMATRIX.colsMATRIX.value = cols; 
		rows = document.formMATRIX.rowsMATRIX.value; 
		cols = document.formMATRIX.colsMATRIX.value; 
		var html = '<table style="border-spacing:0px; border-collapse:collapse;">'; 
		var r, c, value; for (r = 1; r <= rows; r++) {
			html += "<tr>"; 
			for (c = 1; c <= cols; c++) {
				value = ("a_{" + r + c + "}");
				html = html + "<td><input type='text' size='5' name='a_" + r + c + "' value='" + value + "'/></td>";
			}
			html += "</tr>";
		}
		html += "</table>"; 
		$("#showMATRIX").html(html); 
		$('#wMATRIX').dialog('open'); 
		var width = 20 + $("#tableMATRIX").width(); 
		var height = 80 + $("#tableMATRIX").height(); 
		if (width < 240) width = 240; 
		if (height < 160) height = 160; 
		$('#wMATRIX').dialog({ title: vme.getLocalText("MATRIX"), width: width, height: height }); 
		$('#wMATRIX').dialog('open');
	}
	
	setLatexMatrixInEditor() {
		var vme = this; 
		var cols = document.formMATRIX.colsMATRIX.value; 
		var rows = document.formMATRIX.rowsMATRIX.value; 
		var formula = ""; 
		var r, c; 
		for (r = 1; r <= rows; r++) {
			for (c = 1; c <= cols; c++) { 
				eval("formula = formula + document.formMATRIX.a_" + r + c + ".value"); 
				if (c < cols) formula += " & "; 
			}
			if (r < rows) formula += " \\\\ ";
		}
		var left = document.formMATRIX.leftbracketMATRIX.value; 
		var right = document.formMATRIX.rightbracketMATRIX.value; 
		var matrix = ""; 
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
	
	setAsciiMatrixInEditor() {
		var vme = this; 
		var cols = document.formMATRIX.colsMATRIX.value; 
		var rows = document.formMATRIX.rowsMATRIX.value; 
		var formula = ""; 
		var r, c; for (r = 1; r <= rows; r++) {
			if (rows > 1) formula += "("; 
			for (c = 1; c <= cols; c++) { 
				eval("formula = formula + document.formMATRIX.a_" + r + c + ".value"); 
				if (rows == 1 && c < cols) formula += " "; 
				if (rows > 1 && c < cols) formula += ","; 
			}
			if (rows > 1) formula += ")"; if (rows > 1 && r < rows) formula += ",";
		}
		var left = document.formMATRIX.leftbracketMATRIX.value; 
		var right = document.formMATRIX.rightbracketMATRIX.value; 
		var matrix = ""; 
		if (left == "}" || left == "]" || left == ")" || left == ":)") matrix += "{: ";
		matrix += left; 
		if (left == "{" || left == "}" || left == "]" || left == ")" || left == ":)") matrix += "{:";
		matrix += formula; 
		if (right == "}" || right == "{" || right == "[" || right == "(" || right == "(:") matrix += ":}";
		matrix += right; 
		if (right == "{" || right == "[" || right == "(" || right == "(:") matrix += " :}";
		matrix += " "; 
		vme.insert(matrix);
	}
	
	getLocalText(TEXT_CODE) { 
		try { 
			return this.localizer.getLocalText(TEXT_CODE);
		} catch (e) { return ""; } 
	}
	
	async localize() {
		console.log(`Entry into localize, localType is: ${this.localType}`);
		var inst = this;
		await this.localizer.load(this.localType);
		await inst.initialiseLanguage();
	}
	
	async localizeIt() {
		console.log(`Entry into localizeIt, localType is: ${this.localType}`);
		var vme = this; 
		
		$("html").attr("xml:lang", vme.getLocalText("_i18n_HTML_Lang")); 
		$("html").attr("lang", vme.getLocalText("_i18n_HTML_Lang")); 
		$("html").attr("dir", vme.getLocalText("_i18n_HTML_Dir")); 
		vme.setRTLstyle(); 
		$("span[locate]").each(
			function() { 
				if (typeof ($(this).attr("locate")) != "undefined") { 
					var localText = vme.getLocalText($(this).attr("locate")); 
					if (typeof (localText) != "undefined") $(this).html(localText); 
				} 
			}); 
		$("#btTITLE_EDITION_SYNTAX").click(function(event) { 
			event.preventDefault(); 
			vme.setFocus(); 
		}); 
		vme.switchHtmlMode(vme.encloseAllFormula);
		$("#btENCLOSE_TYPE").click(function(event) {
			event.preventDefault(); 
			/*
			vme.encloseAllFormula = !vme.encloseAllFormula; 
			vme.switchHtmlMode(vme.encloseAllFormula);
			vme.updateOutput();
			*/ 
			vme.setFocus(); 
		}); 
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
		$("#btHTML_INDENT").click(function(event) { event.preventDefault(); vme.tag("<p style=\"margin-left:40px;text-align:justify\">", "</p>"); }); if (!vme.runNotColorPicker) { $('#btHTML_TEXTCOLOR').ColorPicker({ color: '#0000ff', flat: false, onShow: function(colpkr) { $(colpkr).fadeIn(500); return false; }, onHide: function(colpkr) { $(colpkr).fadeOut(500); return false; }, onChange: function(hsb, hex, rgb) { $('#btHTML_TEXTCOLOR').css('backgroundColor', '#' + hex); }, onSubmit: function(hsb, hex, rgb, el) { $(el).css('backgroundColor', '#' + hex); $(el).ColorPickerHide(); vme.tag("<span style=\"color:#" + hex + "\">", "</span>"); } }); $('#btHTML_FORECOLOR').ColorPicker({ color: '#0000ff', flat: false, onShow: function(colpkr) { $(colpkr).fadeIn(500); return false; }, onHide: function(colpkr) { $(colpkr).fadeOut(500); return false; }, onChange: function(hsb, hex, rgb) { $('#btHTML_FORECOLOR').css('backgroundColor', '#' + hex); }, onSubmit: function(hsb, hex, rgb, el) { $(el).css('backgroundColor', '#' + hex); $(el).ColorPickerHide(); vme.tag("<span style=\"background-color:#" + hex + "\">", "</span>"); } }); }
		$("#btCOPYRIGHT").click(async function(event) { event.preventDefault(); await vme.openInformationTab(0); vme.setFocus(); }); $("#VMEversionInf").html(vme.version);
	}
	
	/**
	 * Switches the Html mode into a given state.
	 */
	switchHtmlMode(toEnclose) {
		// $("#btENCLOSE_TYPE").linkbutton('disable');
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
	
	async initialiseLangRessourcesList() {
		await this.localizer.buildLocalResources(() => {});
	}
	
	autoUpdateOutput() {
		var vme = this; 
		if (typeof (vme.autoUpdateOutputTimeout) != "undefined" && vme.autoUpdateOutputTimeout != null) { 
			clearTimeout(vme.autoUpdateOutputTimeout); 
			delete vme.autoUpdateOutputTimeout; 
		}
		if (vme.autoupdateType) vme.autoUpdateOutputTimeout = setTimeout("vme.updateOutput();", vme.autoUpdateTime);
	}
	
	updateOutput() {
		this.math.updateOutput(); 
	}
	
	insert(b) {
		// this.codeMirrorEditor.replaceSelection(b); 
		// this.codeMirrorEditor.setCursor(this.codeMirrorEditor.getCursor()); 
		this.math.insert(b);
		if (this.menuupdateType) this.updateOutput(); 
		this.setFocus();
	}
	
	insertBeforeEachLine(b) { 
		this.encloseSelection("", "", function(a) { a = a.replace(/\r/g, ""); 
			return b + a.replace(/\n/g, "\n" + b) }) 
		}
	
	tag(b, a) {
		b = b || null; a = a || b; if (!b || !a) { return }
		this.codeMirrorEditor.replaceSelection(b + this.codeMirrorEditor.getSelection() + a); 
		var pos = this.codeMirrorEditor.getCursor(); 
		pos.ch = pos.ch - a.length; this.codeMirrorEditor.setCursor(pos); 
		if (this.menuupdateType) this.updateOutput(); 
		this.setFocus();
	}
	
	encloseSelection(f, j, h) {
		this.mathTextInput.focus(); 
		f = f || ""; 
		j = j || ""; 
		var a, d, c, b, i, g; 
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
			var e = document.selection.createRange().text = i; 
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
	
	showWindow(file, width, height, top, left, name, scrollbars, resizable, toolbar, menubar) { 
		if (!this.windowIsOpenning) {
			 this.windowIsOpenning = true; 
			 if (!name) name = ''; 
			 if (!scrollbars) scrollbars = 'no'; 
			 if (!resizable) resizable = 'no'; 
			 if (!toolbar) toolbar = 'no'; 
			 if (!menubar) menubar = 'no'; 
			 var win = window.open(file, name, "height=" + height + ",width=" + width + "top=" + top + ",left=" + left + ",status=yes,toolbar=" + toolbar + ",menubar" + menubar + ",location=no,resizable=" + resizable + ",scrollbars=" + scrollbars + ",modal=no,dependable=yes"); 
			 win.focus(); 
			 this.windowIsOpenning = false; 
			 return win; 
		} else { 
			return null; 
		} 
	}
	
	newEditor() { 
		this.showWindow("VisualMathEditor.html" + (this.runLocal ? "?runLocal" : ""), 780, 580, 100, 100); 
	}
	
	closeEditor() {
		if (window.opener) {
			if (!window.opener.closed) { 
				window.opener.focus(); 
				if (this.textAreaForSaveASCII) this.textAreaForSaveASCII.focus(); 
			}
			self.close();
		} else { 
			$.messager.alert("<span class='rtl-title-withicon'>" + this.getLocalText("ERROR") + "</span>", this.getLocalText("ERROR_QUIT_EDITOR"), 'error'); 
		}
	}
	
	testOpenFile() { 
		if (typeof (FileReader) == "undefined") { 
			$.messager.alert("<span class='rtl-title-withicon'>" + this.getLocalText("ERROR") + "</span>", "VisualMathEditor JAVASCRIPT ERROR : \n\nFileReader isn't supported!", 'error'); 
		} else { 
			document.getElementById("fOPEN_EQUATION").click(); 
		} 
	}
	
	openFile(event) {
		var vme = this;
		var file = event.target.files ? event.target.files[0] : event.target.value; 
		var reader = new FileReader(); 
		reader.onload = function() {
			vme.codeMirrorEditor.setValue(this.result); 
			vme.setCodeMirrorCursorAtEnd(); 
			vme.updateOutput();
		}; 
		reader.readAsText(file, "UTF-8");
	}
	
	saveEquationFile() {
		var content = ""; 
		content = vme.codeMirrorEditor.getValue();
		
		var fileHandler = new FileHandler();
		fileHandler.saveFile(content, "application/x-download", "fSAVE_EQUATION"); 
	}
	
	setEquationInCaller() {
		if (!this.textareaIgnore && window.opener && this.textAreaForSaveASCII) {
			if (!window.opener.closed) {
				window.opener.focus(); 
				this.textAreaForSaveASCII.value = this.codeMirrorEditor.getValue(); 
				this.textAreaForSaveASCII.focus();
			}
			self.close();
		} else if (!this.textareaIgnore && localStorage && this.textAreaForSaveASCII) {
			this.textAreaForSaveASCII.value = this.codeMirrorEditor.getValue(); 
			localStorage.setItem(this.textAreaForSaveASCII.id, this.textAreaForSaveASCII.value); 
			localStorage.setItem('update_' + this.textAreaForSaveASCII.id, "1"); 
			self.close();
		} else { 
			$.messager.alert("<span class='rtl-title-withicon'>" + this.getLocalText("ERROR") + "</span>", this.getLocalText("ERROR_SET_EQUATION"), 'error'); 
		}
	}
	
	getEquationFromCaller() {
		var textareaID = this.textareaID || this.url.param('textarea'); 
		if (!this.textareaIgnore && textareaID) {
			var value = null; 
			this.textareaID = textareaID; 
			if (window.opener && (this.textAreaForSaveASCII = window.opener.document.getElementById(textareaID))) { 
				value = this.textAreaForSaveASCII.value; 
			} else if (localStorage && (value = localStorage.getItem(textareaID))) { 
				this.textAreaForSaveASCII = { id: textareaID, value: value }; 
			}
			if (value) {
				this.codeMirrorEditor.setValue(value); 
				this.setCodeMirrorCursorAtEnd(); 
				this.updateOutput();
			} else { 
				$.messager.alert("<span class='rtl-title-withicon'>" + this.getLocalText("ERROR") + "</span>", this.getLocalText("ERROR_SET_EQUATION"), 'error'); 
			}
		}
	}
	
	viewMathML(element) { 
		var vme = this; 
		if (!vme.runNotMathJax) { 
			MathJax.Hub.Queue(function() { 
				var jax = MathJax.Hub.getAllJax(element); 
				for (var i = 0; i < jax.length; i++) { 
					vme.toMathML(jax[i], function(mml) { 
						mml = mml.replace(/&/gi, "&amp;"); 
						mml = mml.replace(/</gi, "&lt;"); 
						mml = mml.replace(/>/gi, "&gt;"); 
						mml = mml.replace(/\n/gi, "<br/>"); 
						mml = mml.replace(/ /gi, "&nbsp;"); 
						$.messager.show({ title: "<span class='rtl-title-withicon'>MathMML</span>", msg: "<div style='height:255px;width:277px;overflow:scroll;' dir='ltr'>" + mml + "</div>", timeout: 0, width: 300, height: 300 }); 
					}); 
				} 
			}); 
		} 
	}
	
	toMathML(jax, callback) {
		if (!this.runNotMathJax) {
			var mml; 
			try { 
				mml = jax.root.toMathML(""); 
			} catch (err) {
				if (!err.restart) { throw err }
				return MathJax.Callback.After([toMathML, jax, callback], err.restart);
			}
			MathJax.Callback(callback)(mml);
		}
	}
	
	chooseStyle() {
		try {
			var tags = ['link', 'style']; 
			var t, s, title; 
			var colorImg = "black", codemirrorCSS = "default", colorpickerCSS = "gray", colorType = null; 
			/*
			*/
			for (t = 0; t < (tags.length); t++) { 
				var styles = document.getElementsByTagName(tags[t]);
				console.info(`chooseStyle: have entries for tag ${tags[t]} : ${styles.length > 0}`);
				for (s = 0; s < (styles.length); s++) { 
					title = styles[s].getAttribute("title"); 
					if (title) { 
						if (title != this.style) { 
							styles[s].disabled = true; 
						} else { 
							styles[s].disabled = false; 
							colorType = styles[s].getAttribute("colorType"); 
						} 
					} 
				} 
			}
			
			/* TRIAL with jquery solution - NOT WORKING ==> try function version
			var vme = this;
			for (var tag of tags) {
				var entries = false;
				$(`${tag}[title]`).each(() => {
					entries = true;
					var title = $(this).attr("title");
					if (title != vme.style) {
						$(this).attr("disabled", true);
					} else {
						$(this).attr("disabled", false);
						colorType = $(this).attr("colorType");
					}					
				});
				console.info(`chooseStyle: have entries for tag ${tag} : ${entries}`);
			}
			*/
			
			if (colorType == "black") {
				colorImg = "white"
				codemirrorCSS = "twilight"; 
				colorpickerCSS = "black";
			}
			this.codeMirrorEditor.setOption("theme", codemirrorCSS); 
			if (!this.runNotColorPicker) { 
				// TODO: handle color picker
				// document.getElementById("colorpickerCSSblack").disabled = !(colorpickerCSS == "black"); 
				// document.getElementById("colorpickerCSSgray").disabled = !(colorpickerCSS == "gray");
				// TODO: valid code ?
				$("#colorpickerCSSblack").disabled = !(colorpickerCSS == "black");
				$("#colorpickerCSSgray").disabled = !(colorpickerCSS == "gray");
			}
			var posColor, posExt; $(".symbol_btn").each(function(index) { 
				if (this.className.indexOf("icon-matrix") > -1) { 
					posColor = this.className.lastIndexOf("_"); 
					if (posColor) this.className = this.className.substr(0, posColor + 1) + colorImg; 
				} 
			}); 
			this.setRTLstyle();
		}
		catch(e) {
			console.error(`chooseStyle error: ${e}`);		
		}
	}
	
	setRTLstyle() {
		/* TODO: needs extra css style element
		 */
		var dir = this.getLocalText("_i18n_HTML_Dir");
		this.themes.setRTLstyle(dir);
	}
	
	getBoolean(text) { return (text == "true"); }
	
	d2h(d) { return d.toString(16).toUpperCase(); }
	
	h2d(h) { return parseInt(h, 16); }
	
	encodeStringForHTMLAttr(s) { 
		if (typeof s == "string") return s.replace("\"", "&quot;"); else return ""; 
	}
	
	loadScript(url, callback) {
		var script = document.createElement("script"); 
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

	
	initialiseUIaccordion(accordionID) {
		var vme = this; 
		$(accordionID).accordion({
			onSelect: function(title) {
				var fPanel = $(accordionID).accordion("getSelected"); 
				if (fPanel) { 
					var fPanelID = $(fPanel).attr("id"); 
					if (vme.symbolPanelsLoaded.indexOf(fPanelID) == -1) { 
						vme.symbolPanelsLoaded[vme.symbolPanelsLoaded.length] = fPanelID; 
						$(fPanel).html(`<img src='${vme.location}jquery-easyui/themes/default/images/loading.gif' />`); 
						$(fPanel).load(
							`${vme.location}../formulas/` + fPanelID + ".html", 
							async function() { 
								await vme.initialiseSymbolContent(fPanelID); 
								$("#" + fPanelID + " a.more").click(
									async function(event) { 
										event.preventDefault(); 
										await vme.initialiseUImoreDialogs(fPanelID); 
									}
								); 
								vme.chooseStyle(); 
							}
						); 
					} 
				}
				vme.setFocus();
			}
		}); 
		var p = $(accordionID).accordion('getSelected'); 
		if (p) { p.panel('collapse', false); }
		this.math.updateHeaders();
	}
	
	async initialiseSymbolContent(fPanelID) { 
		var vme = this; 
		function getSymbol(obj) { 
			if (typeof ($(obj).attr("lbegin")) != "undefined" && typeof ($(obj).attr("lend")) != "undefined") { 
				return $(obj).attr("lbegin") + $(obj).attr("lend"); 
			} else if (typeof ($(obj).attr("latex")) != "undefined") { 
				return $(obj).attr("latex"); 
			} else { 
				return vme.getLocalText("NO_LATEX"); 
			} 
		}; 
		$("#" + fPanelID + " a.s")
			.addClass("easyui-tooltip")
			.attr("title", function(index, attr) { return getSymbol(this); })
			.mouseover(function(event) { $("#divInformation").html(getSymbol(this)); })
			.mouseout(function(event) { $("#divInformation").html("&nbsp;"); })
			.click(function(event) { 
				event.preventDefault(); 
				if (typeof ($(this).attr("lbegin")) != "undefined" && typeof ($(this).attr("lend")) != "undefined") { 
					vme.tag($(this).attr("lbegin"), $(this).attr("lend")); 
				} else if (typeof ($(this).attr("latex")) != "undefined") { 
					vme.insert($(this).attr("latex")); 
				} else { 
					$.messager.show({ 
						title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", 
						msg: vme.getLocalText("NO_LATEX") }); 
				} 
			}); 
		// link with more class -> needs image handling
		$("#" + fPanelID + " a.more")
		.addClass("easyui-tooltip")
		.attr("title", function(index, attr) { return "Loading more formulae"; });

		await vme.parser.parseAsync("#" + fPanelID); 
		this.math.updateTables();
	}
	
	async updateInfo() {
		var vme = this;
		$('div[href]')
		.each(function( idx ) {
			var href = $(this).attr('href');
			var id = $(this).attr('id');
			if (href.length == 0) {												// info html !
				console.info(`Info dialog with : id : ${id}, href : ${href}`);
				var newHref = `${vme.location}../information/${id}.html`;
				$(this).attr('href', newHref);
				$(this).load(newHref);
			}
		});
		/*
		*/ 
		await vme.parser.parseAsync('div[href]', 0, 100);
		console.info(`Parse completed for : div[href]`);
		vme.math.inplaceUpdate('#tEQUATION div a.s[latex], #mSPECIAL_CHARACTER div a.s[latex]');			// where and when to do that
	}
}

	
function getScriptLocation() {
		var location = $("script[src]")
			.last()
			.attr("src")
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20')
			.replace('file:///', 'file://')
			.replace('file://', 'file:///') + '/';
		console.info(`Script location is : ${location}`);
		return location;
}


console.info(`Katex: About to Init Accordion`);


$(document).ready(async function() {
	console.info('Document ready.');
	
	vme = new KatexInputHelper();
	await vme.initialise();
	$('#myContainer').layout({fit: true});
	$('#divEquationInputOutput').layout({});
});

/**
 * This event does throw !
 */
$(window).on(
	'unload', 
	function() {
		console.info('Dialog closed: 1.');
		var equation = vme.codeMirrorEditor.getValue();
		vme.parameters.writeParameters(equation);
	}
);


/**
 * @abstract This invocation guarantees initialization after page load.
 */
var timer = setInterval(() => { 
	console.info(`Katex: First timeout started`);

	/*
		TODO LIST
		- Nachladen der CSS Files für Themes mit ungeklärten Fehlern
		- COPYRIGHT Eintrag in lang.json Files noch modifizieren 
	*/
	clearInterval(timer);

}, 1000);
