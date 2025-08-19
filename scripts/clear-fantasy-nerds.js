// Clear Fantasy Nerds API key from localStorage
console.log('Clearing Fantasy Nerds API key from localStorage...');

// Check if we're in a browser environment
if (typeof localStorage !== 'undefined') {
  const savedKeys = localStorage.getItem('fantasy_api_keys');
  if (savedKeys) {
    const keys = JSON.parse(savedKeys);
    if (keys['Fantasy Nerds']) {
      delete keys['Fantasy Nerds'];
      localStorage.setItem('fantasy_api_keys', JSON.stringify(keys));
      console.log('✅ Fantasy Nerds API key removed from localStorage');
    } else {
      console.log('ℹ️ No Fantasy Nerds API key found in localStorage');
    }
  } else {
    console.log('ℹ️ No saved API keys found in localStorage');
  }
} else {
  console.log('❌ Not in browser environment - localStorage not available');
}