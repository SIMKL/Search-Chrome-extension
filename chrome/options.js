// options.js

// Ensure that defaults.js is included before options.js in options.html
// This makes `generateId` and `getDefaultMenuItems` available globally

let menuItems = [];
let debounceTimer;

// Define the available query encoding formats
const queryFormats = [
  { value: 'encodeURIComponent', label: 'Encode URI Component (%20)' },
  { value: 'plus', label: 'Replace spaces with +' },
  { value: 'dash', label: 'Replace spaces with -' },
  { value: 'none', label: 'No encoding (spaces as is)' }
];

/**
 * Debounce function to limit the rate of function calls.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedSaveMenuItems = debounce(saveMenuItems, 500);

/**
 * Initializes the Options Page once the DOM is fully loaded.
 * Sets up event listeners and initializes UI components.
 */
document.addEventListener('DOMContentLoaded', () => {
  loadMenuItems();

  // Event listeners for buttons
  document.getElementById('add-search-engine').addEventListener('click', addSearchEngineToMain);
  document.getElementById('add-group').addEventListener('click', addGroup);
  document.getElementById('add-global-separator').addEventListener('click', addSeparatorToMain);
  document.getElementById('export-settings').addEventListener('click', exportSettings);
  document.getElementById('import-settings').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  document.getElementById('import-file-input').addEventListener('change', importSettings);
  document.getElementById('sync-to-chrome').addEventListener('click', syncToChrome);
  document.getElementById('import-from-chrome').addEventListener('click', importFromChrome);
  document.getElementById('restore-defaults').addEventListener('click', restoreDefaults);
});

/**
 * Loads menu items from local storage or sets default items if none exist.
 */
function loadMenuItems() {
  chrome.storage.local.get(['menuItems'], (result) => {
    if (chrome.runtime.lastError) {
      console.error(`Error accessing storage: ${chrome.runtime.lastError.message}`);
      menuItems = getDefaultMenuItems();
      saveMenuItems();
      renderMenuItems();
      return;
    }

    if (result.menuItems && result.menuItems.length > 0) {
      menuItems = result.menuItems;
    } else {
      // Load defaults if no menu items are saved
      menuItems = getDefaultMenuItems();
      chrome.storage.local.set({ menuItems }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error setting default menu items: ${chrome.runtime.lastError.message}`);
          return;
        }
        // Notify background script to update context menus
        chrome.runtime.sendMessage({ action: 'updateContextMenus' });
      });
    }

    // Ensure each item has an ID
    ensureItemIds();
    renderMenuItems();
  });
}

/**
 * Renders the menu items (both top-level items and groups) in the options page.
 */
function renderMenuItems() {
  const menuList = document.getElementById('menu-list');
  menuList.innerHTML = '';

  menuItems.forEach((item, itemIndex) => {
    if (item.type === 'group') {
      renderGroup(item, itemIndex, menuList);
    } else if (item.type === 'search' || item.type === 'separator') {
      renderMenuItem(item, itemIndex, menuList);
    }
  });

  // Initialize Sortable for Main Menu List
	new Sortable(menuList, {
	  group: {
		name: 'mainMenu',
		put: ['groupItems'] // Allow items from groupItems to be dropped into the main menu
	  },
	  animation: 150,
	  handle: '.drag-handle',
	  fallbackOnBody: true,
	  swapThreshold: 0.65,
	  onMove: (evt) => {
		const draggedItem = evt.dragged;
		const draggedItemId = draggedItem.getAttribute('data-id');
		const movedItem = menuItems.find(item => item.id === draggedItemId);

		if (movedItem && movedItem.type === 'group') {
		  const toGroup = evt.to.closest('.group-item');
		  if (toGroup) {
			return false; // Prevent group nesting
		  }
		}
	  },
	  onEnd: (evt) => {
		// Update the menuItems data structure
		const oldIndex = evt.oldIndex;
		const newIndex = evt.newIndex;
		const [movedItem] = menuItems.splice(oldIndex, 1);
		menuItems.splice(newIndex, 0, movedItem);
		debouncedSaveMenuItems();
	  }
	});

}

/**
 * Renders a group and its items.
 */
function renderGroup(group, groupIndex, parentElement) {
  // Create parent <li> for the group
  const groupItem = document.createElement('li');
  groupItem.className = 'group-item menu-item';
  groupItem.setAttribute('data-id', group.id);

  // Create group header
  const groupHeader = document.createElement('div');
  groupHeader.className = 'collection-item group-header';

  // Drag handle for the group
  const dragHandle = document.createElement('i');
  dragHandle.className = 'material-icons drag-handle';
  dragHandle.textContent = 'drag_indicator';
  groupHeader.appendChild(dragHandle);

  // Group name input
  const groupNameInput = document.createElement('input');
  groupNameInput.type = 'text';
  groupNameInput.value = group.name;
  groupNameInput.placeholder = 'Group Name';
  groupNameInput.className = 'validate';
  groupNameInput.addEventListener('input', (e) => {
    group.name = e.target.value;
    debouncedSaveMenuItems();
  });

  // Add Search Engine button
  const addEngineBtn = document.createElement('a');
  addEngineBtn.href = '#';
  addEngineBtn.className = 'btn-floating btn-small waves-effect waves-light teal';
  addEngineBtn.innerHTML = '<i class="material-icons">add</i>';
  addEngineBtn.title = 'Add Search Engine';
  addEngineBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addSearchEngineToGroup(group.id);
  });

  // Add Separator button
  const addSeparatorBtn = document.createElement('a');
  addSeparatorBtn.href = '#';
  addSeparatorBtn.className = 'btn-floating btn-small waves-effect waves-light grey';
  addSeparatorBtn.innerHTML = '<i class="material-icons">remove</i>';
  addSeparatorBtn.title = 'Add Separator';
  addSeparatorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addSeparatorToGroup(group.id);
  });

  // Delete group button
  const deleteGroupBtn = document.createElement('a');
  deleteGroupBtn.href = '#';
  deleteGroupBtn.className = 'btn-floating btn-small waves-effect waves-light red';
  deleteGroupBtn.innerHTML = '<i class="material-icons">delete</i>';
  deleteGroupBtn.title = 'Delete Group';
  deleteGroupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete the group "${group.name}"? This will remove all its items.`)) {
      menuItems.splice(groupIndex, 1);
      saveMenuItems();
      renderMenuItems();
      M.toast({ html: 'Group deleted.', classes: 'teal' });
    }
  });

  // Collapse/Expand button
  const collapseBtn = document.createElement('a');
  collapseBtn.href = '#';
  collapseBtn.className = 'btn-floating btn-small waves-effect waves-light light-blue';
  collapseBtn.innerHTML = '<i class="material-icons">expand_less</i>';
  collapseBtn.title = 'Collapse/Expand Group';
  collapseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const groupItemsList = groupItem.querySelector('.nested-list');
    if (groupItemsList.style.display === 'none') {
      groupItemsList.style.display = 'block';
      collapseBtn.innerHTML = '<i class="material-icons">expand_less</i>';
    } else {
      groupItemsList.style.display = 'none';
      collapseBtn.innerHTML = '<i class="material-icons">expand_more</i>';
    }
  });

  // Append elements to group header
  groupHeader.appendChild(groupNameInput);
  groupHeader.appendChild(addEngineBtn);
  groupHeader.appendChild(addSeparatorBtn);
  groupHeader.appendChild(deleteGroupBtn);
  groupHeader.appendChild(collapseBtn);

  // Append groupHeader to groupItem
  groupItem.appendChild(groupHeader);

  // Create nested list for group's items
  const groupItemsList = document.createElement('ul');
  groupItemsList.className = 'collection nested-list';
  groupItemsList.setAttribute('data-group-id', group.id);

	// Initialize Sortable for group's items
	new Sortable(groupItemsList, {
	  group: {
		name: 'groupItems',
		put: (to) => {
		  // Allow only individual items (not groups) to be dropped into groups
		  const fromItem = to.el.closest('.group-item');
		  if (fromItem) {
			return false; // Prevent dropping groups into other groups
		  }
		  return ['mainMenu', 'groupItems']; // Allow items from the main menu and other group items
		}
	  },
	  animation: 150,
	  handle: '.drag-handle',
	  fallbackOnBody: true,
	  swapThreshold: 0.65,
	  onMove: (evt) => {
		const draggedItem = evt.dragged;
		const draggedItemId = draggedItem.getAttribute('data-id');
		const movedItem = menuItems.find(item => item.id === draggedItemId);

		if (movedItem && movedItem.type === 'group') {
		  return false; // Prevent groups from being dragged into groups
		}
	  },
	  onEnd: (evt) => {
		// Update the menuItems data structure
		const oldGroupId = evt.from.getAttribute('data-group-id');
		const newGroupId = evt.to.getAttribute('data-group-id');

		let movedItem;
		if (oldGroupId) {
		  const oldGroup = menuItems.find(item => item.id === oldGroupId);
		  [movedItem] = oldGroup.items.splice(evt.oldIndex, 1);
		} else {
		  [movedItem] = menuItems.splice(evt.oldIndex, 1);
		}

		if (newGroupId) {
		  const newGroup = menuItems.find(item => item.id === newGroupId);
		  newGroup.items.splice(evt.newIndex, 0, movedItem);
		} else {
		  menuItems.splice(evt.newIndex, 0, movedItem);
		}

		debouncedSaveMenuItems();
	  }
	});



  // Render group's items
  group.items.forEach((item, itemIndex) => {
    renderMenuItem(item, itemIndex, groupItemsList, group.id);
  });

  // Append groupItemsList to groupItem
  groupItem.appendChild(groupItemsList);

  // Append groupItem to parent element
  parentElement.appendChild(groupItem);
}

/**
 * Renders a menu item (search engine or separator).
 */
function renderMenuItem(item, itemIndex, parentElement, groupId = null) {
  if (item.type === 'separator') {
    const separatorItem = document.createElement('li');
    separatorItem.className = 'collection-item separator-item menu-item';
    separatorItem.setAttribute('data-id', item.id);

    // Drag handle
    const dragHandle = document.createElement('i');
    dragHandle.className = 'material-icons drag-handle';
    dragHandle.textContent = 'drag_indicator';
    separatorItem.appendChild(dragHandle);

    separatorItem.appendChild(document.createTextNode(item.name));

    // Delete separator button
    const deleteSeparatorBtn = document.createElement('a');
    deleteSeparatorBtn.href = '#';
    deleteSeparatorBtn.className = 'btn-flat btn-small waves-effect waves-light right';
    deleteSeparatorBtn.innerHTML = '<i class="material-icons">delete</i>';
    deleteSeparatorBtn.title = 'Delete Separator';
    deleteSeparatorBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm(`Are you sure you want to delete this separator?`)) {
        if (groupId) {
          const group = menuItems.find(g => g.id === groupId);
          group.items.splice(itemIndex, 1);
        } else {
          menuItems.splice(itemIndex, 1);
        }
        saveMenuItems();
        renderMenuItems();
        M.toast({ html: 'Separator deleted.', classes: 'teal' });
      }
    });

    separatorItem.appendChild(deleteSeparatorBtn);

    parentElement.appendChild(separatorItem);
    return;
  }

  const itemElement = document.createElement('li');
  itemElement.className = 'collection-item search-engine-item menu-item';
  itemElement.setAttribute('data-id', item.id);

  // Drag handle
  const dragHandle = document.createElement('i');
  dragHandle.className = 'material-icons drag-handle';
  dragHandle.textContent = 'drag_indicator';
  itemElement.appendChild(dragHandle);

  // Name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = item.name;
  nameInput.placeholder = 'Engine Name';
  nameInput.className = 'validate';
  nameInput.addEventListener('input', (e) => {
    item.name = e.target.value;
    debouncedSaveMenuItems();
  });
  itemElement.appendChild(nameInput);

  // URL input
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.value = item.url;
  urlInput.placeholder = 'Search URL';
  urlInput.className = 'validate';
  urlInput.addEventListener('input', (e) => {
    item.url = e.target.value;
    debouncedSaveMenuItems();
  });
  itemElement.appendChild(urlInput);

  // Query Format select
  const selectWrapper = document.createElement('div');
  selectWrapper.className = 'input-field';

  const encodingSelect = document.createElement('select');
  encodingSelect.className = 'materialize-select';
  encodingSelect.value = item.queryEncoding;
  encodingSelect.addEventListener('change', (e) => {
    item.queryEncoding = e.target.value;
    debouncedSaveMenuItems();
  });

  queryFormats.forEach(format => {
    const option = document.createElement('option');
    option.value = format.value;
    option.textContent = format.label;
    if (item.queryEncoding === format.value) {
      option.selected = true;
    }
    encodingSelect.appendChild(option);
  });

  // Create label for select
  const selectLabel = document.createElement('label');
  selectLabel.textContent = 'Query Encoding';

  // Append select and label to selectWrapper
  selectWrapper.appendChild(encodingSelect);
  selectWrapper.appendChild(selectLabel);

  // Append selectWrapper to itemElement
  itemElement.appendChild(selectWrapper);

  // Initialize Materialize Select AFTER adding to DOM
  setTimeout(() => {
    M.FormSelect.init(encodingSelect);
  }, 0);

  // Delete item button
  const deleteItemBtn = document.createElement('a');
  deleteItemBtn.href = '#';
  deleteItemBtn.className = 'btn-flat btn-large delete';
  deleteItemBtn.innerHTML = '<i class="material-icons">delete</i>';
  deleteItemBtn.title = 'Delete Search Engine';
  deleteItemBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      if (groupId) {
        const group = menuItems.find(g => g.id === groupId);
        group.items.splice(itemIndex, 1);
      } else {
        menuItems.splice(itemIndex, 1);
      }
      saveMenuItems();
      renderMenuItems();
      M.toast({ html: 'Item deleted.', classes: 'teal' });
    }
  });

  itemElement.appendChild(deleteItemBtn);

  parentElement.appendChild(itemElement);
}

/**
 * Adds a new search engine to the main menu.
 */
function addSearchEngineToMain() {
  const newEngine = {
    id: generateId(),
    name: 'New Engine',
    url: 'https://example.com/search?q=%s',
    queryEncoding: 'encodeURIComponent',
    type: 'search'
  };
  menuItems.push(newEngine);
  saveMenuItems();
  renderMenuItems();
  M.toast({ html: 'New search engine added to main menu.', classes: 'teal' });
}

/**
 * Adds a new search engine to a specified group.
 * @param {string} groupId - The ID of the group to add the search engine to.
 */
function addSearchEngineToGroup(groupId) {
  const group = menuItems.find(g => g.id === groupId);
  if (group) {
    const newEngine = {
      id: generateId(),
      name: 'New Engine',
      url: 'https://example.com/search?q=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    };
    group.items.push(newEngine);
    saveMenuItems();
    renderMenuItems();
    M.toast({ html: 'New search engine added to group.', classes: 'teal' });
  } else {
    M.toast({ html: 'Group not found.', classes: 'red' });
  }
}

/**
 * Adds a new group.
 */
function addGroup() {
  const newGroup = {
    id: generateId(),
    name: 'New Group',
    type: 'group',
    items: []
  };
  menuItems.push(newGroup);
  saveMenuItems();
  renderMenuItems();
  M.toast({ html: 'New group added.', classes: 'teal' });
}

/**
 * Adds a separator to the main menu.
 */
function addSeparatorToMain() {
  if (menuItems.length > 0 && menuItems[menuItems.length - 1].type === 'separator') {
    M.toast({ html: 'Cannot add multiple consecutive separators.', classes: 'red' });
    return;
  }

  const separator = {
    id: generateId(),
    name: '--- Separator ---',
    type: 'separator'
  };
  menuItems.push(separator);
  saveMenuItems();
  renderMenuItems();
  M.toast({ html: 'Separator added to main menu.', classes: 'teal' });
}

/**
 * Adds a separator to a specified group.
 * @param {string} groupId - The ID of the group to add the separator to.
 */
function addSeparatorToGroup(groupId) {
  const group = menuItems.find(g => g.id === groupId);
  if (group) {
    if (group.items.length > 0 && group.items[group.items.length - 1].type === 'separator') {
      M.toast({ html: 'Cannot add multiple consecutive separators.', classes: 'red' });
      return;
    }

    const separator = {
      id: generateId(),
      name: '--- Separator ---',
      type: 'separator'
    };
    group.items.push(separator);
    saveMenuItems();
    renderMenuItems();
    M.toast({ html: 'Separator added to group.', classes: 'teal' });
  } else {
    M.toast({ html: 'Group not found.', classes: 'red' });
  }
}

/**
 * Saves the current menu items to local storage and notifies the background script.
 */
function saveMenuItems() {
  chrome.storage.local.set({ menuItems }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Error saving menu items: ${chrome.runtime.lastError.message}`);
      return;
    }
    // Notify background script to update context menus
    chrome.runtime.sendMessage({ action: 'updateContextMenus' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`Error sending message to background script: ${chrome.runtime.lastError.message}`);
      } else {
        console.log(response.status);
      }
    });
  });
}

/**
 * Ensures each item has a unique ID.
 * Generates new IDs for items without one or with duplicate IDs.
 */
function ensureItemIds() {
  let updated = false;
  const existingIds = new Set();

  menuItems.forEach((item) => {
    if (!item.id || existingIds.has(item.id)) {
      item.id = generateId();
      updated = true;
    }
    existingIds.add(item.id);

    if (item.type === 'group' && item.items) {
      item.items.forEach((subItem) => {
        if (!subItem.id || existingIds.has(subItem.id)) {
          subItem.id = generateId();
          updated = true;
        }
        existingIds.add(subItem.id);
      });
    }
  });

  if (updated) {
    chrome.storage.local.set({ menuItems }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error updating menu items with new IDs: ${chrome.runtime.lastError.message}`);
        return;
      }
      createContextMenus(); // Recreate context menus with updated IDs
    });
  }
}

/**
 * Exports the current settings to a JSON file.
 */
function exportSettings() {
  const dataStr = JSON.stringify(menuItems, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'simkl_search_settings.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  M.toast({ html: 'Settings exported successfully!', classes: 'teal' });
}

/**
 * Imports settings from a JSON file.
 * @param {Event} event - The file input change event.
 */
function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedItems = JSON.parse(e.target.result);
      if (Array.isArray(importedItems)) {
        // Validate and merge imported items
        menuItems = importedItems.map((item) => {
          if (!item.id) item.id = generateId();
          if (!item.name) item.name = 'Unnamed Item';

          if (item.type === 'group') {
            if (!item.items || !Array.isArray(item.items)) item.items = [];
            item.items = item.items.map((subItem) => {
              if (!subItem.id) subItem.id = generateId();
              if (!subItem.name) subItem.name = 'Unnamed Item';
              if (!subItem.type) subItem.type = 'search';
              if (subItem.type === 'search' && !subItem.url) subItem.url = 'https://example.com/search?q=%s';
              if (!subItem.queryEncoding) subItem.queryEncoding = 'encodeURIComponent';
              return subItem;
            });
          } else if (item.type === 'search') {
            if (!item.url) item.url = 'https://example.com/search?q=%s';
            if (!item.queryEncoding) item.queryEncoding = 'encodeURIComponent';
          }

          return item;
        });
        saveMenuItems();
        renderMenuItems();
        M.toast({ html: 'Settings imported successfully!', classes: 'teal' });
      } else {
        throw new Error('Invalid format');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      M.toast({ html: 'Failed to import settings. Invalid file format.', classes: 'red' });
    }
  };
  reader.readAsText(file);

  // Reset the file input value to allow re-importing the same file if needed
  event.target.value = '';
}

/**
 * Manually syncs settings to chrome.storage.sync.
 */
function syncToChrome() {
  chrome.storage.sync.set({ menuItems }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Error syncing to Chrome Sync: ${chrome.runtime.lastError.message}`);
      M.toast({ html: 'Failed to sync to Chrome Sync.', classes: 'red' });
      return;
    }
    M.toast({ html: 'Settings synced to Chrome Sync!', classes: 'teal' });
  });
}

/**
 * Manually imports settings from chrome.storage.sync.
 */
function importFromChrome() {
  chrome.storage.sync.get(['menuItems'], (result) => {
    if (chrome.runtime.lastError) {
      console.error(`Error accessing Chrome Sync storage: ${chrome.runtime.lastError.message}`);
      M.toast({ html: 'Failed to import from Chrome Sync.', classes: 'red' });
      return;
    }

    if (result.menuItems && Array.isArray(result.menuItems)) {
      menuItems = result.menuItems.map((item) => {
        if (!item.id) item.id = generateId();
        if (!item.name) item.name = 'Unnamed Item';

        if (item.type === 'group') {
          if (!item.items || !Array.isArray(item.items)) item.items = [];
          item.items = item.items.map((subItem) => {
            if (!subItem.id) subItem.id = generateId();
            if (!subItem.name) subItem.name = 'Unnamed Item';
            if (!subItem.type) subItem.type = 'search';
            if (subItem.type === 'search' && !subItem.url) subItem.url = 'https://example.com/search?q=%s';
            if (!subItem.queryEncoding) subItem.queryEncoding = 'encodeURIComponent';
            return subItem;
          });
        } else if (item.type === 'search') {
          if (!item.url) item.url = 'https://example.com/search?q=%s';
          if (!item.queryEncoding) item.queryEncoding = 'encodeURIComponent';
        }

        return item;
      });
      saveMenuItems();
      renderMenuItems();
      M.toast({ html: 'Settings imported from Chrome Sync!', classes: 'teal' });
    } else {
      M.toast({ html: 'No settings found in Chrome Sync.', classes: 'orange' });
    }
  });
}

/**
 * Restores default menu items and search engines.
 * This function can be called from other parts of the extension if needed.
 */
function restoreDefaults() {
  if (confirm('Are you sure you want to restore default settings? This will overwrite your current settings.')) {
    menuItems = getDefaultMenuItems();
    saveMenuItems();
    renderMenuItems();
    M.toast({ html: 'Default settings restored!', classes: 'teal' });
  }
}

/**
 * Creates context menus based on the current menu items.
 */
async function createContextMenus() {
  try {
    // Remove all existing context menus to avoid duplicates
    await new Promise((resolve) => chrome.contextMenus.removeAll(resolve));

    // Create the main parent context menu item
    chrome.contextMenus.create({
      id: 'simkl_search_main',
      title: "Search '%s' on",
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error creating main context menu: ${chrome.runtime.lastError.message}`);
      }
    });

    // Function to create menu items recursively
    function createMenuItems(items, parentId) {
      items.forEach((item) => {
        if (item.type === 'separator') {
          chrome.contextMenus.create({
            id: item.id,
            type: 'separator',
            parentId: parentId,
            contexts: ['selection']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(`Error creating separator: ${chrome.runtime.lastError.message}`);
            }
          });
        } else if (item.type === 'group') {
          chrome.contextMenus.create({
            id: item.id,
            title: item.name,
            parentId: parentId,
            contexts: ['selection']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(`Error creating group "${item.name}": ${chrome.runtime.lastError.message}`);
            }
          });
          createMenuItems(item.items, item.id);
        } else if (item.type === 'search') {
          chrome.contextMenus.create({
            id: item.id,
            title: item.name,
            parentId: parentId,
            contexts: ['selection']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(`Error creating search engine "${item.name}": ${chrome.runtime.lastError.message}`);
            }
          });
        }
      });
    }

    // Create menu items from menuItems array
    createMenuItems(menuItems, 'simkl_search_main');

    // Add a separator before the "Options" menu item for better organization
    chrome.contextMenus.create({
      id: 'separator_before_options',
      type: 'separator',
      parentId: 'simkl_search_main',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error creating separator before Options: ${chrome.runtime.lastError.message}`);
      }
    });

    // Add the "Options" menu item at the end
    chrome.contextMenus.create({
      id: 'options',
      title: 'Options',
      parentId: 'simkl_search_main',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error creating "Options" menu item: ${chrome.runtime.lastError.message}`);
      }
    });

    console.log('Context menus created successfully.');
  } catch (error) {
    console.error('Error creating context menus:', error);
  }
}
