// background.js

// Import defaults.js using importScripts
importScripts('defaults.js');

// Initialize an empty array to hold menu items
let menuItems = [];
// Promise to track initial menu item load
let initialLoadPromise = null;

// Define the main context menu ID
const MAIN_MENU_ID = 'simkl_search_main';

// Global error count object to track error occurrences
const errorCounts = {};

/**
 * Error handling function that logs an error only if it occurs 3 times.
 * @param {string} errorMessage - The error message from chrome.runtime.lastError.
 * @param {string} logMessage - The message to log to the console.
 */
function handleError(errorMessage, logMessage) {
  if (!errorCounts[errorMessage]) {
    errorCounts[errorMessage] = 1;
  } else {
    errorCounts[errorMessage]++;
  }

  if (errorCounts[errorMessage] >= 3) {
    console.error(logMessage);
  }
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
        handleError(chrome.runtime.lastError.message, `Error updating menu items with new IDs: ${chrome.runtime.lastError.message}`);
        return;
      }
      // Recreate context menus immediately to avoid ID mismatch on first click
      createContextMenus();
    });
  }
}

/**
 * Loads menu items from local storage or sets default items if none exist.
 * @returns {Promise<void>}
 */
function loadMenuItems() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['menuItems'], (result) => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError.message, `Error accessing storage: ${chrome.runtime.lastError.message}`);
        reject(chrome.runtime.lastError);
        return;
      }

      if (result.menuItems && result.menuItems.length > 0) {
        menuItems = result.menuItems;
        resolve();
      } else {
        // Set default menu items
        menuItems = getDefaultMenuItems();
        chrome.storage.local.set({ menuItems }, () => {
          if (chrome.runtime.lastError) {
            handleError(chrome.runtime.lastError.message, `Error setting default menu items: ${chrome.runtime.lastError.message}`);
            reject(chrome.runtime.lastError);
            return;
          }
          console.log('Set default menu items:', menuItems);
          resolve();
        });
      }
    });
  });
}

/**
 * Creates context menus based on the current menu items.
 */
function createContextMenus() {
  // Remove all existing context menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      handleError(chrome.runtime.lastError.message, `Error removing context menus: ${chrome.runtime.lastError.message}`);
    }

    // Create the main parent context menu item with truncated text
    chrome.contextMenus.create({
      id: MAIN_MENU_ID,
      title: "Search '%s' on",
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError.message, `Error creating main context menu: ${chrome.runtime.lastError.message}`);
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
              handleError(chrome.runtime.lastError.message, `Error creating separator: ${chrome.runtime.lastError.message}`);
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
              handleError(chrome.runtime.lastError.message, `Error creating group "${item.name}": ${chrome.runtime.lastError.message}`);
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
              handleError(chrome.runtime.lastError.message, `Error creating search engine "${item.name}": ${chrome.runtime.lastError.message}`);
            }
          });
        }
      });
    }

    // Create menu items from menuItems array
    createMenuItems(menuItems, MAIN_MENU_ID);

    // Add a separator before the "Options" menu item for better organization
    chrome.contextMenus.create({
      id: 'separator_before_options',
      type: 'separator',
      parentId: MAIN_MENU_ID,
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError.message, `Error creating separator before Options: ${chrome.runtime.lastError.message}`);
      }
    });

    // Add the "Options" menu item at the end
    chrome.contextMenus.create({
      id: 'options',
      title: 'Options',
      parentId: MAIN_MENU_ID,
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError.message, `Error creating "Options" menu item: ${chrome.runtime.lastError.message}`);
      }
    });

    console.log('Context menus created successfully.');
  });
}

// Load menu items when the service worker starts
initialLoadPromise = loadMenuItems().then(() => {
  ensureItemIds();
  // Do not call createContextMenus() here to avoid duplicate IDs
}).catch((error) => {
  console.error(`Error initializing extension: ${error}`);
});

// Register event listeners at the top level

/**
 * Listener for context menu item clicks.
 * Performs the search using the selected search engine or opens Options.
 */
function findGroupByEngineId(engineId) {
  for (const group of menuItems) {
    if (group.type === 'group' && group.items) {
      for (const subItem of group.items) {
        if (subItem.id === engineId) {
          return group;  // Return the group that contains this item
        }
      }
    }
  }
  return null;
}

function findEngineById(engineId) {
  for (const item of menuItems) {
    if (item.type === 'group') {
      for (const subItem of item.items) {
        if (subItem.id === engineId && subItem.type === 'search') {
          return subItem;
        }
      }
    } else if (item.id === engineId && item.type === 'search') {
      return item;
    }
  }
  return null;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Ensure menu items are loaded before handling the first click after startup
  if (initialLoadPromise) {
    try {
      await initialLoadPromise;
    } catch (e) {
      // Initialization failed; proceed to attempt handling anyway
    }
  }
  console.log('Context menu clicked:', info.menuItemId);

  // Handle "Options" menu item
  if (info.menuItemId === 'options') {
    chrome.runtime.openOptionsPage();
    return;
  }

  // Handle context menu click based on menu items
  const selectedEngine = findEngineById(info.menuItemId);

  if (selectedEngine) {
    // If the clicked item is 'Search everywhere', open all search engines in the same group
    if (selectedEngine.name === 'Search everywhere' && selectedEngine.url === '') {
      const group = findGroupByEngineId(info.menuItemId);

      if (group) {
        group.items.forEach((item) => {
          if (item.type === 'search' && item.url) {
            let query = info.selectionText || '';

            // Apply query formatting based on encoding type
            switch (item.queryEncoding) {
              case 'plus':
                query = query.trim().split(/\s+/).join('+');
                break;
              case 'dash':
                query = query.trim().split(/\s+/).join('-');
                break;
              case 'none':
                // No encoding; spaces remain as is
                break;
              case 'encodeURIComponent':
              default:
                query = encodeURIComponent(query);
                break;
            }

            const searchUrl = item.url.replace('%s', query);

            // Open the search URL in a new tab
            chrome.tabs.create({
              url: searchUrl,
              index: tab.index + 1,
              openerTabId: tab.id
            }, (newTab) => {
              if (chrome.runtime.lastError) {
                handleError(chrome.runtime.lastError.message, `Error creating new tab: ${chrome.runtime.lastError.message}`);
              }
            });
          }
        });
      }
    } else {
      // For regular search items, handle search normally
      let query = info.selectionText || '';

      // Apply query formatting based on encoding type
      switch (selectedEngine.queryEncoding) {
        case 'plus':
          query = query.trim().split(/\s+/).join('+');
          break;
        case 'dash':
          query = query.trim().split(/\s+/).join('-');
          break;
        case 'none':
          // No encoding; spaces remain as is
          break;
        case 'encodeURIComponent':
        default:
          query = encodeURIComponent(query);
          break;
      }

      const searchUrl = selectedEngine.url.replace('%s', query);

      // Open the search URL in a new tab next to the current tab
      chrome.tabs.create({
        url: searchUrl,
        index: tab.index + 1,
        openerTabId: tab.id
      }, (newTab) => {
        if (chrome.runtime.lastError) {
          handleError(chrome.runtime.lastError.message, `Error creating new tab: ${chrome.runtime.lastError.message}`);
        }
      });
    }
  } else {
    console.error(`No matching search engine found for ID: ${info.menuItemId}`);
  }
});

/**
 * Listener for changes in storage.
 * Updates context menus dynamically when menu items are modified.
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === 'local' || area === 'sync') && changes.menuItems) {
    menuItems = changes.menuItems.newValue || [];
    ensureItemIds();
    createContextMenus();
  }
});

/**
 * Listener for messages from other parts of the extension.
 * Handles actions like updating context menus.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenus') {
    loadMenuItems().then(() => {
      ensureItemIds();
      createContextMenus();
      sendResponse({ status: 'Context menus updated.' });
    }).catch((error) => {
      handleError(error.message, `Error updating context menus: ${error.message}`);
      sendResponse({ status: 'Failed to update context menus.', error: error.message });
    });
    // Indicate that the response is sent asynchronously
    return true;
  }
});

// Listener for extension installation and updates.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First-time install: clear existing data and set defaults
    chrome.storage.local.clear(() => {
      menuItems = getDefaultMenuItems();
      ensureItemIds();
      chrome.storage.local.set({ menuItems }, () => {
        if (chrome.runtime.lastError) {
          handleError(chrome.runtime.lastError.message, `Error setting default menu items: ${chrome.runtime.lastError.message}`);
          return;
        }
        // Create context menus after setting menuItems
        createContextMenus();
      });

      // Open Options Page After Installation
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") }, (tab) => {
        if (chrome.runtime.lastError) {
          handleError(chrome.runtime.lastError.message, `Error opening options page: ${chrome.runtime.lastError.message}`);
        }
      });
    });
  } else if (details.reason === 'update') {
    // On update: reload menu items and recreate context menus
    loadMenuItems().then(() => {
      ensureItemIds();
      createContextMenus();
    }).catch((error) => {
      handleError(error.message, `Error during update handling: ${error.message}`);
    });
  }
});

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Open the options page when the icon is clicked
  chrome.runtime.openOptionsPage();
});
