function createPopup() {
    const popup = document.createElement('div');
    popup.className = 'preview-popup';
    popup.style.display = 'none';
    document.body.appendChild(popup);
    return popup;
  }
  
  function updatePopupPosition(popup, event) {
    const x = event.clientX;
    const y = event.clientY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupRect = popup.getBoundingClientRect();
    
    let left = x + 10;
    let top = y;
  
    if (left + popupRect.width > viewportWidth) {
      left = x - popupRect.width - 10;
    }
  
    if (top + popupRect.height > viewportHeight) {
      top = viewportHeight - popupRect.height - 10;
    }
    if (top < 10) {
      top = 10;
    }
  
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }
  
  async function fetchPoster(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const posterImg = doc.querySelector('.entry-content-poster img');
      return posterImg ? posterImg.src : null;
    } catch (error) {
      console.error('Error fetching poster:', error);
      return null;
    }
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  function initializeHoverPreview() {
    const popup = createPopup();
    const posterCache = new Map();
    let currentFetchAbortController = null;
  
    chrome.storage.sync.get(['maxWidth'], (result) => {
      popup.style.maxWidth = `${result.maxWidth || 300}px`;
    });
  
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.maxWidth) {
        popup.style.maxWidth = `${changes.maxWidth.newValue}px`;
      }
    });
    
    const debouncedFetch = debounce(async (href) => {
      if (currentFetchAbortController) {
        currentFetchAbortController.abort();
      }
      currentFetchAbortController = new AbortController();
  
      try {
        const posterUrl = await fetchPoster(href);
        if (posterUrl) {
          posterCache.set(href, posterUrl);
          popup.innerHTML = `<img src="${posterUrl}" alt="Anime Poster">`;
          popup.style.display = 'block';
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Error:', error);
        }
      }
    }, 150);
  
    document.querySelectorAll('a[href*="/anime-list/"]').forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.href;
        if (posterCache.has(href)) {
          popup.innerHTML = `<img src="${posterCache.get(href)}" alt="Anime Poster">`;
          popup.style.display = 'block';
        } else {
          debouncedFetch(href);
        }
      });
  
      link.addEventListener('mousemove', (e) => {
        if (popup.style.display === 'block') {
          updatePopupPosition(popup, e);
        }
      });
  
      link.addEventListener('mouseleave', () => {
        popup.style.display = 'none';
      });
    });
  }
  
  initializeHoverPreview();