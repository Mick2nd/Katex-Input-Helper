
/**
 * A wrapper around the JSON file with version info.
 */
export class Versions {
	versions: any = { };
	
	async init(codemirrorEditorVersion: string) {
		this.versions = (await import( /* webpackInclude: /\.json$/ */ './versions.json')).default;
		this.versions.jqueryVersion = $.fn.jquery;
		this.codemirrorEditorVersion = codemirrorEditorVersion;
	}

	get version() { return this.versions.version; }
	get VKI_version() { return this.versions.VKI_version; }
	get easyuiVersion() { return this.versions.easyuiVersion; }
	get katexVersion() { return this.versions.katexVersion; }
	get colorPickerVersion() { return this.versions.colorPickerVersion; }
	get build() { return this.versions.build; }
	get jqueryVersion() { return this.versions.jqueryVersion; }
	get codemirrorEditorVersion() { return this.versions.codemirrorEditorVersion; }
	set codemirrorEditorVersion(value: string) { this.versions.codemirrorEditorVersion = value; }
}