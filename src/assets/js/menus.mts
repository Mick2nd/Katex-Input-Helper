import { injectable, inject } from 'inversify';
import { ILocalizer, localizerId, IMenus } from './interfaces.mjs';

/**
 * Supports various kinds of Menus. Part of this class is a menu description to
 * be used by all kinds of applications.
 * 
 * Requires the following integrations:
 * - Desktop main menu bar
 * - Tablet main menu
 * - Phone side menu
 * - Insert context menu (of Editor)
 * - View context menu
 */
@injectable()
export class Menus implements IMenus {

	localizer: ILocalizer = null;
	
	/**
	 * Constructor.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer
	) {
		this.localizer = localizer;
	}

	/**
	 * Populates a side menu in a wrapper menu panel for reduced space.
	 */
	populateSidemenu(data: any, onMenuClick: () => void) {
		$('#sm').sidemenu({
			data: data,
			floatMenuPosition: 'left',
			multiple: false,
			onSelect: onMenuClick,
			animate: true
		});
		
		$('ul.sidemenu-tree span.tree-title').each(function(idx) {				// set the css class for menu separator
			if ($(this).text() == '') {
				$(this).addClass('menu-sep');
			}
		});

		$('.tree-node').addClass('menu-noline');								// CSS classes for menu-line implementation
		$('<span class="menu-line" ></span>').insertBefore('#sm .tree-title');
		
		$('#sm').sidemenu('expand');
	}
	
	/**
	 * Maps a single menu item to a html string. The item can have a nested menu.
	 * LaTeX text is a special case. It cannot be localized.
	 */
	mapTabletMenuItem(item: any) : string | any[] {
		if (item.children) {
			return [`
				<div iconcls="${item.iconCls}">
					<span locate="${item.locate}"></span> 
					<div id="${item.id}" class="menus">`,
					`</div>
				</div>`];
		} else if (item.separator) {
			return '<div class="menu-sep"></div>';
		} else {
			const spanLatex = '<span class="rtl-menu-item">LaTeX</span>';
			const span = item.text ? spanLatex : `<span class="rtl-menu-item" locate="${item.locate}" information="${item.locate}">${this.localizer.getLocalText(item.locate)}</span>`;
			return `
				<div id="${item.id}" iconcls="${item.iconCls}">
					${span}
				</div>`;
		}
	}
	
	get desktopSelectors() {
		return `#menu, #${this.insertContextMenuData.id}-CM, #${this.viewContextMenuData.id}-CM, #${this.treeMenuFolderData.id}, #${this.treeMenuLeafData.id}`;
	}

	get mobileSelectors() {
		return `#${this.viewContextMenuData.id}-CM, #${this.treeMenuFolderData.id}, #${this.treeMenuLeafData.id}`;
	}
	
	get desktopMenus() : string {
		return this.mainMenu + this.insertMenu + this.viewMenu + this.treeMenuFolder + this.treeMenuLeaf;
	}
	
	get mobileMenus() : string {
		let anchor = "";
		anchor += '<a id="fSAVE_EQUATION" href="#" class="invisible">saveFile</a>\n';
		anchor += '<input type="file" id="fOPEN_EQUATION" class="invisible" />\n';
		
		return this.viewMenu + this.treeMenuFolder + this.treeMenuLeaf + anchor;
	}
	
	get mainMenu() : string {
		let main = "";
		main += this.getMainMenuBar();
		for (const menu of this.mainMenuData) {
			main += this.getSingleMenu(menu);
		}
		main += '<a id="fSAVE_EQUATION" href="#" class="invisible">saveFile</a>\n';
		main += '<input type="file" id="fOPEN_EQUATION" class="invisible" />\n';
		return main;
	}
	
	get insertMenu() : string {
		const insertMenuData = { };
		Object.assign(insertMenuData, this.insertContextMenuData);
		insertMenuData["id"] += '-CM';
		const menu = this.getSingleMenu(insertMenuData);
		$(menu).addClass('easyui-menu');
		return menu;
	}

	get viewMenu() : string {
		const viewMenuData = { };
		Object.assign(viewMenuData, this.viewContextMenuData);
		viewMenuData["id"] += '-CM';
		const menu = this.getSingleMenu(viewMenuData);
		$(menu).addClass('easyui-menu');
		return menu;
	}

	get treeMenuFolder() : string {
		const menu = this.getSingleMenu(this.treeMenuFolderData);
		return menu;
	}
	
	/**
	 * TODO: the addClass API seems to have no effect, but in viewMenu it has one.
	 * What is going on?
	 * In the mean time I set class 'easyui-menu' for all menus but not simple menu
	 * items.
	 */
	get treeMenuLeaf() : string {
		const menu = this.getSingleMenu(this.treeMenuLeafData);
		return menu;
	}
	
	getMainMenuBar() : string {
		let menuBar = '<div id="menu">\n';
		for (const item of this.mainMenuData) {
			menuBar += `<a class="easyui-menubutton" data-options="iconCls:'${item.iconCls}',menu:'#${item.id}'"><span locate="${item.locate}"></span></a>\n`;
		}
		menuBar += '</div>\n';
		return menuBar;
	}
	
	getSingleMenu(item: any, nested: boolean = false) : string {
		if (item.children) {
			let menu = "";
			if (nested) {
				menu = `<div iconcls="${item.iconCls}" id="${item.id}">\n
					<span class='rtl-menu-item' locate="${item.locate}"></span>\n
					<div class="menus">\n`;
			} else {
				menu = `<div id="${item.id}" class="menus easyui-menu">\n`;
			}
			for (const child of item.children) {
				menu += this.getSingleMenu(child, true);
			}
			if (nested) {
				menu += '</div>\n';
			}
			menu += '</div>\n';
			return menu;
			
		} else {
			return this.mapMenuItem(item);
		}
	}
	
	/**
	 * Transforms an item into a menuitem entry, provided we have a single menu
	 * item. We have 3 cases:
	 * - menu separator
	 * - latex menu
	 * - the common case with localized text
	 */
	mapMenuItem(item: any) : string {
		if (item.separator) {
			return '<div class="menu-sep"></div>\n';
			
		} else {
			const spanLatex = '<span class="rtl-menu-item">LaTeX</span>';
			const spanLocate = `<span class="rtl-menu-item" locate="${item.locate}" information="${item.locate}">${this.localizer.getLocalText(item.locate)}</span>`;
			const span = item.locate ? spanLocate : spanLatex;
			const title = (item.tooltip ? `title="<span locate='${item.tooltip}'>${item.tooltip}</span>"` : "");
			const custom = item.custom ?? "";
			return `
				<div id="${item.id}" iconcls="${item.iconCls}" ${custom} ${title}>\n
					${span}\n
				</div>\n`;
		}
	}
	
	/**
	 * Transforms the menu data into a ready to use html string.
	 * TODO: Too complex, could be like *mainMenu*. To be used ?
	 * 
	 * @returns the ready to use html
	 */
	get tabletMenu() : string {
		const data = this.mainMenuData;
		const map = this.mapTabletMenuItem.bind(this);
		/**
		 * Maps hierarchical menu description to nested arrays of text.
		 */
		function mapAll(data: any) : any {
			const mapped = data.map((item: any) => {
				const mappedItem = map(item);
				if (typeof(mappedItem) != 'string') {
					mappedItem.splice(1, 0, mapAll(item.children));
				}
				return mappedItem;
			});
			return mapped;
		}
		
		/**
		 * Reduces nested array of text to a single string.
		 */
		function reduce(lines: any) : string {
			const result = lines.reduce((accu: string, current: any) => {
				if (typeof current == 'string') {
					return accu + current + '\n';
				} else {
					return accu + reduce(current);
				}
			}, '');
			return result;
		}
		
		const lines = mapAll(data);
		return reduce(lines);
	}
	
	/**
	 * Given a standard piece of menu data, transforms it to side menu format and
	 * returns it.
	 * 
	 * @param data - menu tree
	 * @returns menu tree transformed to side menu format
	 */
	get sidemenuData() : any {
		const data = this.mainMenuData;
		return this.getTransformedData(data, this.mapSidemenuItem.bind(this), item => item != null);
	}

	/**
	 * Prepares a single side menu item.
	 */
	mapSidemenuItem(single: any) : any {
		if (single.separator) return {
			id: '',
			text: '',
			iconCls: ''
		};
		let text = String.raw`<span class='rtl-menu-item' >$\LaTeX$</span>`;		// special case LaTeX menu
		if (single.locate) {
			text = `<span class="rtl-menu-item" locate="${single.locate}">${this.localizer.getLocalText(single.locate)}</span>`;
		}
		return {
			id: single.id + '_side',
			text: text,
			iconCls: single.iconCls,
		};
	}
	
	/**
	 * Common transformation method.
	 * 
	 * @param data - menu tree
	 * @param map - map function of a single entry
	 * @param filter - filter function of a single entry
	 * @returns the transformed menu tree
	 */
	getTransformedData(data: any, map: (item: any) => any, filter: (item: any) => boolean = (_item: any) => true) : any {
		function mapAll(data: any) {
			const mapped = data.map((item: any) => {
				const mappedItem = map(item);
				if (item == null) return null;
				if (item.children != undefined) {
					mappedItem.children = mapAll(item.children);
				}
				return mappedItem;
			});
			return mapped;
		}
		function filterAll(data: any) {
			const filtered = data.filter((item: any) => {
				
				if (!filter(item)) return false;
				if (item.children != undefined) {
					item.children = filterAll(item.children);
				}
				return true;
			})
			return filtered;
		}
		
		const mapped = mapAll(data);
		const filtered = filterAll(mapped);
		return filtered;
	}
	
	/**
	 * Returns the description of the main menu (hierarchical).
	 */
	get mainMenuData() : any {
		return [
			{
				id: "mFILE",
				locate: "FILE",
				iconCls: "icon-file",
				children: [
					{ 
						id: "mSAVE_EQUATION",
						locate: "SAVE_EQUATION",
						iconCls: "icon-save"
					},
					{ 
						id: "mOPEN_EQUATION",
						locate: "OPEN_EQUATION",
						iconCls: "icon-open"
					},
				]
			},
			this.insertContextMenuData,
			{
				id: "mTOOLS",
				locate: "TOOLS",
				iconCls: "icon-plugin",
				children: [
					{
						id: "mKEYBOARD",
						locate: "KEYBOARD",
						iconCls: "icon-keyboard",
					},
				]
			},
			this.viewContextMenuData,
			{
				id: "mOPTIONS",
				locate: "OPTIONS",
				iconCls: "icon-option",
				children: [
					{
						id: "mEDITOR_PARAMETERS",
						locate: "EDITOR_PARAMETERS",
						iconCls: "icon-edit",
					},
					{
						separator: true
					},
					{
						id: "mSTYLE_CHOISE",
						locate: "STYLE_CHOISE",
						iconCls: "icon-style",
					},
					{
						id: "mLANGUAGE_CHOISE",
						locate: "LANGUAGE_CHOISE",
						iconCls: "icon-language",
					},
				]
			},
			{
				id: "mINFORMATIONS",
				locate: "INFORMATIONS",
				iconCls: "icon-info",
				children: [
					{
						id: "mCOPYRIGHT",
						locate: "COPYRIGHT",
						iconCls: "icon-copyright",
					},
					{
						separator: true
					},
					{
						id: "mVERSION",
						locate: "VERSION",
						iconCls: "icon-history",
					},
					{
						separator: true
					},
					{
						id: "mBUGS",
						locate: "BUGS",
						iconCls: "icon-bugs",
					},
					{
						separator: true
					},
					{
						id: "mEQUATION_SAMPLE",
						locate: "EQUATION_SAMPLE",
						iconCls: "icon-equation",
					},
					{
						separator: true
					},
					{
						id: "mEVENT_LIST",
						locate: "EVENT_LIST",
						iconCls: "icon-info",
					},
				]
			},
		];
	}
	
	get insertContextMenuData() {
		return {
			id: "mINSERT",
			locate: "INSERT",
			iconCls: "icon-insert",
			children: [
				{
					id: "mCHARS",
					locate: "CHAR",
					iconCls: "icon-char",
					children: [
						{
							id: "f_FR_CHAR",
							locate: "FR_CHAR",
							iconCls: "icon-FR_CHAR",
						},
						{
							id: "f_BBB_CHAR",
							locate: "BBB_CHAR",
							iconCls: "icon-BBB_CHAR",
						},
						{
							id: "f_GREEK_CHAR",
							locate: "L_U_GREEK_CHAR",
							iconCls: "icon-GREEK_CHAR",
						},
						{
							id: "f_ALL_CHAR",
							locate: "CHAR",
							iconCls: "icon-char",
						},
					]
				},
				{
					id: "mSPECIAL_CHARACTER",
					locate: "SPECIAL_CHARACTER",
					iconCls: "icon-special_char",
				},
				{
					id: "mHORIZONTAL_SPACING",
					locate: "HORIZONTAL_SPACING_SYMBOLS",
					iconCls: "icon-hspace",
				},
				{
					id: "mVERTICAL_SPACING",
					locate: "VERTICAL_SPACING_SYMBOLS",
					iconCls: "icon-vspace",
				},
				{
					separator: true
				},
				{
					id: "mMATRIX",
					locate: "MATRIX",
					iconCls: "icon-matrix",
				},
				{
					separator: true
				},
				{
					id: "mCHEMICAL_FORMULAE",
					locate: "CHEMICAL_FORMULAE",
					iconCls: "icon-chemical",
				},
				{
					id: "mCOMMUTATIVE_DIAGRAM",
					locate: "COMMUTATIVE_DIAGRAM",
					iconCls: "icon-diagram",
				},
				{
					id: "mEQUATION",
					locate: "EQUATION",
					iconCls: "icon-equation",
				},
				{
					id: "mCUSTOM_EQUATIONS",
					locate: "CUSTOM_EQUATIONS",
					iconCls: "icon-equation",
				},
				{
					separator: true
				},
				{
					id: "mLaTeX_TEXT",
					iconCls: "icon-blank",
					text: "LaTeX"			// TODO: special case, needs extra handling
				},
			]
		};
	}
	
	get viewContextMenuData() {
		return {
			id: "mVIEW",
			locate: "VIEW",
			iconCls: "icon-watch",
			children: [
				{
					id: "mUNICODES_LIST",
					locate: "UNICODES_LIST",
					iconCls: "icon-codes",
				},
				{
					id: "mLATEX_CODES_LIST",
					locate: "LATEX_CODES_LIST",
					iconCls: "icon-symbols",
				},
				{
					separator: true
				},
				{
					id: "mLANG_RESSOURCE_LIST",
					locate: "LANGUAGE_LIST",
					iconCls: "icon-langressource",
				},
				{
					separator: true
				},
				{
					id: "mLATEX_DOCUMENTATION",
					locate: "LATEX_DOCUMENTATION",
					iconCls: "icon-doclatex",
				},
				{
					id: "mMHCHEM_DOCUMENTATION",
					locate: "MHCHEM_DOCUMENTATION",
					iconCls: "icon-doclatex",
				},
				{
					id: "mAMSCD_DOCUMENTATION",
					locate: "AMSCD_DOCUMENTATION",
					iconCls: "icon-doclatex",
				},
				{
					separator: true
				},
				{
					id: "mMATH_ML_SPECIFICATIONS",
					locate: "MATH_ML_SPECIFICATIONS",
					iconCls: "icon-docmml",
				},
			]
		};
	}
	
	get treeMenuFolderData() {
		return {
			id: "treeMenu",
			children: [
				{
					id: "mAppendFolder",
					locate: "APPENDFOLDER",
					iconCls: "icon-add",
					tooltip: "TTAPPENDFOLDER",
					custom: "class='easyui-tooltip custom-equations'"
				},
				{
					id: "mAppendCategory",
					locate: "APPENDCATEGORY",
					iconCls: "icon-add",
					tooltip: "TTAPPENDCATEGORY",
					custom: "class='easyui-tooltip custom-equations'"
				},
				{
					id: "mRemove",
					locate: "REMOVE",
					iconCls: "icon-remove",
					tooltip: "TTREMOVEFOLDER",
					custom: "class='easyui-tooltip custom-equations'"
				}
			]
		};
	}
	
	get treeMenuLeafData() {
		return {
			id: "treeMenuLeaf",
			children: [
				{
					id: "mRemoveLeaf",
					locate: "REMOVE",
					iconCls: "icon-remove",
					tooltip: "TTREMOVECATEGORY",
					custom: "class='easyui-tooltip custom-equations'"
				},
				{
					separator: true
				},
				{
					id: "mCutPaste",
					locate: "CUTPASTE",
					iconCls: "icon-cut",
					tooltip: "TTCUTPASTE",
					custom: "class='easyui-tooltip custom-equations'"
				}
			]
		};
	}
	
	/*
	<div id="treeMenu" class="easyui-menu" data-options="minWidth:160">
		<div id="mAppendFolder" class="custom-equations easyui-tooltip" data-options="iconCls:'icon-add'"
			title="<span locate='TTAPPENDFOLDER'>Append Folder</span>">
			<span class="custom-equations" locate="APPENDFOLDER">Append Folder</span>
		</div>
		<div id="mAppendCategory" class="custom-equations easyui-tooltip" data-options="iconCls:'icon-add'"
			title="<span locate='TTAPPENDCATEGORY'>Append Categroy</span>">
			<span class="custom-equations" locate="APPENDCATEGORY">Append Category</span>
		</div>
		<div id="mRemove" class="custom-equations easyui-tooltip" data-options="iconCls:'icon-remove'"
			title="<span locate='TTREMOVEFOLDER'>REMOVE</span>" >
			<span class="custom-equations" locate="REMOVE">Remove</span>
		</div>
	</div>
	
	<div id="treeMenuLeaf" class="easyui-menu" data-options="minWidth:160">
		<div id="mRemoveLeaf" class="custom-equations easyui-tooltip" data-options="iconCls:'icon-remove'"
			title="<span locate='TTREMOVECATEGORY'>REMOVE</span>" >
			<span class="custom-equations" locate="REMOVE">Remove</span>
		</div>
		<div data-options="separator:true"></div>
		<div id="mCutPaste" class="custom-equations easyui-tooltip" data-options="iconCls:'icon-cut'"
			title="<span locate='TTCUTPASTE'>Cut &amp; Paste Equations</span>" >
			<span class="custom-equations" locate="CUTPASTE">Cut &amp; Paste Equations</span>
		</div>
	</div>
	 */
}

// This helps to import symbols in test suite
try {
	module.exports = { Menus };
} catch(e) { }

