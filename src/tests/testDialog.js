
class TestDialog {

	baseLocation = "";
	parser = null;
	localizer = null;
		
	constructor(baseLocation) {
		this.baseLocation = baseLocation;
	}
	
	async initialize() {

		this.setBaseLocation();
		this.parser = new ParserExtension(true);
		this.localizer = new Localizer();
		await this.localizer.initialiseLanguageChoice('en_US');
		
		this.parseOptions('#menu a', $.fn.menubutton);
		this.parseOptions('.easyui-dialog', $.fn.dialog);
		this.localize();
		$('#myContainer').layout({fit: true});
		await this.parser.parseAsync('.easyui-dialog');
		//await this.parser.parseAsync('#menu a');
	}
	
	parseOptions(selector, easyui) {
		
		$(selector).each(function() {
			
			var ob = { };
			try {
				var options = $(this).attr('data-options');
				var json = options
					.replace(/(\w+)\:(.*?)(\,?)/g, '"$1":$2$3')						// first quote all identifier
					.replaceAll("'", '"');											// then replace single quotes -> JSON compatible
				console.debug(`parseOptions : translated string : ${json} `);			
				ob = JSON.parse('{' + json + '}');
			} catch(e) {
				console.warn(`Error parsing data-options : ${options}, ${e} `);
			}
			
			easyui.bind($(this))(ob);
		});
	}
	
	localize() {
		
		var inst = this;
		$('span[locate]').each(function() {
			var key = $(this).attr('locate');
			var val = inst.localizer.getLocalText(key);
			$(this).html(val);
		});
	}
	
	setBaseLocation() {

		$('html > head').append($('<base />'));
		$('html > head > base').attr('href', this.baseLocation);
			
		return location;
	}
}
