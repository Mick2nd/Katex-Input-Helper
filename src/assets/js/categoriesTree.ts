import { Observable } from "./patterns/observable";
import { injectable } from 'inversify';
import { ICategoriesTree } from './interfaces';

/**
 * Manages the Categories Tree.
 * 
 * The Leafs of the tree refer to a set of equations and constitute the categories.
 * The Folders constitute super categories.
 */
@injectable() export class CategoriesTree implements ICategoriesTree {
	
	data = null;
	treeSelector = "";
	_tree = null;
	contextNode = null;
	dropSourceParent = null;
	id = 0;
	
	previousLeaf = null;
	currentLeaf = null;
	nodeSelected = null;
	treeChanged = null;
	equationMoved = null;
	
	/**
	 * Constructor.
	 */
	constructor() {
		this.treeSelector = `#categories`;
		this._tree = $(this.treeSelector);
		this.nodeSelected = new Observable();		
		this.treeChanged = new Observable();
		this.equationMoved = new Observable();
		this.treeInitialise();
	}
	
	/**
	 * Returns the tree jquery object.
	 */
	get tree() {
		return this._tree;
	}
	
	/**
	 * The Custom Equations setter.
	 * 
	 * The whole data set, JSON compatible, with categories and equations.
	 * This variant adds also some Sample data.
	 * 
	 * @async the async variant with Promise contract
	 */
	async setCustomEquations(value: any) : Promise<void> {
		let converted = this.convert(value);
		converted = await this.addSamples(converted);
		this.data = this.getCustomEquationsProxy(converted);
		this.initialise();										// it is essential to invoke it here before currentEquations 
	}
	
	/**
	 * The Custom Equations setter.
	 * 
	 * The whole data set, JSON compatible, with categories and equations.
	 */
	set customEquations(value: any) {
		let converted = this.convert(value);
		this.data = this.getCustomEquationsProxy(converted);
		this.initialise();										// it is essential to invoke it here before currentEquations 
	}
	
	/**
	 * The Custom Equations getter.
	 * 
	 * The whole data set, JSON compatible, with categories and equations.
	 */
	get customEquations() {
		return this.data;
	}

	/** Use this construct to make copies
	 */	
	getCustomEquationsProxy(data) {
		let rows = null;
		rows = [ data ];
		return _proxy(rows);

		/**
		 * Copy a single node with relevant data.
		 */
		function _copy(from) {
			let keys = ['text', 'state', 'attributes', 'selected', 'haveSamples'];
			let to: any = { };
			for (const key of Object.keys(from)) {
				if (keys.some(item => item == key)) {
					to[key] = from[key];
				}
			}
			to.children = [ ];
			
			return to;
		}

		/**
		 * Proxy an array of nodes.
		 */
		function _proxy(rows, parent = null) {
			let targetRows = [ ];
			for (let row of rows) {
				let targetRow = _copy(row);
				targetRows.push(targetRow);
				if (parent != null) {
					parent.children.push(targetRow);
				}
				let children = row.children;
				if (children && children.length) {
					_proxy(children, targetRow);
				}
			}
			
			return targetRows[0];
		}		
	}

		
	/**
	 * A Proxy of the Custom Equations data.
	 * 
	 * This is capable of being serialized over JSON.
	 */
	get customEquationsProxy() {
		return this.getCustomEquationsProxy(this.data);
	}
	
	/**
	 * The Current Equations setter as for the current selected category.
	 */
	set currentEquations(value) {
		if (this.currentLeaf != null) {
			try {
				if (this.currentLeaf.attributes === undefined) {
					this.currentLeaf.attributes = { };
				}
				if (this.currentLeaf.text == 'Default' && value.length === 0) {
					console.trace(`CategoriesTree : currentEquations setter`);
				}
				this.currentLeaf.attributes.equations = value;
			} catch(e) {
				console.warn(`Exception in currentEquations setter : ${e} `);
			}
		}
	}
	
	/**
	 * The Current Equations getter as for the current selected category.
	 */
	get currentEquations() {
		if (!this.currentLeaf) {
			this.currentLeaf = 
				this.tree
				.tree('find', { text: 'Default'});
		}
		try {
			return this.currentLeaf.attributes.equations;
		} catch(e) {
			console.warn(`Exception in currentEquations getter : ${e} `);
			return [];
		}
	}
	
	/**
	 * One time initialization of the *tree* extension. 
	 */
	treeInitialise() {
		let inst = this;
		$.extend($.fn.tree.methods, {
			/**
			 * Extension of tree methods with sort functionality.
			 */
			sort: function(jq, order) {
				return jq.each(function() {
					inst.sort.bind(inst)(order);
				});
			},
			
			isLeafDefault: $.fn.tree.methods.isLeaf,
			
			/**
			 * Extension (replacement) of tree methods with custom *isLeaf* method.
			 */
			isLeaf: function(jq, target) {
				return (function() {
					let node = $(jq[0]).tree('getNode', target);
					if (node != null) {
						console.debug(`isLeaf: ${'attributes' in node} `);
						return 'attributes' in node;
					}
					return $(jq[0]).tree('isLeafDefault', target);
				})();				 
			}
		});
		
		$.extend(true, $.fn.droppable.defaults, { accept: '.tree-node, .datagrid-div' });
	}

	/**
	 * Initialise routine. Part of the Custom Equations setter.
	 */
	initialise() {
		let inst = this;

		function updateDndIcon(yes) {
			$('body')
			.find('.tree-dnd-icon')
			.removeClass('tree-dnd-yes tree-dnd-no')
			.addClass(yes ? 'tree-dnd-yes' : 'tree-dnd-no');
		}
		
		this.tree
		.tree({
			dnd: true,
			accept: '.datagrid-div, .tree-node',
			
			onDragEnter: function(target, source) {
				console.debug(`onDragEnter `);
				console.dir(this);
				let isLeaf = $(this).tree('isLeaf', target);
				updateDndIcon(!isLeaf);
			},
			onDragOver: function(target, source) {
				console.debug(`onDragOver `);
				let isLeaf = $(this).tree('isLeaf', target);
				updateDndIcon(!isLeaf);
			},
			onDragLeave: function(target, source) {
				console.debug(`onDragLeave `);
				updateDndIcon(false);
			},
			
			onBeforeDrop: function(target, source, point) {
				console.debug(`onBeforeDrop ${point} `);
				console.dir(source);
				
				if (point != 'append') {
					return false;
				}
				let isLeaf = $(this).tree('isLeaf', target);

				let targetNode = $(this).tree('getNode', target);
				inst.openFolder(targetNode, false);
				inst.openFolder(targetNode, true);

				inst.dropSourceParent = inst.getParent(source);

				console.debug(`onBeforeDrop target is Leaf ${isLeaf} `);
				return !isLeaf;
			},
			onDrop: function(target, source, point) {
				let targetNode = $(this).tree('getNode', target);
				inst.openFolder(targetNode, false);
				inst.openFolder(targetNode, true);
				
				if (!inst.dropSourceParent.children || inst.dropSourceParent.children.length == 0) {
					inst.openFolder(inst.dropSourceParent, false);
					inst.correctIcon(inst.dropSourceParent);
				}				
				console.debug(`onDrop dropping ${source.text} `);
			},
			onBeforeSelect: function(node) {
				let isLeaf = $(this).tree('isLeaf', node.target);
				return isLeaf;
			},
			onSelect: function(node) {
				let isLeaf = $(this).tree('isLeaf', node.target);
				if (isLeaf) {
					inst.previousLeaf = inst.currentLeaf;
					inst.currentLeaf = node;
					inst.customEquations.selected = inst.pathFromNode(node);
					inst.nodeSelected.notify(node.attributes.equations);
				} else {
					
				}
			},
			onDblClick: function(node) {
				$(this).tree('beginEdit', node.target);				
			},
			onAfterEdit: function(node) {
				inst.treeChanged.notify(node);				
			},
			onContextMenu: inst.onContextMenu.bind(inst),
			onLoadSuccess: inst.onLoadSuccess.bind(inst)
		})
		.tree('loadData', [ this.customEquations ])
		.tree('sort', 'asc');
		this.expandAlt();
		this.renumberIds();

		let nodePath = '/Categories/Default';
		if (this.customEquations.selected !== undefined) {
			nodePath = this.customEquations.selected;
		}
		let node = this.nodeFromPath(nodePath); 				// this.tree.tree('find', { text: nodeText });
		if (node != null) {
			this.findNode(node);
			this.tree.tree('select', node.target);			
		}
		
		console.debug(`CategoriesTree : %O`, this.data);
	}
	
	/**
	 * The context menu of the tree nodes.
	 * 
	 * We distinguish 2 context menues: one for the Leafs and one for the Folders.
	 */
	onContextMenu(e, node) {
		let inst = this;

		function remove() {
			let nodeParent = inst.getParent(node);
			inst.tree.tree('remove', node.target);
			
			if (!nodeParent.children || nodeParent.children.length == 0) {
				inst.openFolder(nodeParent, false);
				inst.correctIcon(nodeParent);
			}			
		}
		
		e.preventDefault();
		inst.contextNode = node;
		if (!inst.isLeaf(node)) {
			$('#treeMenu')							// prepare menu for Folders
			.menu({
				onClick: function(item) {
					console.debug(`Click on menu item ${item.target.id} `);
					switch(item.target.id) {
						case "mAppendFolder": 
							inst.tree
							.tree('collapseAll', node.target)
							.tree('append', { parent: node.target, data: [{ text: 'Folder-1', id: inst.freeId, state: 'closed', children: [] }] });
							inst.expandAlt();
							break;
						case "mAppendCategory":
							inst.tree
							.tree('collapseAll', node.target)
							.tree('append', { parent: node.target, data: [{ text: 'Category-1', id: inst.freeId, attributes: { equations: []} }] });
							inst.expandAlt();
							break;
						case "mRemove":
							remove();
							break;
					}
					inst.treeChanged.notify(node);				
				}
			})
			.menu('show', {						// display context menu
				left: e.pageX,
				top: e.pageY
			});
		} else {
			$('#treeMenuLeaf')					// prepare menu for Leafs
			.menu({
				onClick: function(item) {
					console.debug(`Click on menu item ${item.target.id} `);
					switch(item.target.id) {
						case "mRemoveLeaf":
							remove();
							break;
						case "mCutPaste":
							inst.moveEquations(inst.currentLeaf, node);
							break;
					}
					inst.treeChanged.notify(node);				
				}
			})
			.menu('show', {						// display context menu
				left: e.pageX,
				top: e.pageY
			});
		}
	}
	
	/**
	 * The *onLoadSuccess* event handler.
	 * 
	 * Its main purpose is to support the drag an drop operations from the datagrid
	 * to the tree.
	 */
	onLoadSuccess() {
		console.debug(`onLoadSuccess`);
		let inst = this;
		inst.tree
		.find('.tree-node')
		.each(function() {
			let opts = $(this)
			/* TEST WITHOUT THIS
			.droppable({ 
				accept: 'div.tree-node, div.datagrid-div' 
			})
			*/
			.droppable('options');			
			console.debug(`Found tree node with accept: ${opts.accept} `);

			opts.accept = 'div.tree-node, div.datagrid-div';
			let onDragEnter = opts.onDragEnter;
			let onDragOver = opts.onDragOver;
			let onDragLeave = opts.onDragLeave;
			let onDrop = opts.onDrop;
			let onBeforeDrop = opts.onBeforeDrop;
			
			opts.onDragEnter = function(e, source) {
				console.debug(`opts.onDragEnter`);
				console.dir(source);
				if ($(source).hasClass('tree-node')) {
					return onDragEnter.call(this, e, source);
				}
				return true;
			};
			opts.onDragOver = function(e, source) {
				console.debug(`opts.onDragOver`);
				if ($(source).hasClass('tree-node')) {
					onDragOver.call(this, e, source);
				} else {
					// allowDrop(source, true);
					$(this).removeClass('tree-node-append tree-node-top tree-node-bottom');
					$(this).addClass('tree-node-append');
				}
			};
			opts.onDragLeave = function(e, source) {
				if ($(source).hasClass('tree-node')) {
					onDragLeave.call(this, e, source);
				} else {
					// allowDrop(source, false);
					$(this).removeClass('tree-node-append tree-node-top tree-node-bottom');
				}
			};
			opts.onBeforeDrop = function(e, source, point) {
				if ($(source).hasClass('tree-node')) {
					return onBeforeDrop.call(this, e, source, point);
				} else {
					return true;
				}
			};
			opts.onDrop = function(e, source, point) {
				if ($(source).hasClass('tree-node')) {
					onDrop.call(this, e, source, point);
				} else {
	
				}
			};
		});
	}
	
	/**
	 * *moveEquations* moves the checked equations from a source to a target category (Leaf node).
	 * 
	 * This method notifies Observers about the change, f.i. the datagrid panel.
	 * 
	 * @param from - source leaf node 
	 * @param to - target leaf node
	 */
	moveEquations(from, to) {
		try {
			if (to !== from) {
				let checkedEquations = this.getCheckedEquations();				// indices
				for (let idx of checkedEquations) {								// first append the checked equations to the target
					let equation = from.attributes.equations[idx];
					to.attributes.equations.push(equation);
				}

				this.deleteEquations(from.attributes, checkedEquations);		// then delete them from the source (from)
				this.equationMoved.notify();
			}
		} catch(e) {
			console.warn(`moveEquations failed : ${e} `);
		}
	}
	
	/**
	 * Deletes a set of equations from the given set.
	 * 
	 * @param from - the set of equations to be modified
	 * @param checked - the indices of equations to be deleted
	 */
	deleteEquations(from, checked) {
		from.equations = from.equations.filter(									// then delete them from the source (from)
			(elem, index) => !checked.some(item => item == index));
	}
	
	/**
	 * Returns the indices of the checked equations in the datagrid.
	 * 
	 * @returns array of indices
	 */
	getCheckedEquations() {
		let checkedRows = $('#customDatagrid')
			.datagrid('getChecked');
		let indexes = checkedRows.map(row => $('#customDatagrid')
			.datagrid('getRowIndex', row));
			
		return indexes;
	}
	
	/**
	 * Converts the Custom Equations from old to new format.
	 * 
	 * The old format has only a single equations set and no category information.
	 * 
	 * @param from - custom equations in old or new format
	 * @returns - custom equations in new format, enriched with a category tree
	 */
	convert(from) {
		if (!Array.isArray(from)) {
			return from;
		}
		
		return {
			"text": "Categories",
			"children": 
			[{
				"text": "Default",
				"attributes": { "equations": from }
			},
			{
				"text": "Physical",
				"state": "closed",
			},
			{
				"text": "Mathematical",
				"state": "closed",
			}]
		};		
	}
	
	/**
	 * Adds a Samples branch to the Categories tree.
	 * 
	 * This routine secures against repeated insertions.
	 * 
	 * @param from - the Categories (Custom Equations) tree as from JSON
	 * @result the changed tree with added Samples
	 */
	async addSamples(from) {
		
		/**
		 * Searches from a given start node down the hierarchy until node with text is found.
		 */
		function getSamplesNode(node, text) {
			
			return _traverse(node.children);
			
			function _traverse(nodes) {
				for (let node of nodes) {
					if (node.text === text) {
						return node;
					}
					let children = node.children;
					if (children && children.length) {
						let found = _traverse(children);
						if (found) {
							return found;
						}
					}
				}
				return undefined;
			}
		}
		
		/**
		 * Loads a JSON file and returns the object.
		 */
		async function loadSamples() {
			
			let response = await fetch('formulas/sampleEquations.json');
			return await response.json();
		}
		
		if (!from.haveSamples && !getSamplesNode(from, "Samples")) {
			
			let samples = await loadSamples();
			samples = getSamplesNode(samples, "Samples");
			from.children.push(samples)
			from.haveSamples = true;
		}
		return from;
	}

	/**
	 * Sort routine. Sorts the whole category tree.
	 * 
	 * Folders first, then leafs. Alphabetically in ascending order.
	 * This alternative uses *traverse*.
	 * 
	 * @param order - the order. 'asc' for ascending 
	 */
	sort(order) {
		let inst = this;
		let tree = inst.tree;		
		order = order || 'asc';
		
		this.traverse(function(node) {
			let nodes = node.children;
			if (nodes) {
				_sort(nodes);
			}
		});
		
		tree.tree('loadData', [ this.customEquations ]);
		
		function _sort(nodes){
			nodes.sort(function(r1, r2) {
				
				let sortFunc = function(a, b) {
					return a == b ? 0 : (a > b ? 1 : -1);
				};

				let isLeaf1 = inst.isLeaf(r1);
				let isLeaf2 = inst.isLeaf(r2);
				console.debug(`Leaf Test: ${r1.text}:${isLeaf1}, ${r2.text}:${isLeaf2}`)
				if (isLeaf1 != isLeaf2) {
					return (isLeaf1 ? 1 : -1) * (order == 'asc' ? 1 : -1);
				}
				return sortFunc(r1.text, r2.text) * (order == 'asc' ? 1 : -1);
			});
		}
	}
	
	/**
	 * Expands the whole category tree. Empty folders are left closed.
	 */
	expandAlt() {
		let inst = this;
		this.traverse(function(row) {
			if (!inst.tree.tree('isLeaf', row.target)) {
				let children = row.children;
				inst.openFolder(row, children && children.length);
			}
		});
	}
	
	/**
	 * Correct the Folder icons of the whole tree.
	 */
	correctIcons() {
		let inst = this;
		this.traverse(function(node) {
			if (!inst.tree.tree('isLeaf', node.target)) {
				inst.correctIcon(node);
			}
		});
	}
	
	/**
	 * Correct the Folder icon of a single node.
	 */
	correctIcon(node) {
		this.findNode(node);									// seems to be essential to get target
		let icon = $(node.target).find('.tree-icon');
		if (icon.hasClass('tree-file')) {
			icon
			.removeClass('tree-file')
			.addClass('tree-folder');
			icon.prev()
			.removeClass('tree-indent')
			.addClass('tree-hit')
			.addClass('tree-collapsed');
			
			console.debug(`correctIcon for ${node.text} `);			
		}
		if (icon.hasClass('tree-folder')) {
			console.debug(`correctIcon for ${node.text} already has class 'tree-folder' `);
		}
	}
	
	/**
	 * Traverses the categories tree.
	 * 
	 * For each node in tree invokes the given function with the given arguments.
	 * 
	 * @param func - given function
	 * @param args - arguments for function to modify its behavior
	 */
	traverse(func, ...args) {
		let inst = this;
		let nodes = inst.tree.tree('getRoots');
		_traverse(nodes, ...args);

		function _traverse(nodes, ...args) {
			for (let node of nodes) {
				inst.findNode(node);
				func(node, ...args);
				let children = node.children;
				if (children && children.length) {
					_traverse(children, ...args);
				}
			}
		}
	}
	
	/**
	 * Given a node in the tree, determines and returns the path string.
	 * 
	 * This serves the purpose to provide a better way to characterize the current 
	 * selection.
	 * 
	 * @param node - a node of the tree
	 * @returns the path string belonging to that node 
	 */
	pathFromNode(node) {
		let current = node;
		let path = '';
		while(current !== null) {
			path = `/${current.text}${path}`;
			current = this.getParent(current);
		}
		
		console.debug(`CategoriesTree : pathFromNode : ${path} `);
		return path;
	}
	
	/**
	 * Given the path string, determines and returns the appropriate node.
	 * 
	 * @param {string} path - the path of a node in the tree
	 * @returns the node belonging to that path or null
	 */
	nodeFromPath(path) {
		
		let pathComponents = path.split('/').slice(1);
		let rest = pathComponents;
		let first = null;
		
		let node = null;
		let nodes = this.tree.tree('getRoots');
		return _traverse(nodes);

		function _traverse(nodes) {
			
			first = rest[0];
			rest = rest.slice(1);

			for (let node of nodes) {
				if (node.text === first) {
					if (rest.length === 0)
						return node;
					
					let children = node.children;
					if (children && children.length) {
						return _traverse(children);
					}
				}
			}
			
			return null;
		}
	}
	
	/**
	 * Renumbers the ids of the nodes on tree to unique ones.
	 */
	renumberIds() {
		let id = 1;
		this.traverse(function(node) {
			node.id = id++;
		});
	}
	
	/**
	 * Returns the first free id of the node ids.
	 */
	get freeId() {
		let id = 0;
		this.traverse(function(node) {
			if (node.id > id) id = node.id;
		});
		return id + 1;
	}
	
	/**
	 * Opens or closes a folder.
	 * 
	 * @param node - the folder node
	 * @param open - the target state, true for open
	 */
	openFolder(node, open) {
		this.findNode(node);										// seems to be essential to get target
		let isLeaf = this.tree.tree('isLeaf', node.target);
		if (isLeaf) {
			return;
		}
		if (open) {
			this.tree.tree('expand', node.target);
			node.state = 'open';
			console.debug(`openFolder true : ${node.text} `);			
		} else {
			this.tree.tree('collapse', node.target);
			node.state = 'closed';
			console.debug(`openFolder false : ${node.text} `);			
		}
	}
	
	/**
	 * Determines the parent of the given node.
	 */
	getParent(node) {
		this.findNode(node);										// seems to be essential to get target
		let parent = this.tree.tree('getParent', node.target);
		return parent;
	}

	/**
	 * Checks the given node if it is a leaf node.
	 */	
	isLeaf(node) {
		this.findNode(node);										// seems to be essential to get target
		let isLeaf = this.tree.tree('isLeaf', node.target);
		return isLeaf;
	}

	/**
	 * Finds a node in the tree given an origin node object.
	 * 
	 * @param node - origin node
	 */
	findNode(node) {
		if ('id' in node)
			return this.tree.tree('find', { text: node.text, id: node.id });
		else
			return this.tree.tree('find', { text: node.text });
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { CategoriesTree };
} catch(e) { }
