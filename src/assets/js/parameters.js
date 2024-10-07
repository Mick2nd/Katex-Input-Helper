
/**
 * Manages control parameters, especially those which can be stored over sessions.
 * Cookie handling is included.
 */
class Parameters {
	
	constructor() {
		
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
	
	deleteCookie(name) { 
		this.setCookie(name, "", -1); 
	}
	
}