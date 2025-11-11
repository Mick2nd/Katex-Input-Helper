import './easyui';
import { injectable, inject } from 'inversify';
import { ILocalizer, localizerId, IMenus } from './interfaces';

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
			onSelect: onMenuClick
		});
		$('#sm').sidemenu('expand');
		$('#sm').sidemenu('resize', { width: 300 });
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
	
	/**
	 * Transforms the menu data into a ready to use html string.
	 * 
	 * @param data - the menu description, preferably the mainMenuData
	 * @returns the ready to use html
	 */
	getTabletMenu(data: any) : string {
		const map = this.mapTabletMenuItem.bind(this);
		/**
		 * Maps hierarchical menu description to nested arrays of text.
		 */
		function mapAll(data: any) : any {
			const mapped = data.map(item => {
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
			const result = lines.reduce((accu, current) => {
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
	getSidemenuData(data: any) : any {
		return this.getTransformedData(data, this.mapSidemenuItem.bind(this), item => item != null);
	}

	/**
	 * Prepares a single side menu item.
	 */
	mapSidemenuItem(single: any) : any {
		if (single.separator) return null;
		return {
			id: single.id + '_side',
			text: `<span class="rtl-menu-item" locate="${single.locate}">${this.localizer.getLocalText(single.locate)}</span>`,
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
	getTransformedData(data: any, map: (any) => any, filter: (any) => boolean = (item) => true) : any {
		function mapAll(data: any) {
			const mapped = data.map(item => {
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
			const filtered = data.filter(item => {
				
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
					locate: "",
					iconCls: "",
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
}

// This helps to import symbols in test suite
try {
	module.exports = { Menus };
} catch(e) { }

