// Clear localStorage on first load to remove any old demo data
// This is a one-time cleanup script
const STORAGE_CLEARED_KEY = 'gests-storage-cleared-v1';

if (!localStorage.getItem(STORAGE_CLEARED_KEY)) {
  // Clear all GEST'S related data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('gests-')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Mark as cleared
  localStorage.setItem(STORAGE_CLEARED_KEY, 'true');
  
  console.log('GEST\'S: Storage cleared for fresh start');
}
