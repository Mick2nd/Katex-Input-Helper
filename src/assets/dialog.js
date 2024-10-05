
/*
function getIframeDocument() : Document | null {
	try {
		var iframe = document.getElementById('mathIframe') as HTMLIFrameElement;
		console.info(iframe);
		var iframeDocument = iframe.contentDocument;
		if (iframeDocument == null) {
			iframeDocument = iframe.contentWindow.document;
		}
		console.info(iframeDocument);
		return iframeDocument;
	}
	catch(e) {
		console.warn(`Katex: ${e}`);
		return null;
	}
};

function mathChanged(event) {
	var element = event.target;
	const tag = element.tagName ? element.tagName : '';
	console.info(`Katex: In input handler: ${element} : ${tag}`);
	if (tag === 'TEXTAREA') {
		// var textArea = getIframeDocument().getElementById('mathTextInput') as HTMLTextAreaElement;
		var textArea = element as HTMLTextAreaElement;
		console.dir(textArea)
		var text = textArea.nodeValue;
		(document.getElementById('hidden') as HTMLInputElement).value = text;
	}
}

function initialize() {
	var textArea = getIframeDocument().getElementById('mathTextInput') as HTMLTextAreaElement;
	textArea.nodeValue = `\\mathbb{ABC}`;
	getIframeDocument().addEventListener('input', mathChanged);
	document.addEventListener('unload', (event) => {
		console.info(`Katex: onUnload : ${event}`);
	});

	// test output
	(document.getElementById('hidden') as HTMLInputElement).value = `\\mathbb{ABC}`;
	console.info(`Katex Test: ${JSON.stringify(textArea.outerHTML)}`);
};
*/

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

var console; 
if (window.console) console = window.console; else console = { log: function(msg) { }, error: function(msg) { } }; 
var vme; 
window.vme = vme; 

/*
$(document).ready(function() { 
	$.parser.onComplete = function() { 
		if (!vme) { 
			vme = new KatexInputHelper(); 
			if (!vme.isBuild) { 
				$("body").html("VisualMathEditor Error. The editor does not load properly. You can try to refresh the page by pressing the F5 key."); 
			} 
		} 
	}; 
}); 
*/

class KatexInputHelper {

	version = "2.0.33"; 
	codeType = 'Latex'; 
	encloseAllFormula = false; 
	saveOptionInCookies = false; 
	localType = "en_US"; 
	style = "aguas"; 
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
	
	constructor() {
		var vme = this;
		window.vme = this;
	
		// independant of plugin variant
		this.location = getScriptLocation();
		console.info(`Script location: ${this.location}`);
		
		var adr = "https://visualmatheditor.equatheque.net/VisualMathEditor.html?runLocal&codeType=Latex&encloseAllFormula=false&style=default&localType=en_US&equation=\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}";
		var pars = "?runLocal&codeType=Latex&encloseAllFormula=false&style=default&localType=en_US&equation=\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}";
		
		this.url = {
			param: function(name) {
				var params = {
					runLocal: true,
					codeType: "Latex",
					encloseAllFormula: false,
					style: "default",
					localType: "en_US",
					equation: "\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}"				
				};
				return params[name];
			}
		};
		
		this.localizer = new Localizer();

		/*
		this.url = $.url(true);
		this.runLocal = eval($.url(document.getElementById("vmeScript").src).param('runLocal'));
		this.runNotCodeMirror = eval($.url(document.getElementById("vmeScript").src).param('runNotCodeMirror'));
		this.runNotMathJax = eval($.url(document.getElementById("vmeScript").src).param('runNotMathJax')); 
		this.runNotVirtualKeyboard = eval($.url(document.getElementById("vmeScript").src).param('runNotVirtualKeyboard')); 
		this.runNotColorPicker = eval($.url(document.getElementById("vmeScript").src).param('runNotColorPicker')); 
		*/
		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput'); 
		
		for (var i = 65; i <= 90; i++) if ($.inArray(i, this.allowedCtrlKeys) == -1) this.notAllowedCtrlKeys.push(i); 
		for (var i = 65; i < 90; i++) this.notAllowedAltKeys.push(i); 
	}
	
	/**
	 * Appends a series of required CSS files to head of html.
	 * The HTML itself cannot do this.
	 */
	appendCss(activeTheme) {
		console.info(`Active theme is ${activeTheme}`);
		var csss = [
			{
				title: "aguas",
				uitheme: "js/jquery-easyui/themes/aguas/easyui.css",
				metheme: "js/jquery-easyui-MathEditorExtend/themes/aguas/easyui.css",
			},
			{
				title: "gray",
				uitheme: "js/jquery-easyui/themes/gray/easyui.css",
				metheme: "js/jquery-easyui-MathEditorExtend/themes/gray/easyui.css",
			},
			{
				title: "metro",
				uitheme: "js/jquery-easyui/themes/metro/easyui.css",
				metheme: "js/jquery-easyui-MathEditorExtend/themes/metro/easyui.css",
			},
			{
				title: "bootstrap",
				uitheme: "js/jquery-easyui/themes/bootstrap/easyui.css",
				metheme: "js/jquery-easyui-MathEditorExtend/themes/bootstrap/easyui.css",
			},
			{
				title: "black",
				uitheme: "js/jquery-easyui/themes/black/easyui.css",
				metheme: "js/jquery-easyui-MathEditorExtend/themes/black/easyui.css",
			}
		];
		
		var uiicon = "js/jquery-easyui/themes/icon.css";
		var meicon = "js/jquery-easyui-MathEditorExtend/themes/icon.css";
		var rtl = "js/jquery-easyui-MathEditorExtend/themes/rtl.css";
		
		var vme = this;
		function appendSingleBasic(css) {
			var location = vme.location;
			$('head')
			.append('<link rel="stylesheet" type="text/css" />')
			.attr('href', `${location}${css}`)
		};
		function appendSingle(css, title, disable) {
			$('head')
			.append('<link rel="stylesheet" type="text/css" />')
			.attr('href', `${location}${css}`)
			.attr('title', title)
			.attr('disable', `${disable}`);
		};
		function appendSingleId(css, id) {
			$('head')
			.append('<link rel="stylesheet" type="text/css" />')
			.attr('href', `${location}${css}`)
			.attr('id', id)
			.attr('disable', true);
		};
			
		for (var css of csss) {
			appendSingle(css.uitheme, css.title, activeTheme == css.title);
			appendSingle(css.metheme, css.title, activeTheme == css.title);
		};
		
		appendSingleBasic(uiicon);
		appendSingleBasic(meicon);
		appendSingleId(rtl, "RTLstyle");
	}

	initialise() { 
		var vme = this; 
		//vme.appendCss(this.style);
		$.messager.progress({ 
			title: "VisualMathEditor", 
			text: vme.getLocalText("WAIT_FOR_EDITOR_DOWNLOAD"), 
			msg: "<center>&copy; <a href='mailto:contact@equatheque.com?subject=VisualMathEditor' target='_blank' class='bt' >David Grima</a> - <a href='http://www.equatheque.net' target='_blank' class='bt' >EquaThEque</a><br/><br/></center>", 
			interval: 300 
		}); 
		this.initialiseLocalType(() => {
			vme.initialiseUI(); 
			vme.initialiseParameters(); 
			if (!vme.runNotCodeMirror) vme.initialiseCodeMirror(); 
			vme.initialiseStyle(); 
			vme.initialiseLanguage();
			vme.localType = vme.url.param('localType');
			vme.initialiseCodeType(); 
			vme.saveCookies(); 
			vme.initialiseVirtualKeyboard(); 
			if (!vme.runNotMathJax) vme.initialiseMathJax(); else vme.endWait(); 
			vme.isBuild = true;
			$('#myContainer').layout({fit: true});
		}); 
	}
	
	endWait() { 
		this.initialiseEquation(); 
		this.switchMathJaxMenu(); 
		$.messager.progress('close'); 
		$("#WaitMsg").hide(); 
		this.setFocus(); 
		this.resizeDivInputOutput(); 
	}
	
	setFocus() { 
		if (!this.runNotCodeMirror && this.codeMirrorEditor) this.codeMirrorEditor.focus(); 
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
		if (!this.runNotVirtualKeyboard) this.loadScript(`${this.location}js/keyboard/keyboard.js`, function() { return true; }); }
	
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
	}
	
	initialiseUI() {
		var vme = this; 
		$("a.easyui-linkbutton").linkbutton({ plain: true }); 
		$(document).bind('contextmenu', function(event) { event.preventDefault(); return false; }); 
		$("#mFILE, #mINSERT, #mTOOLS, #mVIEW, #mOPTIONS, #mINFORMATIONS").menu({
			onClick: function(item) {
				switch (item.target.id) {
					case "mEDITOR_PARAMETERS": $('#wEDITOR_PARAMETERS').dialog('open'); break; 
					case "mSTYLE_CHOISE": $('#wSTYLE_CHOISE').dialog('open'); break; 
					case "mLANGUAGE_CHOISE": $('#wLANGUAGE_CHOISE').dialog('open'); break; 
					case "mMATRIX": vme.showMatrixWindow(3, 3); break; 
					case "mCOMMUTATIVE_DIAGRAM": vme.initialiseUImoreDialogs("f_COMMUTATIVE_DIAGRAM"); break; 
					case "mCHEMICAL_FORMULAE": vme.initialiseUImoreDialogs("f_CHEMICAL_FORMULAE"); break; 
					case "mNEW_EDITOR": vme.newEditor(); break; 
					case "mQUIT_EDITOR": vme.closeEditor(); break; 
					case "mSAVE_EQUATION": vme.saveEquationFile(); break; 
					case "mOPEN_EQUATION": vme.testOpenFile(); break; 
					case "mUPDATE_EQUATION": vme.getEquationFromCaller(); break; 
					case "mSET_EQUATION": vme.setEquationInCaller(); break; 
					case "mLaTeX_TEXT": vme.insert("\\LaTeX"); break; 
					case "mMATH_ML": vme.viewMathML(vme.mathVisualOutput.id); break; 
					case "mUNICODES_LIST": $('#wUNICODES_LIST').window('open'); vme.initialiseUniCodesList(); break; 
					case "mLATEX_CODES_LIST": $('#wLATEX_CODES_LIST').window('open'); vme.initialiseLatexMathjaxCodesList(); break; 
					case "mASCIIMATH_CODES_LIST": $('#wASCIIMATH_CODES_LIST').window('open'); vme.initialiseAsciiMathCodesList(); break; 
					case "mLANG_RESSOURCE_LIST": $('#wLANGUAGE_LIST').window('open'); vme.initialiseLangRessourcesList(); break; 
					case "mLATEX_DOCUMENTATION": var file = (vme.runLocal ? "doc/" : "http://www.tex.ac.uk/tex-archive/info/symbols/comprehensive/") + "symbols-a4.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wLATEX_DOCUMENTATION', 'yes', 'yes', 'no', 'no'); break; 
					case "mMHCHEM_DOCUMENTATION": var file = (vme.runLocal ? "doc/" : "http://www.ctan.org/tex-archive/macros/latex/contrib/mhchem/") + "mhchem.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wMHCHEM_DOCUMENTATION', 'yes', 'yes', 'no', 'no'); break; 
					case "mAMSCD_DOCUMENTATION": var file = (vme.runLocal ? "doc/" : "http://www.jmilne.org/not/") + "Mamscd.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wAMSCD_DOCUMENTATION', 'yes', 'yes', 'no', 'no'); break; 
					case "mMATH_ML_SPECIFICATIONS": var file = (vme.runLocal ? "doc/" : "http://www.w3.org/TR/MathML/") + "mathml.pdf"; vme.showWindow(file, 780, 580, 100, 100, 'wMATH_ML_SPECIFICATIONS', 'yes', 'yes', 'no', 'no'); break; 
					case "mCOPYRIGHT": vme.openInformationTab(0); break; 
					case "mVERSION": vme.openInformationTab(1); break; 
					case "mBUGS": vme.openInformationTab(2); break; 
					case "mEQUATION_SAMPLE": vme.openInformationTab(3); break; 
					case "f_GREEK_CHAR": vme.initialiseUImoreDialogs("f_L_U_GREEK_CHAR"); break; 
					case "mCHARS": 
					case "f_ALL_CHAR": vme.initialiseUImoreDialogs("f_ALL_CHAR"); break; 
					case "f_FR_CHAR": 
					case "f_BBB_CHAR": vme.initialiseUImoreDialogs(item.target.id); break; 
					case "mEQUATION": vme.initialiseUImoreDialogs("f_EQUATION"); break; 
					case "mHORIZONTAL_SPACING": vme.initialiseUImoreDialogs("f_HORIZONTAL_SPACING"); break; 
					case "mVERTICAL_SPACING": vme.initialiseUImoreDialogs("f_VERTICAL_SPACING"); break; 
					case "mSPECIAL_CHARACTER": vme.initialiseUImoreDialogs("f_SPECIAL_CHARACTER"); break; 
					case "mHTML_MODE": $("#btENCLOSE_TYPE").click(); break; 
					case "mKEYBOARD": if (!vme.runNotVirtualKeyboard) { VKI_show(document.getElementById("tKEYBOARD")); $("#keyboardInputMaster").draggable({ handle: '#keyboardTitle' }); } break; 
					default: $.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: item.text }); break;
				}
			}
		}); 
		if (!window.opener) { $("#mQUIT_EDITOR").addClass("menu-item-disabled").click(function(event) { vme.closeEditor(); }); }
		if (typeof (FileReader) == "undefined") { $("#mOPEN_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.testOpenFile(); }); }
		$("#fOPEN_EQUATION").change(function(event) { vme.openFile(event); }); 
		this.initialiseUIaccordion("#f_SYMBOLS"); 
		this.initialiseUIaccordion("#f_SYMBOLS2"); 
		$('#tINFORMATIONS').tabs({
			onLoad: function(panel) {
				switch (panel.attr("id")) { 
					case "tCOPYRIGHT": $("#VMEdate").html((new Date()).getFullYear()); break; 
					case "tVERSION": $("#VMEversion").html("<table>" + "<tr><td><b>" + vme.version + "</b></td><td><b>Visual Math Editor</b>, (This software)</td></tr>" + (vme.runNotMathJax ? "" : ("<tr><td>" + MathJax.version + " </td><td>Math Jax</td></tr>")) + (vme.runNotCodeMirror ? "" : ("<tr><td>" + CodeMirror.version + " </td><td>Code Mirror</td></tr>")) + (vme.runNotVirtualKeyboard ? "" : ("<tr><td>" + VKI_version + " </td><td>Virtual Keyboard</td></tr>")) + "<tr><td>" + $.fn.jquery + " </td><td>Jquery</td></tr>" + "<tr><td>" + "1.3.3" + " </td><td>Jquery Easyui</td></tr>" + (vme.runNotColorPicker ? "" : ("<tr><td>" + "23/05/2009" + " </td><td>Jquery Color Picker</td></tr>")) + "<table>"); break; 
					case "tEQUATION": vme.initialiseSymbolContent(panel.attr("id")); if (!vme.runNotMathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, panel.attr("id")]); break; }
			}
		}); 
		$('#btMATRIX_CLOSE').click(function(event) { event.preventDefault(); $('#wMATRIX').dialog('close'); vme.setFocus(); }); 
		$('#btMATRIX_SET').click(function(event) { event.preventDefault(); if (vme.codeType == "AsciiMath") vme.setAsciiMatrixInEditor(); else vme.setLatexMatrixInEditor(); vme.updateOutput(); 
		$('#wMATRIX').dialog('close'); vme.setFocus(); }); 
		$('#colsMATRIX, #rowsMATRIX').keyup(function(event) { vme.updateMatrixWindow(); }); 
		$('#btSTYLE_CHOISE_CLOSE').click(function(event) { event.preventDefault(); $('#wSTYLE_CHOISE').dialog('close'); vme.setFocus(); }); 
		$('#btLANGUAGE_CHOISE_CLOSE').click(function(event) { event.preventDefault(); $('#wLANGUAGE_CHOISE').dialog('close'); vme.setFocus(); }); 
		$('#btEDITOR_PARAMETERS_CLOSE').click(function(event) { event.preventDefault(); $('#wEDITOR_PARAMETERS').dialog('close'); vme.setFocus(); }); 
		
		$("input[name='localType']").change(function() { 
			vme.localType = $("input[name='localType']:checked").val(); 
			vme.localize(); 
			if (vme.saveOptionInCookies) vme.setCookie("VME_localType", vme.localType, 1000); 
			vme.printCodeType(); 
		}); 
		
		$("input[name='codeType']").change(function() { vme.codeType = $("input[name='codeType']:checked").val(); vme.printCodeType(); vme.updateOutput(); }); 
		$("input[name='style']").change(function() { vme.style = $("input[name='style']:checked").val(); vme.chooseStyle(); if (vme.saveOptionInCookies) vme.setCookie("VME_style", vme.style, 1000); }); 
		$("#encloseType").change(function() {
			if (!(typeof ($('#encloseType').attr('checked')) == "undefined")) { vme.encloseAllFormula = true; $("#btENCLOSE_TYPE").removeClass("unselect"); $('#HTML_TAG').show(); if (!vme.runNotCodeMirror) { vme.codeMirrorEditor.setOption("mode", "text/html"); vme.codeMirrorEditor.setOption("autoCloseTags", true); } } else { vme.encloseAllFormula = false; $("#btENCLOSE_TYPE").addClass("unselect"); $('#HTML_TAG').hide(); if (!vme.runNotCodeMirror) { vme.codeMirrorEditor.setOption("mode", "text/x-latex"); vme.codeMirrorEditor.setOption("autoCloseTags", false); } }
			vme.resizeDivInputOutput(); vme.updateOutput(); if (vme.saveOptionInCookies) vme.setCookie("VME_encloseAllFormula", vme.encloseAllFormula, 1000);
		}); 
		$("#autoUpdateTime").change(function() { vme.autoUpdateTime = $("#autoUpdateTime").val(); if (vme.saveOptionInCookies) vme.setCookie("VME_autoUpdateTime", vme.autoUpdateTime, 1000); }); 
		$("#menuupdateType").change(function() { (typeof ($('#menuupdateType').attr('checked')) == "undefined") ? vme.menuupdateType = false : vme.menuupdateType = true; if (vme.saveOptionInCookies) vme.setCookie("VME_menuupdateType", vme.menuupdateType, 1000); }); 
		$("#autoupdateType").change(function() { (typeof ($('#autoupdateType').attr('checked')) == "undefined") ? vme.autoupdateType = false : vme.autoupdateType = true; if (vme.saveOptionInCookies) vme.setCookie("VME_autoupdateType", vme.autoupdateType, 1000); }); 
		$("#menuMathjaxType").change(function() { vme.switchMathJaxMenu(); if (vme.saveOptionInCookies) vme.setCookie("VME_menuMathjaxType", vme.menuMathjaxType, 1000); }); 
		$("#cookieType").change(function() { (typeof ($('#cookieType').attr('checked')) == "undefined") ? vme.saveOptionInCookies = false : vme.saveOptionInCookies = true; vme.saveCookies(); }); 
		$(window).resize(function() { setTimeout('vme.resizeDivInputOutput();', 500); }); 
		$("#mathVisualOutput").bind('contextmenu', function(event) { event.preventDefault(); $('#mVIEW').menu('show', { left: event.pageX, top: event.pageY }); return false; }); 
		if (vme.runNotCodeMirror) { $("#mathTextInput").bind('contextmenu', function(event) { event.preventDefault(); $('#mINSERT').menu('show', { left: event.pageX, top: event.pageY }); return false; }).keyup(function(event) { var key = event.keyCode || event.which; if (($.inArray(key, vme.notAllowedKeys) == -1) && !($.inArray(key, vme.notAllowedCtrlKeys) != -1 && event.ctrlKey) && !($.inArray(key, vme.notAllowedAltKeys) != -1 && event.altKey)) { vme.autoUpdateOutput(); } else { } }); this.mathTextInput.setSelectionRange(this.mathTextInput.value.length, this.mathTextInput.value.length); }
		$("[information]").mouseover(function(event) { $("#divInformation").html(vme.getLocalText($(this).attr("information"))); }); 
		$("[information]").mouseout(function(event) { $("#divInformation").html("&nbsp;"); }); 
		$('#unicodeChoise').combobox({ valueField: 'value', textField: 'text', onSelect: function(record) { var range = record.value.split(","); vme.setUniCodesValues(vme.h2d(range[0]), vme.h2d(range[1])); }, onLoadSuccess: function() { $(this).combobox("select", "0x25A0,0x25FF"); vme.setUniCodesValues(0x25A0, 0x25FF); } });
	}
	
	openInformationTab(numTab) { 
		$('#wINFORMATIONS').window('open'); $('#tINFORMATIONS').tabs('select', numTab); 
	}
	
	resizeDivInputOutput() { 
		var htmlTagHeight = 0; 
		if ($('#HTML_TAG').is(':visible')) htmlTagHeight = $('#HTML_TAG').height() + 1; 
		var inputOutputHeight = $("#divEquationInputOutput").height(); 
		var inputOutputWidth = $("#divEquationInputOutput").width(); 
		$("#divMathTextInput").height(inputOutputHeight / 2 - htmlTagHeight / 2); 
		$("#mathTextInput").height(inputOutputHeight / 2 - 10 - htmlTagHeight / 2); 
		$("#mathTextInput").width(inputOutputWidth - 10); 
		$("#mathVisualOutput").height(inputOutputHeight / 2 - 11 - htmlTagHeight / 2); 
		if (!this.runNotCodeMirror) this.codeMirrorEditor.setSize($("#divMathTextInput").width() + 1, $("#divMathTextInput").height()); 
	}
	
	initialiseUImoreDialogs(fPanelID) {
		var fPanelMoreID = 'w' + fPanelID + '_MORE';
		var fPanelMore = $('#' + fPanelMoreID); 
		if (vme.symbolPanelsLoaded.indexOf(fPanelMoreID) == -1) { 
			vme.symbolPanelsLoaded[vme.symbolPanelsLoaded.length] = fPanelMoreID; 
			var cookie = vme.getCookie("VME_Position_" + fPanelMoreID); 
			$(fPanelMore).dialog({ 
				onLoad: 
					function() { vme.initialiseSymbolContent(fPanelMoreID); }, 
				onMove: 
					function(left, top) { 
						if (vme.saveOptionInCookies) vme.setCookie("VME_Position_" + fPanelMoreID, "{left:" + left + ",top:" + top + "}", 1000); 
					}, 
				title: $("#" + fPanelMoreID + "_TITLE").html() 
			}); 
			$(fPanelMore).dialog('open'); 
			if (!vme.runNotMathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, fPanelMoreID + "_TITLE"]); 
			$(fPanelMore).dialog('refresh', `${vme.location}formulas/` + fPanelID + "_MORE.html");
			if (cookie && typeof (cookie) != "undefined") { 
				$(fPanelMore).dialog('move', eval('(' + cookie + ')')); 
			} else { 
				$(fPanelMore).dialog('move', eval('(' + $(fPanelMore).attr("position") + ')')); 
			} 
		} else { 
			$(fPanelMore).dialog('open'); 
		}
	}
	
	switchCodeType() { 
		this.codeType = (this.codeType == "AsciiMath") ? "Latex" : "AsciiMath"; 
		this.printCodeType(); 
		this.updateOutput(); 
	}	
	
	printCodeType() { 
		$("[name='codeType']").filter("[value=" + this.codeType + "]").attr("checked", "checked"); 
		$("#title_Edition_Current_Syntax").text(this.codeType); 
		$("#title_Edition_Other_Syntax").text((this.codeType == "AsciiMath") ? "Latex" : "AsciiMath"); 
		if (this.saveOptionInCookies) this.setCookie("VME_codeType", this.codeType, 1000); 
	}
	
	initialiseCodeType() {
		var param = this.url.param('codeType'); 
		if (param && typeof (param) != "undefined") { 
			this.codeType = param; 
		} else { 
			var cookie = this.getCookie("VME_codeType"); 
			if (cookie && typeof (cookie) != "undefined") this.codeType = cookie; 
		}
		this.printCodeType();
	}
	
	initialiseStyle() {
		var param = this.url.param('style'); 
		if (param && typeof (param) != "undefined") { 
			this.style = param; 
		} else { 
			var cookie = this.getCookie("VME_style"); 
			if (cookie && typeof (cookie) != "undefined") this.style = cookie; 
		}
		$("[name='style']").filter("[value=" + this.style + "]").attr("checked", "checked"); 
		this.chooseStyle();
	}
	
	initialiseLocalType(callback = () => {}) {
		var param = this.url.param('localType'); 
		if (param && typeof (param) != "undefined") { 
			this.localType = param; 
		} else { 
			var cookie = this.getCookie("VME_localType"); 
			if (cookie && typeof (cookie) != "undefined") this.localType = cookie; 
		}

		this.localizer.buildLocalTypes((html) => {
			$("#formLANGUAGE_CHOISE").html(html);
			callback();
		})
	}
	
	initialiseLanguage() { 
		$("[name='localType']").filter("[value=" + this.localType + "]").attr("checked", "checked"); 
		this.localizeIt(); 
	}
	
	initialiseEquation() {
		var param = this.url.param('equation'); 
		if (param && typeof (param) != "undefined") {
			if (!this.runNotCodeMirror) { 
				this.codeMirrorEditor.setValue(param); 
				this.setCodeMirrorCursorAtEnd(); 
			} else { 
				this.mathTextInput.value = param; 
			}
			this.updateOutput();
		} else { 
			this.getEquationFromCaller(); 
		}
		if (!this.textAreaForSaveASCII) { 
			$("#mUPDATE_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.getEquationFromCaller(); }); 
			$("#mSET_EQUATION").addClass("menu-item-disabled").click(function(event) { vme.setEquationInCaller(); }); }
	}
	
	initialiseParameters() {
		var cookie = null; 
		var param = null; 
		var param = this.url.param('encloseAllFormula'); 
		if (param && typeof (param) != "undefined") { 
			this.encloseAllFormula = this.getBoolean(param); 
		} else { 
			var cookie = this.getCookie("VME_encloseAllFormula"); 
			if (cookie && typeof (cookie) != "undefined") this.encloseAllFormula = this.getBoolean(cookie); 
		}
		this.encloseAllFormula ? $("#encloseType").attr("checked", "checked") : $("#btENCLOSE_TYPE").addClass("unselect"); 
		var param = this.url.param('saveOptionInCookies'); 
		if (param && typeof (param) != "undefined") { 
			this.saveOptionInCookies = this.getBoolean(param); 
		} else { 
			var cookie = this.getCookie("VME_saveOptionInCookies"); 
			if (cookie && typeof (cookie) != "undefined") this.saveOptionInCookies = this.getBoolean(cookie); 
		}
		if (this.saveOptionInCookies) $("#cookieType").attr("checked", "checked"); 
		var param = this.url.param('autoUpdateTime'); 
		if (param && typeof (param) != "undefined") { 
			this.autoUpdateTime = param; 
		} else { 
			var cookie = this.getCookie("VME_autoUpdateTime"); 
			if (cookie && typeof (cookie) != "undefined") this.autoUpdateTime = cookie; 
		}
		if (this.autoUpdateTime) $("#autoUpdateTime").val(this.autoUpdateTime); 
		var param = this.url.param('menuupdateType'); 
		if (param && typeof (param) != "undefined") { 
			this.menuupdateType = this.getBoolean(param); 
		} else { 
			var cookie = this.getCookie("VME_menuupdateType"); 
			if (cookie && typeof (cookie) != "undefined") this.menuupdateType = this.getBoolean(cookie); 
		}
		if (this.menuupdateType) $("#menuupdateType").attr("checked", "checked"); 
		var param = this.url.param('autoupdateType'); 
		if (param && typeof (param) != "undefined") { 
			this.autoupdateType = this.getBoolean(param); 
		} else { 
			var cookie = this.getCookie("VME_autoupdateType"); 
			if (cookie && typeof (cookie) != "undefined") this.autoupdateType = this.getBoolean(cookie); 
		}
		if (this.autoupdateType) $("#autoupdateType").attr("checked", "checked"); 
		var param = this.url.param('menuMathjaxType'); 
		if (param && typeof (param) != "undefined") { 
			this.menuMathjaxType = this.getBoolean(param); 
		} else { 
			var cookie = this.getCookie("VME_menuMathjaxType"); 
			if (cookie && typeof (cookie) != "undefined") this.menuMathjaxType = this.getBoolean(cookie); 
		}
		if (this.menuMathjaxType) $("#menuMathjaxType").attr("checked", "checked"); 
		this.switchMathJaxMenu();
	}
	
	switchMathJaxMenu() { 
		if (typeof ($('#menuMathjaxType').attr('checked')) == "undefined") { 
			this.menuMathjaxType = false; 
			if (!this.runNotMathJax) MathJax.Hub.Config({ showMathMenu: false, showMathMenuMSIE: false }); 
		} else { 
			this.menuMathjaxType = true; 
			if (!this.runNotMathJax) MathJax.Hub.Config({ showMathMenu: true, showMathMenuMSIE: true }); 
		} 
	}
	
	initialiseAsciiMathCodesList() {
		if (!this.asciiMathCodesListLoaded) {
			var symbols = (this.runNotMathJax ? {} : MathJax.InputJax.AsciiMath.AM.symbols); 
			var ascii; 
			var html = ("<table border='1' cellspacing='0' style='margin-left:20px;border-spacing:0px;border-collapse:collapse;'><caption>" + symbols.length + " <span locate='ASCIIMATH_SYMBOLS'>" + this.getLocalText("ASCIIMATH_SYMBOLS") + "</span></caption>"); 
			html += ("\n<tr><th><span locate='ASCIIMATH_INPUT'>" + this.getLocalText("ASCIIMATH_INPUT") + "</span></th><th><span locate='OUTPUT'>" + this.getLocalText("OUTPUT") + "</span></th><th><span locate='LATEX_EQUIVALENT'>" + this.getLocalText("LATEX_EQUIVALENT") + "</span></th></tr>"); 
			for (var s = 0; s < symbols.length; s++) { 
				ascii = symbols[s]; 
				html += ('\n<tr><td dir="ltr"><a href="#" class="s" ascii="' + ascii.input + '">' + ascii.input + '</a></td><td  dir="ltr" style="font-size:150%;"><a href="#" class="s" ascii="' + (ascii.input ? ascii.input : '') + '" ' + (ascii.tex ? 'latex="\\' + ascii.tex + '"' : '') + '>' + (ascii.output ? ascii.output : '') + '</a></td><td dir="ltr">' + (ascii.tex ? '<a href="#" class="s" latex="\\' + ascii.tex + '">' + ascii.tex + '</a>' : '') + '</td></tr>'); 
			}
			html += "\n</table>"; 
			$("#cASCIIMATH_CODES_LIST").html(html); 
			this.initialiseSymbolContent("cASCIIMATH_CODES_LIST"); 
			this.asciiMathCodesListLoaded == true;
		}
	}
	
	initialiseLatexMathjaxCodesList() {
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
			var special = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.special)); 
			var remap = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.remap)); 
			var mathchar0mi = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.mathchar0mi)); 
			var mathchar0mo = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.mathchar0mo)); 
			var mathchar7 = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.mathchar7)); 
			var delimiter = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.delimiter)); 
			var macros = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.macros)); 
			var environment = (this.runNotMathJax ? {} : (MathJax.InputJax.TeX.Definitions.environment)); 
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
			this.initialiseSymbolContent("cLATEX_CODES_LIST"); 
			this.latexMathjaxCodesListLoaded = true;
		}
	}
	
	initialiseUniCodesList() {
		if (!this.uniCodesListLoaded) {
			var html = "<table><caption>[0x0000,0xFFFF]</caption>"; 
			for (var i = 0; i <= 650; i = i + 10) {
				html += "\n<tr>"; 
				for (var j = i; j < i + 10; j++) { 
					if (j > 655) break; 
					html += "<td><a style='border:1px solid #f0f0f0;' class='s' href='#' onclick='vme.selectUniCodesValues(" + ((j * 100) + 1) + "," + ((j + 1) * 100) + ");return false;'>" + (i < 10 ? "00" : (i < 100 ? "0" : "")) + j + "</a></td>"; 
				}
				html += "</tr>";
			}
			html = html + "\n</table>"; 
			$("#cUNICODES_LIST").html(html); 
			this.uniCodesListLoaded = true; 
			$('#unicodeChoise').combobox("reload", `${vme.location}formulas/unicodeChoiseData.json`);
		}
	}
	
	selectUniCodesValues(i1, i2) { 
		$('#unicodeChoise').combobox("select", ""); this.setUniCodesValues(i1, i2, true); 
	}
	
	setUniCodesValues(i1, i2, breakFFFF) {
		var html = ("<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;'>"); 
		html += ("\n<tr><th><span locate='UNICODES_INPUT'>" + this.getLocalText("UNICODES_INPUT") + "</span></th><th>HEXA</th><th><span locate='OUTPUT'>" + this.getLocalText("OUTPUT") + "</span></th></tr>"); 
		for (var i = i1; i <= i2; i++) { 
			if (breakFFFF & i > 65535) break; 
			html += ("\n<tr><td>" + i + "<td style='text-align:center;'>" + this.d2h(i) + "</td><td style='font-size:150%;text-align:center;'><a href='#' class='s' latex='\\unicode{" + i + "} '>&#" + i + ";</a></td></tr>"); 
		}
		html = html + "\n</table>"; 
		$("#cUNICODES_VALUES").html(html); 
		$("#cUNICODES_VALUES").scrollTop(0); 
		this.initialiseSymbolContent("cUNICODES_VALUES");
	}
	
	showMatrixWindow(rows, cols) { 
		this.updateMatrixWindow(rows, cols); 
		$('#wMATRIX').dialog('open'); 
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
				value = (vme.codeType == "AsciiMath" ? "a_" + r + c : "a_{" + r + c + "}")
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
			// return this.locale[this.localType][TEXT_CODE]; 
		} catch (e) { return ""; } 
	}
	
	localize() {
		console.log(`Entry into localize, localType is: ${this.localType}`);
		var inst = this;
		this.localizer.load(this.localType, false, () => {
			inst.localizeIt();
			// inst.initialiseLanguage();
		});
	}
	
	localizeIt() {
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
			vme.switchCodeType(); 
			vme.setFocus(); 
		}); 
		// TODO: correct here or part of previous onclick handler?
		if (!vme.encloseAllFormula) { 
			$("#btENCLOSE_TYPE").addClass("unselect"); 
			$('#HTML_TAG').hide(); 
		} else { 
			$("#btENCLOSE_TYPE").removeClass("unselect"); 
			$('#HTML_TAG').show(); 
		}
		vme.resizeDivInputOutput(); 
		$("#btENCLOSE_TYPE").click(function(event) {
			event.preventDefault(); 
			vme.encloseAllFormula = !vme.encloseAllFormula; 
			if (vme.encloseAllFormula) { 
				$("#encloseType").attr("checked", "checked"); 
				$("#btENCLOSE_TYPE").removeClass("unselect"); 
				$('#HTML_TAG').show(); 
				if (!vme.runNotCodeMirror) { 
					vme.codeMirrorEditor.setOption("mode", "text/html"); 
					vme.codeMirrorEditor.setOption("autoCloseTags", true); 
				} 
			} else { 
				$("#encloseType").removeAttr("checked"); 
				$("#btENCLOSE_TYPE").addClass("unselect"); 
				$('#HTML_TAG').hide(); 
				if (!vme.runNotCodeMirror) { 
					vme.codeMirrorEditor.setOption("mode", "text/x-latex"); 
					vme.codeMirrorEditor.setOption("autoCloseTags", false); 
				} 
			}
			vme.resizeDivInputOutput(); 
			vme.updateOutput(); 
			vme.setFocus(); 
			if (vme.saveOptionInCookies) vme.setCookie("VME_encloseAllFormula", vme.encloseAllFormula, 1000);
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
		$("#btCOPYRIGHT").click(function(event) { event.preventDefault(); vme.openInformationTab(0); vme.setFocus(); }); $("#VMEversionInf").html(vme.version);
	}
	
	initialiseLangRessourcesList() {
		this.localizer.buildLocalResources(() => {});
		/*
		var lang, ressource, list, dir, langage, title; 
		for (lang in this.locale) {
			langage = this.locale[lang]["_i18n_Langage"]; 
			title = lang; 
			if (!$('#tLANGUAGE_LIST').tabs('exists', title)) {
				list = "<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;margin:20px;width:580px'>"; 
				dir = this.locale[lang]["_i18n_HTML_Dir"]; 
				for (ressource in this.locale[lang]) { 
					list += ("<tr><td valign='top'><b>" + ressource + "</b> : </td><td valign='top' class='rtl-align-right'" + ((dir == "rtl") ? "style='text-align:right;'" : "") + " dir='" + dir + "'>" + this.locale[lang][ressource].replace(/</gi, "&lt;") + "</td></tr>\n"); 
				}
				list += "</table>"; $('#tLANGUAGE_LIST').tabs('add', { title: title, content: list, closable: false });
			}
		}
		*/
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
		var vme = this; 
		var encloseChar = (vme.codeType == "AsciiMath" ? "`" : "$"); 
		var content = ""; 
		if (!vme.runNotCodeMirror) { 
			content = vme.codeMirrorEditor.getValue(); 
		} else { 
			content = $(vme.mathTextInput).val(); 
		}
		if (content == "") content = " "; 
		if (!vme.encloseAllFormula) { 
			content = content.replace(/</gi, "&lt;"); 
			content = encloseChar + content + encloseChar; 
		} else { 
		}
		
		// REPLACE next statement
		// $(vme.mathVisualOutput).html(content);
		this.insertMath(content); 
		
		if (!vme.runNotMathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, vme.mathVisualOutput]);
	}
	
	insert(b) {
		if (!this.runNotCodeMirror) { 
			this.codeMirrorEditor.replaceSelection(b); 
			this.codeMirrorEditor.setCursor(this.codeMirrorEditor.getCursor()); 
			if (this.menuupdateType) this.updateOutput(); 
		} else { 
			this.encloseSelection("", "", function(a) { return b + a; }) 
		}
		this.setFocus();
	}
	
	insertBeforeEachLine(b) { 
		this.encloseSelection("", "", function(a) { a = a.replace(/\r/g, ""); 
			return b + a.replace(/\n/g, "\n" + b) }) 
		}
	
	tag(b, a) {
		b = b || null; a = a || b; if (!b || !a) { return }
		if (!this.runNotCodeMirror) { 
			this.codeMirrorEditor.replaceSelection(b + this.codeMirrorEditor.getSelection() + a); 
			var pos = this.codeMirrorEditor.getCursor(); 
			pos.ch = pos.ch - a.length; this.codeMirrorEditor.setCursor(pos); 
			if (this.menuupdateType) this.updateOutput(); 
		} else { 
			this.encloseSelection(b, a) 
		}
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
		var file = event.target.files ? event.target.files[0] : event.target.value; 
		var reader = new FileReader(); 
		reader.onload = function() {
			if (!vme.runNotCodeMirror) { 
				vme.codeMirrorEditor.setValue(this.result); 
				vme.setCodeMirrorCursorAtEnd(); 
			} else { 
				vme.mathTextInput.value = this.result; 
			}
			vme.updateOutput();
		}; 
		reader.readAsText(file, "UTF-8");
	}
	
	saveEquationFile() {
		var content = ""; 
		if (!vme.runNotCodeMirror) content = vme.codeMirrorEditor.getValue(); else content = $(vme.mathTextInput).val(); 
		var type = "application/x-download"; 
		var name = "equation_vme_" + (vme.encloseAllFormula ? "html" : this.codeType.toLowerCase()) + ".txt"; 
		var blob = null; 
		if (typeof window.Blob == "function") { 
			try { 
				blob = new Blob([content], { type: type }); 
			} catch (e) { } 
		} else { 
			var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder; 
			if (typeof window.BlobBuilder == "function") { 
				try { 
					var bb = new BlobBuilder(); 
					bb.append(content); 
					blob = bb.getBlob(type); 
				} catch (e) { } 
			} 
		}
		if (blob && (typeof navigator.msSaveBlob == "function")) { 
			try { 
				navigator.msSaveBlob(blob, name); 
				return; 
			} catch (e) { } 
		}
		if ($.browser.msie) { 
			var dociframe = ieFrameForSaveContent.document; 
			dociframe.body.innerHTML = content; 
			dociframe.execCommand("SaveAs", true, name); 
			return; 
		}
		var bloburl = null; 
		if (blob) { 
			var URL = window.URL || window.webkitURL; 
			try { 
				bloburl = URL.createObjectURL(blob); 
			} catch (e) { } 
		}
		// TODO: no statement detected here
		{
			$("#fSAVE_EQUATION").attr("href", bloburl ? bloburl : "data:" + type + ";charset=utf-8;filename=" + name + ";content-disposition=attachment," + encodeURIComponent(content)); 
			$("#fSAVE_EQUATION").attr("download", name); 
			$("#fSAVE_EQUATION").attr("type", type); 
			var comp = document.getElementById('fSAVE_EQUATION'); 
			try { 
				comp.click(); 
				return; 
			} catch (ex) { }
			try { 
				if (document.createEvent) { 
					var e = document.createEvent('MouseEvents'); 
					e.initEvent('click', true, true); 
					comp.dispatchEvent(e); 
					return; 
				} 
			} catch (ex) { }
			try { 
				if (document.createEventObject) { 
					var evObj = document.createEventObject(); 
					comp.fireEvent("onclick", evObj); 
					return; 
				} 
			} catch (ex) { }
		}
		if (bloburl) { 
			window.location.href = bloburl; 
			return; 
		}
		{ 
			window.location = "data:" + type + ";charset=utf-8," + encodeURIComponent(content); 
			return; 
		}
	}
	
	setEquationInCaller() {
		if (!this.textareaIgnore && window.opener && this.textAreaForSaveASCII) {
			if (!window.opener.closed) {
				window.opener.focus(); 
				if (!this.runNotCodeMirror) { 
					this.textAreaForSaveASCII.value = this.codeMirrorEditor.getValue(); 
				} else { 
					this.textAreaForSaveASCII.value = this.mathTextInput.value; 
				}
				this.textAreaForSaveASCII.focus();
			}
			self.close();
		} else if (!this.textareaIgnore && localStorage && this.textAreaForSaveASCII) {
			if (!this.runNotCodeMirror) { 
				this.textAreaForSaveASCII.value = this.codeMirrorEditor.getValue(); 
			} else { 
				this.textAreaForSaveASCII.value = this.mathTextInput.value; 
			}
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
				if (!this.runNotCodeMirror) { 
					this.codeMirrorEditor.setValue(value); 
					this.setCodeMirrorCursorAtEnd(); 
				} else { 
					this.mathTextInput.value = value; 
				}
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
			for (t = 0; t < (tags.length); t++) { 
				var styles = document.getElementsByTagName(tags[t]); 
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
			if (colorType == "black") {
				colorImg = "white"
				codemirrorCSS = "twilight"; colorpickerCSS = "black";
			}
			if (!this.runNotCodeMirror) this.codeMirrorEditor.setOption("theme", codemirrorCSS); 
			if (!this.runNotColorPicker) { 
				// TODO: handle color picker
				// document.getElementById("colorpickerCSSblack").disabled = !(colorpickerCSS == "black"); 
				// document.getElementById("colorpickerCSSgray").disabled = !(colorpickerCSS == "gray"); 
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
		var dir = this.getLocalText("_i18n_HTML_Dir"); 
		document.getElementById("RTLstyle").disabled = (dir != "rtl"); 
		 */
	}
	
	saveCookies() { 
		if (this.saveOptionInCookies) { 
			this.setCookie("VME_codeType", this.codeType, 1000); 
			this.setCookie("VME_encloseAllFormula", this.encloseAllFormula, 1000); 
			this.setCookie("VME_saveOptionInCookies", this.saveOptionInCookies, 1000); 
			this.setCookie("VME_localType", this.localType, 1000); 
			this.setCookie("VME_style", this.style, 1000); 
			this.setCookie("VME_autoUpdateTime", this.autoUpdateTime, 1000); 
			this.setCookie("VME_menuupdateType", this.menuupdateType, 1000); 
			this.setCookie("VME_autoupdateType", this.autoupdateType, 1000); 
			this.setCookie("VME_menuMathjaxType", this.menuMathjaxType, 1000); 
		} else { 
			this.deleteCookie("VME_codeType"); 
			this.deleteCookie("VME_encloseAllFormula"); 
			this.deleteCookie("VME_saveOptionInCookies"); 
			this.deleteCookie("VME_localType"); 
			this.deleteCookie("VME_style"); 
			this.deleteCookie("VME_autoUpdateTime"); 
			this.deleteCookie("VME_menuupdateType"); 
			this.deleteCookie("VME_autoupdateType"); 
			this.deleteCookie("VME_menuMathjaxType"); 
			this.deleteCookie("VME_Position_wf_BRACKET_SYMBOLS_MORE"); 
			this.deleteCookie("VME_Position_wf_ARROW_SYMBOLS_MORE"); 
			this.deleteCookie("VME_Position_wf_RELATION_SYMBOLS_MORE"); 
			this.deleteCookie("VME_Position_wf_FR_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_BBB_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_L_U_GREEK_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_ALL_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_EQUATION_MORE"); 
			this.deleteCookie("VME_Position_wf_COMMUTATIVE_DIAGRAM_MORE"); 
			this.deleteCookie("VME_Position_wf_CHEMICAL_FORMULAE_MORE"); 
			this.deleteCookie("VME_Position_wf_HORIZONTAL_SPACING_MORE"); 
			this.deleteCookie("VME_Position_wf_VERTICAL_SPACING_MORE"); 
			this.deleteCookie("VME_Position_wf_SPECIAL_CHARACTER_MORE"); 
		} 
	}
	
	setCookie(name, value, days, path, domain, secure) {
		var expires = ""; 
		if (days) { 
			var date = new Date(); 
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); 
			expires = "; expires=" + date.toGMTString(); 
		}
		document.cookie = name + "=" + escape(value) + expires + ((path) ? "; path=" + path : "; path=/") + ((domain) ? "; domain=" + domain : "") + ((secure) ? "; secure" : "");
	}
	
	getCookie(name) {
		var nameEQ = name + "="; 
		var ca = document.cookie.split(';'); 
		var i, c; 
		for (i = 0; i < ca.length; i++) { 
			c = ca[i]; 
			while (c.charAt(0) == ' ') c = c.substring(1, c.length); 
			if (c.indexOf(nameEQ) == 0) return unescape(c.substring(nameEQ.length, c.length)); 
		}
		return null;
	}
	
	deleteCookie(name) { this.setCookie(name, "", -1); }
	
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
						$(fPanel).html(`<img src='${vme.location}js/jquery-easyui/themes/default/images/loading.gif' />`); 
						$(fPanel).load(
							`${vme.location}formulas/` + fPanelID + ".html", 
							function() { 
								vme.initialiseSymbolContent(fPanelID); 
								$("#" + fPanelID + " a.more").click(
									function(event) { 
										event.preventDefault(); 
										vme.initialiseUImoreDialogs(fPanelID); 
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
		this.updateHeaders();
	}
	
	initialiseSymbolContent(fPanelID) { 
		var vme = this; 
		function getSymbol(obj) { 
			if (vme.codeType == "AsciiMath") { 
				if (typeof ($(obj).attr("abegin")) != "undefined" && typeof ($(obj).attr("aend")) != "undefined") { 
					return $(obj).attr("abegin") + $(obj).attr("aend"); 
				} else if (typeof ($(obj).attr("ascii")) != "undefined") { 
					return $(obj).attr("ascii"); 
				} else { 
					return vme.getLocalText("NO_ASCII"); 
				} 
			} else { 
				if (typeof ($(obj).attr("lbegin")) != "undefined" && typeof ($(obj).attr("lend")) != "undefined") { 
					return $(obj).attr("lbegin") + $(obj).attr("lend"); 
				} else if (typeof ($(obj).attr("latex")) != "undefined") { 
					return $(obj).attr("latex"); 
				} else { 
					return vme.getLocalText("NO_LATEX"); 
				} 
			} 
		}; 
		$("#" + fPanelID + " a.s")
			.addClass("easyui-tooltip")
			.attr("title", function(index, attr) { return getSymbol(this); })
			.mouseover(function(event) { $("#divInformation").html(getSymbol(this)); })
			.mouseout(function(event) { $("#divInformation").html("&nbsp;"); })
			.click(function(event) { 
				event.preventDefault(); 
				if (vme.codeType == "AsciiMath") { 
					if (typeof ($(this).attr("abegin")) != "undefined" && typeof ($(this).attr("aend")) != "undefined") { 
						vme.tag($(this).attr("abegin"), $(this).attr("aend")); 
					} else if (typeof ($(this).attr("ascii")) != "undefined") { 
						vme.insert($(this).attr("ascii")); 
					} else { 
						$.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: vme.getLocalText("NO_ASCII") }); 
					} 
				} else { 
					if (typeof ($(this).attr("lbegin")) != "undefined" && typeof ($(this).attr("lend")) != "undefined") { 
						vme.tag($(this).attr("lbegin"), $(this).attr("lend")); 
					} else if (typeof ($(this).attr("latex")) != "undefined") { 
						vme.insert($(this).attr("latex")); 
					} else { 
						$.messager.show({ title: "<span class='rtl-title-withicon'>" + vme.getLocalText("INFORMATION") + "</span>", msg: vme.getLocalText("NO_LATEX") }); 
					} 
				} 
			}); 
		// link with more class -> needs image handling
		$("#" + fPanelID + " a.more")
		.addClass("easyui-tooltip")
		.attr("title", function(index, attr) { return "Loading more formulae"; });

		$.parser.parse("#" + fPanelID); 
		if (!vme.runNotMathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, fPanelID]); 
		this.updateTables();
	}
	
	insertMath(text, element = null, multiple = false) {
		try {
			var target = element;
			if (target == null) {
				target = this.mathVisualOutput;
			}
			
			if (text.startsWith('$')) {
				if (! multiple) {
					text = text.substring(1, text.length - 1);
				} else {
					text = text.replace(/&nbsp;&nbsp;/g, '\\quad');
					text = text.replace(/\$/g, '');
				}
			}
			
			katex.render(text, target, { thrownOnError: false, strict: false, macros: { '\\box': '□' } });
		} catch(e) {
			console.error(`Katex: insertMath : ${e}`);
		}
	}
	
	updateTables() {
		try {
			var entries = $('.panel-body table tbody tr td a.easyui-tooltip');
			console.info(`Katex: ${entries.length} td items`);
			entries.each((idx, a) => {
				if (a) {
					var html = a.innerHTML;
					var count = html.split('$').length - 1;
					if (count == 2) {								// normal case: math
						var text = a.innerText;
						text = text.replace(/□/g, '\\square');
						this.insertMath(text, a);
					} else if (count > 2) {							// image with surrounding characters
						var text1 = a.firstChild.textContent;
						text1 = text1.substring(1, text1.length - 1);

						var text2 = a.lastChild.textContent;
						text2 = text2.substring(1, text2.length - 1);

						var img = a.children[0];
						var src = img.attributes['src'];
						img.setAttribute('src', this.location + src.value);
						
						this.insertMath(text2, a);
						var ch = a.children[0];
						this.insertMath(text1, a);
						a.appendChild(img);
						a.appendChild(ch);
					
					} else {										// direct image case
						var img = a.firstChild;
						if (img && img.hasAttribute('src')) {
							var src = img.attributes['src'].value;
							if (!src.startsWith('file')) {
								src = this.location + src;
							}
							img.setAttribute('src', src);
						}
					}
				}
			})
		} catch(e) {
			console.error(`Katex: updateTables : ${e}`);
		}
	}
	
	updateHeaders() {
		try {
			var entries = $('.panel-title span');
			console.info(`Katex: ${entries.length} header items`);
			entries.each((idx, a) => {
				if (a) {
					var text = a.innerText;
					if (text.startsWith('$')) {
						this.insertMath(text, a, true);
					}
				}
			})
		} catch(e) {
			console.error(`Katex: updateHeaders : ${e}`);
		}
	}
}

	
function getScriptLocation() {
		return $("script[src]")
			.last()
			.attr("src")
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20') + '/';
}


console.info(`Katex: About to Init Accordion`);


$(document).ready(function() {
	console.info('Document ready.');
	
	// What triggers this parser event?
	$.parser.onComplete = function() {
		console.info('onComplete ready.');
	};
	
	/*
	vme = new KatexInputHelper();
	vme.initialise();
	*/	
}); 


/**
 * @abstract This invocation guarantees initialization after page load.
 */
var timer = setInterval(() => { 
	console.info(`Katex: First timeout started`);

	/*
	*/
	vme = new KatexInputHelper();
	vme.initialise();
	clearInterval(timer);

}, 1000);
