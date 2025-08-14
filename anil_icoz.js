// Author: Anıl İçöz
// Date: 14.08.2025
// Description: Ebebek Product Carousel
// Contact: icoz16@itu.edu.tr
// GitHub: https://github.com/anil-icoz/product_carousel

(() => {
  // Configuration
  const CONFIG = {
    API_URL: 'https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json',
    STORAGE_KEY: 'ebebek_carousel_data',
    STORAGE_TIMESTAMP_KEY: 'ebebek_carousel_timestamp',
    FAVORITES_KEY: 'ebebek_favorites',
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
    PRODUCTS_PER_VIEW: 5,
    AUTO_SCROLL_INTERVAL: 5000
  };

  // Global variables
  let currentIndex = 0;
  let products = [];
  let autoScrollTimer = null;
  let favorites = [];

  const isHomepage = () => {
    const currentPath = window.location.pathname;
    return currentPath === '/' || currentPath === '/index.html' || currentPath === '';
  };

  // Utility functions
  const utils = {
    isLocalStorageAvailable: () => {
      try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },

    isDataCached: () => {
      if (!utils.isLocalStorageAvailable()) return false;
      
      try {
        const timestamp = localStorage.getItem(CONFIG.STORAGE_TIMESTAMP_KEY);
        if (!timestamp) return false;
        
        const now = Date.now();
        const cacheTime = parseInt(timestamp);
        return (now - cacheTime) < CONFIG.CACHE_DURATION;
      } catch (e) {
        return false;
      }
    },

    getCachedData: () => {
      if (!utils.isLocalStorageAvailable()) return null;
      
      try {
        const cached = localStorage.getItem(CONFIG.STORAGE_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    },

    cacheData: (data) => {
      if (!utils.isLocalStorageAvailable()) return;
      
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(CONFIG.STORAGE_TIMESTAMP_KEY, Date.now().toString());
      } catch (e) {
        console.warn('localStorage access denied, cannot cache data');
      }
    },

    // Load favorites from localStorage
    loadFavorites: () => {
      if (!utils.isLocalStorageAvailable()) return [];
      
      try {
        const stored = localStorage.getItem(CONFIG.FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    },

    // Save favorites to localStorage
    saveFavorites: (favorites) => {
      if (!utils.isLocalStorageAvailable()) return;
      
      try {
        localStorage.setItem(CONFIG.FAVORITES_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.warn('localStorage access denied, cannot save favorites');
      }
    },

    formatPrice: (price) => {
      return `${price.toFixed(2)} ₺`;
    },

    calculateDiscount: (originalPrice, currentPrice) => {
      if (originalPrice <= currentPrice) return 0;
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
  };

  // API functions
  const api = {
    // Fetch products from API
    fetchProducts: async () => {
      try {
        console.log('Fetching products from API...');
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Products fetched successfully:', data.length, 'products');
        return data;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },

    // Get products (from cache or API)
    getProducts: async () => {
      if (utils.isDataCached()) {
        console.log('Loading products from cache...');
        const cachedData = utils.getCachedData();
        if (cachedData) {
          return cachedData;
        }
      }
      
      const data = await api.fetchProducts();
      utils.cacheData(data);
      return data;
    }
  };

  const buildCSS = () => {
    const css = `
      .ebebek-carousel-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        position: relative;
        z-index: 1000;
      }
      
      .ebebek-carousel-title {
        font-size: 28px;
        font-weight: 700;
        color: #333;
        text-align: center;
        margin: 40px 0 30px 0;
        position: relative;
        letter-spacing: -0.5px;
      }
      
      .ebebek-carousel-wrapper {
        position: relative;
        overflow: hidden;
        background: #fff;
        border-radius: 12px;
        padding: 30px 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        border: 1px solid #f0f0f0;
      }
      
      .ebebek-carousel-track {
        display: flex;
        transition: transform 0.4s ease-in-out;
        gap: 0;
        padding: 0 30px;
      }
      
      .ebebek-product-card {
        min-width: calc(20% - 20px);
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 10px;
        position: relative;
        transition: all 0.3s ease;
        margin-right: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      
      .ebebek-product-card:last-child {
        margin-right: 0;
      }
      
      .ebebek-product-card:hover {
        border-color: #ff6b35;
        box-shadow: 0 8px 25px rgba(255, 107, 53, 0.15);
        transform: translateY(-2px);
      }
      
      .ebebek-product-image-container {
        position: relative;
        height: 220px;
        overflow: hidden;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .ebebek-product-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 0.3s ease;
      }
      
      .ebebek-product-card:hover .ebebek-product-image {
        transform: scale(1.05);
      }
      
      .ebebek-favorite-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255,255,255,0.95);
        border: 1px solid #e0e0e0;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 3;
        font-size: 18px;
        color: #bbb;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      }
      
      .ebebek-favorite-btn:hover {
        background: #fff;
        border-color: #ff6b35;
        color: #ff6b35;
        transform: scale(1.1);
      }
      
      .ebebek-favorite-btn.active {
        color: #ff6b35;
        background: #fff;
        border-color: #ff6b35;
      }
      
      .ebebek-product-info {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .ebebek-product-brand {
        color: #888;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      
      .ebebek-product-name {
        color: #333;
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 15px;
        line-height: 1.4;
        overflow: hidden;
        min-height: 42px;
      }
      
      .ebebek-product-icons {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .ebebek-icon-btn {
        background: #f8f9fa;
        color: #666;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.3s ease;
      }
      
      .ebebek-icon-btn:hover {
        background: #ff6b35;
        color: white;
        border-color: #ff6b35;
        transform: translateY(-1px);
      }
      
      .ebebek-rating {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 15px;
      }
      
      .ebebek-stars {
        display: flex;
        gap: 3px;
      }
      
      .ebebek-star {
        color: #ffd700;
        font-size: 16px;
      }
      
      .ebebek-review-count {
        color: #999;
        font-size: 13px;
        font-weight: 500;
      }
      
      .ebebek-pricing {
        margin-bottom: 20px;
        margin-top: auto;
      }
      
      .ebebek-price-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      
      .ebebek-original-price {
        font-size: 14px;
        color: #999;
        text-decoration: line-through;
        font-weight: 500;
      }
      
      .ebebek-discount {
        color: #28a745;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      
      .ebebek-discount::before {
        content: '↓';
        font-size: 11px;
      }
      
      .ebebek-current-price {
        font-size: 20px;
        font-weight: 800;
        color: #28a745;
      }
      
      .ebebek-current-price.no-discount {
        color: #333;
      }
      
      .ebebek-special-offer {
        color: #28a745;
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
      }
      
      .ebebek-add-to-cart-btn {
        width: 100%;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        border: none;
        padding: 14px;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: auto;
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      }
      
      .ebebek-add-to-cart-btn:hover {
        background: linear-gradient(135deg, #e55a2b, #e0851a);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
      }
      
      .ebebek-carousel-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: #fff;
        border: 2px solid #e0e0e0;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #666;
        transition: all 0.3s ease;
        z-index: 3;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .ebebek-carousel-nav:hover {
        background: #ff6b35;
        color: white;
        border-color: #ff6b35;
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
      }
      
      .ebebek-carousel-nav.prev {
        left: 15px;
      }
      
      .ebebek-carousel-nav.next {
        right: 15px;
      }
      
      .ebebek-carousel-nav:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: translateY(-50%) scale(1);
      }
      
      .ebebek-carousel-dots {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 25px;
      }
      
      .ebebek-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ddd;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .ebebek-dot.active {
        background: #ff6b35;
        transform: scale(1.3);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.className = 'ebebek-carousel-style';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  };

  // Create product card
  const createProductCard = (product) => {
    const discount = utils.calculateDiscount(product.original_price, product.price);
    const isFavorite = favorites.includes(product.id);
    
    // Generate random rating
    const rating = Math.random(0,5);
    const reviewCount = Math.random(0,300);
    
    return `
      <div class="ebebek-product-card" data-product-id="${product.id}">
        <div class="ebebek-product-image-container">
          <img src="${product.img}" alt="${product.name}" class="ebebek-product-image" 
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='">
          
          <button class="ebebek-favorite-btn ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${product.id})">
            ♥
          </button>
        </div>
        <div class="ebebek-product-info">
          <div class="ebebek-product-brand">${product.brand}</div>
          <div class="ebebek-product-name">${product.name}</div>
          
          <!-- Pricing -->
          <div class="ebebek-pricing">
            ${product.original_price > product.price ? `
              <div class="ebebek-price-row">
                <span class="ebebek-original-price">${utils.formatPrice(product.original_price)}</span>
                <span class="ebebek-discount">%${discount}</span>
              </div>
            ` : ''}
            <div class="ebebek-price-row">
              <span class="ebebek-current-price ${product.original_price > product.price ? '' : 'no-discount'}">${utils.formatPrice(product.price)}</span>
            </div>
          </div>
          
          <button class="ebebek-add-to-cart-btn" onclick="openProduct('${product.url}')">
            Sepete Ekle
          </button>
        </div>
      </div>
    `;
  };

  // Build HTML structure
  const buildHTML = () => {
    const html = `
      <div class="ebebek-carousel-container">
        <h2 class="ebebek-carousel-title">Beğenebileceğinizi düşündüklerimiz</h2>
        <div class="ebebek-carousel-wrapper">
        </div>
      </div>
    `;

    // Find the hero.banner element to append after
    const heroBanner = document.querySelector('.hero.banner') || 
                      document.querySelector('.hero-banner') || 
                      document.querySelector('.hero') ||
                      document.querySelector('.banner');
    
    if (heroBanner) {
      // Create a temporary container to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const carouselElement = tempDiv.firstElementChild;
      
      // Insert after the hero banner
      heroBanner.parentNode.insertBefore(carouselElement, heroBanner.nextSibling);
    } else {
      console.log('Hero banner element not found, carousel not loaded');
      return;
    }
  };

  // Update carousel content
  const updateCarousel = () => {
    const carouselWrapper = document.querySelector('.ebebek-carousel-wrapper');
    const track = document.querySelector('.ebebek-carousel-track');
    
    if (!track) {
      carouselWrapper.innerHTML = `
        <button class="ebebek-carousel-nav prev" onclick="previousSlide()">‹</button>
        <button class="ebebek-carousel-nav next" onclick="nextSlide()">›</button>
        <div class="ebebek-carousel-track">
          ${products.map(product => createProductCard(product)).join('')}
        </div>
        <div class="ebebek-carousel-dots">
          ${Array.from({length: Math.ceil(products.length / CONFIG.PRODUCTS_PER_VIEW)}, (_, i) => 
            `<div class="ebebek-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`
          ).join('')}
        </div>
      `;
    }
    
    updateCarouselPosition();
  };

  // Update carousel position
  const updateCarouselPosition = () => {
    const track = document.querySelector('.ebebek-carousel-track');
    const dots = document.querySelectorAll('.ebebek-dot');
    const prevBtn = document.querySelector('.ebebek-carousel-nav.prev');
    const nextBtn = document.querySelector('.ebebek-carousel-nav.next');
    
    if (track) {
      const translateX = -(currentIndex * (100 / CONFIG.PRODUCTS_PER_VIEW));
      track.style.transform = `translateX(${translateX}%)`;
    }
    
    // Update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
    
    // Update navigation buttons
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= Math.ceil(products.length / CONFIG.PRODUCTS_PER_VIEW) - 1;
  };

  // Carousel navigation functions
  window.nextSlide = () => {
    const maxIndex = Math.ceil(products.length / CONFIG.PRODUCTS_PER_VIEW) - 1;
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateCarouselPosition();
    }
  };

  window.previousSlide = () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarouselPosition();
    }
  };

  window.goToSlide = (index) => {
    currentIndex = index;
    updateCarouselPosition();
  };

  // Product interaction functions
  window.openProduct = (url) => {
    window.open(url, '_blank');
  };

  window.toggleFavorite = (productId) => {
    const btn = document.querySelector(`[data-product-id="${productId}"] .ebebek-favorite-btn`);
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      btn.classList.remove('active');
    } else {
      favorites.push(productId);
      btn.classList.add('active');
    }
    
    utils.saveFavorites(favorites);
  };

  // Auto-scroll functionality
  const startAutoScroll = () => {
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    
    autoScrollTimer = setInterval(() => {
      const maxIndex = Math.ceil(products.length / CONFIG.PRODUCTS_PER_VIEW) - 1;
      if (currentIndex >= maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      updateCarouselPosition();
    }, CONFIG.AUTO_SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  };

  // Keyboard navigation
  const handleKeyboardNavigation = (event) => {
    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        window.previousSlide();
        break;
      case 'ArrowRight':
        event.preventDefault();
        window.nextSlide();
        break;
    }
  };

  // Set events
  const setEvents = () => {
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Pause auto-scroll on hover
    const carouselWrapper = document.querySelector('.ebebek-carousel-wrapper');
    carouselWrapper.addEventListener('mouseenter', stopAutoScroll);
    carouselWrapper.addEventListener('mouseleave', startAutoScroll);
  };

  // Main initialization function
  const init = async () => {
    // Check if we're on the homepage
    if (!isHomepage()) {
      console.log('wrong page');
      return;
    }

    try {
      // Clear existing content
      const existingContainer = document.querySelector('.ebebek-carousel-container');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      // Build CSS and HTML
      buildCSS();
      buildHTML();
      
      // Load favorites
      favorites = utils.loadFavorites();
      
      // Fetch products
      products = await api.getProducts();
      
      // Update carousel with products
      updateCarousel();
      
      // Start auto-scroll
      startAutoScroll();
      
      // Set events
      setEvents();
      
      console.log('Ebebek carousel initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize ebebek carousel:', error);
    }
  };

  // Export for console access
  window.EbebekCarouselSnippet = {
    init,
    nextSlide: window.nextSlide,
    previousSlide: window.previousSlide,
    goToSlide: window.goToSlide,
    openProduct: window.openProduct,
    toggleFavorite: window.toggleFavorite,
    products: () => products,
    currentIndex: () => currentIndex,
    favorites: () => favorites,
    isHomepage
  };

  // Initialize when script loads
  init();
})(); 