
/**
 * @abstract Manages the Categories Tree.
 */
class CategoriesTree {
	
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
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		this.treeSelector = `#categories`;
		this._tree = $(this.treeSelector);
		this.nodeSelected = new Observable();		
		this.treeChanged = new Observable();
		this.treeInitialise();
	}
	
	/**
	 * @abstract Returns the tree jquery object.
	 */
	get tree() {
		return this._tree;
	}
	
	/**
	 * @abstract The Custom Equations setter.
	 * 
	 * The whole data set, JSON compatible, with categories and equations.
	 */
	set customEquations(value) {
		this.data = this.convert(value);
		this.initialise();							// it is essential to invoke it here before currentEquations 
	}
	
	/**
	 * @abstract The Custom Equations getter.
	 * 
	 * The whole data set, JSON compatible, with categories and equations.
	 */
	get customEquations() {
		return this.data;
	}
	
	/**
	 * @abstract A Proxy of the Custom Equations data.
	 * 
	 * This is capable of being serialized over JSON.
	 */
	get customEquationsProxy() {
		var inst = this;
		var rows = [ inst.data ];
		return _proxy(rows);
		
		/**
		 * @abstract Copy a single node with relevant data.
		 */
		function _copy(from) {
			var keys = ['text', 'state', 'attributes', 'selected'];
			var to = { };
			for (var key of Object.keys(from)) {
				if (keys.includes(key)) {
					to[key] = from[key];
				}
			}
			if (inst.tree.tree('isLeaf', from.target)) {
				to.iconCls = 'tree-file';
			} else {
				to.iconCls = 'tree-folder';
			}
			to.children = [ ];
			
			return to;
		}

		/**
		 * @abstract Proxy an array of nodes.
		 */
		function _proxy(rows, parent = null) {
			var targetRows = [ ];
			for (var row of rows) {
				var targetRow = _copy(row);
				targetRows.push(targetRow);
				if (parent != null) {
					parent.children.push(targetRow);
				}
				var children = row.children;
				if (children && children.length) {
					_proxy(children, targetRow);
				}
			}
			
			return targetRows[0];
		}		
	}
	
	/**
	 * @abstract The Current Equations setter as for the current selected category.
	 */
	set currentEquations(value) {
		if (this.currentLeaf != null) {
			try {
				if (this.currentLeaf.attributes === undefined) {
					this.currentLeaf.attributes = { };
				}
				this.currentLeaf.attributes.equations = value;
			} catch(e) {
			}
		}
	}
	
	/**
	 * @abstract The Current Equations getter as for the current selected category.
	 */
	get currentEquations() {
		if (this.currentLeaf == null) {
			this.currentLeaf = 
				this.tree
				.tree('find', { text: 'Default'});
		}
		try {
			return this.currentLeaf.attributes.equations;
		} catch(e) {
			return [];
		}
	}
	
	/**
	 * @abstract One time initialization of the *tree* extension. 
	 */
	treeInitialise() {
		var inst = this;
		$.extend($.fn.tree.methods, {
			/**
			 * @abstract Extension of tree methods with sort functionality.
			 */
			sort: function(jq, order) {
				return jq.each(function() {
					// inst.sort.bind(inst)(this, order);
					inst.sort2.bind(inst)(order);
				});
			},
			
			isLeafDefault: $.fn.tree.methods.isLeaf,
			
			/**
			 * @abstract Extension (replacement) of tree methods with custom *isLeaf* method.
			 */
			isLeaf: function(jq, target) {
				return (function() {
					var node = $(jq[0]).tree('getNode', target);
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
	 * @abstract Initialise routine. Part of the Custom Equations setter.
	 */
	initialise() {
		var inst = this;

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
				var isLeaf = $(this).tree('isLeaf', target);
				updateDndIcon(!isLeaf);
			},
			/*
			*/
			onDragOver: function(target, source) {
				console.debug(`onDragOver `);
				var isLeaf = $(this).tree('isLeaf', target);
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
				var isLeaf = $(this).tree('isLeaf', target);

				var targetNode = $(this).tree('getNode', target);
				inst.openFolder(targetNode, false);
				inst.openFolder(targetNode, true);

				inst.dropSourceParent = inst.getParent(source);

				console.debug(`onBeforeDrop target is Leaf ${isLeaf} `);
				return !isLeaf;
			},
			onDrop: function(target, source, point) {
				var targetNode = $(this).tree('getNode', target);
				inst.openFolder(targetNode, false);
				inst.openFolder(targetNode, true);
				
				if (!inst.dropSourceParent.children || inst.dropSourceParent.children.length == 0) {
					inst.openFolder(inst.dropSourceParent, false);
					inst.correctIcon(inst.dropSourceParent);
				}				
				console.debug(`onDrop dropping ${source.text} `);
			},
			onBeforeSelect: function(node) {
				var isLeaf = $(this).tree('isLeaf', node.target);
				return isLeaf;
			},
			onSelect: function(node) {
				var isLeaf = $(this).tree('isLeaf', node.target);
				if (isLeaf) {
					inst.previousLeaf = inst.currentLeaf;
					inst.currentLeaf = node;
					inst.customEquations.selected = node.text;
					inst.nodeSelected.notify(inst.previousLeaf, node);
				} else {
					
				}
			},
			onDblClick: function(node) {
				$(this).tree('beginEdit', node.target);				
			},
			onContextMenu: inst.onContextMenu.bind(inst),
			onLoadSuccess: inst.onLoadSuccess.bind(inst)
		})
		.tree('loadData', [ this.customEquations ])
		.tree('sort', 'asc');
		this.expandAlt();

		var nodeText = 'Default';
		if (this.customEquations.selected !== undefined) {
			nodeText = this.customEquations.selected;
		}
		var node = this.tree
		.tree('find', { text: nodeText });
		if (node != null) {
			this.tree.tree('select', node.target)			
		}
		
		console.dir(this.data);
	}
	
	/**
	 * @abstract The context menu of the tree nodes.
	 */
	onContextMenu(e, node) {
		var inst = this;

		function remove() {
			var nodeParent = inst.getParent(node);
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
							.tree('append', { parent: node.target, data: [{ text: 'Folder-1', state: 'closed', children: [] }] });
							inst.expandAlt();
							// .tree('expandAll', node.target); 
							break;
						case "mAppendCategory":
							inst.tree
							.tree('collapseAll', node.target)
							.tree('append', { parent: node.target, data: [{ text: 'Category-1', attributes: {} }] });
							inst.expandAlt();
							// .tree('expandAll', node.target); 
							break;
						case "mRemove":
							remove();
							break;
					}
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
					}
				}
			})
			.menu('show', {						// display context menu
				left: e.pageX,
				top: e.pageY
			});
		}
	}
	
	onLoadSuccess() {
		console.debug(`onLoadSuccess`);
		var inst = this;
		inst.tree
		.find('.tree-node')
		.each(function() {
			var opts = $(this)
			.droppable({ accept: 'div.tree-node, div.datagrid-div' })
			.droppable('options');			
			console.debug(`Found tree node with accept: ${opts.accept} `);

			$(this)
			.droppable('disable')
			.droppable('enable');
			
			var onDragEnter = opts.onDragEnter;
			var onDragOver = opts.onDragOver;
			var onDragLeave = opts.onDragLeave;
			var onDrop = opts.onDrop;
			var onBeforeDrop = opts.onBeforeDrop;
			
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
	 * @abstract Converts the Custom Equations from old to new format.
	 * 
	 * The old format has only a single equations set and no category information.
	 * 
	 * @param from - custom equations inn old or new format
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
	 * @abstract Sort routine. Sorts the whole category tree.
	 * 
	 * Folders first, then leafs. Alphabetically in ascending order.
	 * 
	 * @param target - the jquery tree object
	 * @param order - the order. 'asc' for ascending 
	 */
	sort(target, order) {
		var inst = this;
		order = order || 'asc';
		var rows = $(target).tree('getRoots');
		_sort(rows);
		$(target).tree('loadData', rows);
		
		function _sort(rows){
			rows.sort(function(r1, r2) {
				
				var sortFunc = function(a, b) {
					return a == b ? 0 : (a > b ? 1 : -1);
				};

				var isLeaf1 = inst.isLeaf(r1);
				var isLeaf2 = inst.isLeaf(r2);
				console.debug(`Leaf Test: ${r1.text}:${isLeaf1}, ${r2.text}:${isLeaf2}`)
				if (isLeaf1 != isLeaf2) {
					return (isLeaf1 ? 1 : -1) * (order == 'asc' ? 1 : -1);
				}
				return sortFunc(r1.text, r2.text) * (order == 'asc' ? 1 : -1);
			});
			
			for (var i = 0; i < rows.length; i++) {
				var children = rows[i].children;
				if (children && children.length) {
					_sort(children);
				}
			}
		}
	}

	/**
	 * @abstract Sort routine. Sorts the whole category tree.
	 * 
	 * Folders first, then leafs. Alphabetically in ascending order.
	 * This alternative uses *traverse*.
	 * 
	 * @param target - the jquery tree object
	 * @param order - the order. 'asc' for ascending 
	 */
	sort2(order) {
		var inst = this;
		var tree = inst.tree;		
		order = order || 'asc';
		
		this.traverse(function(node) {
			var nodes = node.children;
			if (nodes) {
				_sort(nodes);
			}
		});
		
		tree.tree('loadData', [ this.customEquations ]);
		
		function _sort(nodes){
			nodes.sort(function(r1, r2) {
				
				var sortFunc = function(a, b) {
					return a == b ? 0 : (a > b ? 1 : -1);
				};

				var isLeaf1 = inst.isLeaf(r1);
				var isLeaf2 = inst.isLeaf(r2);
				console.debug(`Leaf Test: ${r1.text}:${isLeaf1}, ${r2.text}:${isLeaf2}`)
				if (isLeaf1 != isLeaf2) {
					return (isLeaf1 ? 1 : -1) * (order == 'asc' ? 1 : -1);
				}
				return sortFunc(r1.text, r2.text) * (order == 'asc' ? 1 : -1);
			});
		}
	}
	
	/**
	 * @abstract Expands the whole category tree. Empty folders are left closed.
	 */
	expandAlt() {
		var inst = this;
		this.traverse(function(row) {
			if (!inst.tree.tree('isLeaf', row.target)) {
				var children = row.children;
				inst.openFolder(row, children && children.length);
			}
		});
	}
	
	/**
	 * @abstract Correct the Folder icons of the whole tree.
	 */
	correctIcons() {
		var inst = this;
		this.traverse(function(node) {
			if (!inst.tree.tree('isLeaf', node.target)) {
				inst.correctIcon(node);
			}
		});
	}
	
	/**
	 * @abstract Correct the Folder icon of a single node.
	 */
	correctIcon(node) {
		var node2 = this.tree.tree('find', { text: node.text });		// seems to be essential to get target
		var icon = $(node.target).find('.tree-icon');
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
	 * @abstract Traverses the categories tree.
	 * 
	 * For each node in tree invokes the given function with the given arguments.
	 * 
	 * @param func - given function
	 * @param args - arguments for function to modify its behavior
	 */
	traverse(func, ...args) {
		var inst = this;
		var rows = inst.tree.tree('getRoots');
		_traverse(rows, ...args);

		function _traverse(rows, ...args) {
			for (var row of rows) {
				inst.tree.tree('find', { text: row.text });
				console.debug(`Traversing : row : ${row.text}, state : ${row.state}, isLeaf : ${inst.tree.tree('isLeaf', row.target)} `);
				func(row, ...args);
				var children = row.children;
				if (children && children.length) {
					_traverse(children, ...args);
				}
			}
		}
	}
	
	/**
	 * @abstract Opens or closes a folder.
	 * 
	 * @param node - the folder node
	 * @param open - the target state, true for open
	 */
	openFolder(node, open) {
		var node2 = this.tree.tree('find', { text: node.text });		// seems to be essential to get target
		var isLeaf = this.tree.tree('isLeaf', node.target);
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
	 * @abstract Determines the parent of the given node.
	 */
	getParent(node) {
		var tree = this.tree;
		var node2 = tree.tree('find', { text: node.text });				// seems to be essential to get target
		var parent = tree.tree('getParent', node.target);
		return parent;
	}

	/**
	 * @abstract Checks the given node if it is a leaf node.
	 */	
	isLeaf(node) {
		var tree = this.tree;
		var node2 = tree.tree('find', { text: node.text });				// seems to be essential to get target
		var isLeaf = tree.tree('isLeaf', node.target);
		return isLeaf;
	}
}
