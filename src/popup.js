document.addEventListener('DOMContentLoaded', () => {
    const maxWidthInput = document.getElementById('maxWidth');
    
    chrome.storage.sync.get(['maxWidth'], (result) => {
      maxWidthInput.value = result.maxWidth || 300;
    });
    
    maxWidthInput.addEventListener('change', () => {
      chrome.storage.sync.set({ maxWidth: maxWidthInput.value });
    });
  });