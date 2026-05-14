// src/script.ts — FIXED VERSION
// Removed ALL alert() and confirm() popups
// Replaced with proper navigation and UI feedback

interface FlowerItem {
    id: string;
    name: string;
    category: 'wedding' | 'birthday' | 'romantic' | 'sympathy' | 'corporate' | 'seasonal';
    price: number;
    priceDisplay: string;
    description: string;
    colors: string[];
    occasions: string[];
    flowers: string[];
    tags: string[];
    inStock: boolean;
    rating: number;
    imageIcon: string;
}

interface SearchResult {
    items: FlowerItem[];
    query: string;
    count: number;
    categories: string[];
}

interface CartState {
    count: number;
    items: FlowerItem[];
}

interface SearchElements {
    searchBtn: HTMLButtonElement | null;
    searchOverlay: HTMLElement | null;
    searchClose: HTMLButtonElement | null;
    searchInput: HTMLInputElement | null;
    searchSubmit: HTMLButtonElement | null;
    searchResults: HTMLElement | null;
    suggestionTags: NodeListOf<Element>;
    categoryItems: NodeListOf<Element>;
}

interface SearchFilters {
    category?: string;
    priceRange?: [number, number];
    colors?: string[];
    inStock?: boolean;
    minRating?: number;
}

class FlowerShopApp {
    private cartState: CartState = {
        count: 0,
        items: []
    };

    private searchElements: SearchElements;
    private searchTimeout: number | null = null;
    private dropdownTimeout: number | null = null;

    private readonly flowerData: FlowerItem[] = [
        {
            id: 'red-roses-classic',
            name: 'Classic Red Roses',
            category: 'romantic',
            price: 45,
            priceDisplay: '$45',
            description: 'Dozen premium red roses perfect for expressing love and romance',
            colors: ['red'],
            occasions: ['anniversary', 'valentine', 'romantic', 'apology'],
            flowers: ['roses'],
            tags: ['premium', 'classic', 'dozen', 'long-stem'],
            inStock: true,
            rating: 4.9,
            imageIcon: '🌹'
        },
        {
            id: 'wedding-bouquet-elegant',
            name: 'Elegant Wedding Bouquet',
            category: 'wedding',
            price: 120,
            priceDisplay: '$120',
            description: 'Stunning white and cream bridal bouquet with roses, peonies, and eucalyptus',
            colors: ['white', 'cream', 'green'],
            occasions: ['wedding', 'bridal', 'engagement'],
            flowers: ['roses', 'peonies', 'eucalyptus'],
            tags: ['bridal', 'premium', 'large', 'elegant'],
            inStock: true,
            rating: 5.0,
            imageIcon: '💐'
        },
        {
            id: 'birthday-mixed-bright',
            name: 'Bright Birthday Mix',
            category: 'birthday',
            price: 35,
            priceDisplay: '$35',
            description: 'Cheerful mixed bouquet with gerberas, sunflowers, and daisies',
            colors: ['yellow', 'orange', 'pink', 'purple'],
            occasions: ['birthday', 'congratulations', 'thank-you'],
            flowers: ['gerberas', 'sunflowers', 'daisies'],
            tags: ['colorful', 'cheerful', 'medium', 'popular'],
            inStock: true,
            rating: 4.7,
            imageIcon: '🌻'
        },
        {
            id: 'sympathy-white-peace',
            name: 'White Peace Arrangement',
            category: 'sympathy',
            price: 65,
            priceDisplay: '$65',
            description: 'Elegant white lilies and roses arrangement for peaceful remembrance',
            colors: ['white', 'green'],
            occasions: ['sympathy', 'funeral', 'remembrance', 'condolence'],
            flowers: ['lilies', 'roses', 'chrysanthemums'],
            tags: ['elegant', 'peaceful', 'white', 'premium'],
            inStock: true,
            rating: 4.9,
            imageIcon: '🕊️'
        },
        {
            id: 'corporate-modern-statement',
            name: 'Modern Statement Piece',
            category: 'corporate',
            price: 85,
            priceDisplay: '$85',
            description: 'Striking modern arrangement with birds of paradise and tropical foliage',
            colors: ['orange', 'green', 'purple'],
            occasions: ['corporate', 'office', 'event', 'reception'],
            flowers: ['birds-of-paradise', 'anthuriums', 'tropical-foliage'],
            tags: ['modern', 'statement', 'large', 'premium'],
            inStock: true,
            rating: 4.7,
            imageIcon: '🌺'
        },
        {
            id: 'seasonal-peonies-blush',
            name: 'Blush Peony Collection',
            category: 'seasonal',
            price: 75,
            priceDisplay: '$75',
            description: 'Luxurious seasonal peonies in soft blush and cream tones',
            colors: ['pink', 'cream', 'blush'],
            occasions: ['gift', 'romantic', 'anniversary', 'self-treat'],
            flowers: ['peonies'],
            tags: ['seasonal', 'luxury', 'limited', 'premium'],
            inStock: true,
            rating: 5.0,
            imageIcon: '🌸'
        }
    ];

    constructor() {
        this.searchElements = this.getSearchElements();
        this.init();
    }

    private getSearchElements(): SearchElements {
        return {
            searchBtn: document.querySelector<HTMLButtonElement>('#searchButton') || document.querySelector<HTMLButtonElement>('.search-btn'),
            searchOverlay: document.getElementById('searchOverlay'),
            searchClose: document.getElementById('searchClose') as HTMLButtonElement | null,
            searchInput: document.getElementById('searchInput') as HTMLInputElement | null,
            searchSubmit: document.getElementById('searchSubmit') as HTMLButtonElement | null,
            searchResults: document.getElementById('searchResults'),
            suggestionTags: document.querySelectorAll('.suggestion-tag'),
            categoryItems: document.querySelectorAll('.category-item')
        };
    }

    private init(): void {
        this.setupEventListeners();
        this.initializeObservers();
        this.setupCartFunctionality();
        this.setupFormHandling();
        this.setupDropdownMenu();
        this.updateCartCount();
    }

    private setupEventListeners(): void {
        this.setupSearchListeners();
        this.setupNavigationListeners();
        this.setupWindowListeners();
    }

    private setupSearchListeners(): void {
        const { searchBtn, searchOverlay, searchClose, searchInput, searchSubmit } = this.searchElements;

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.openSearchModal());
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => this.closeSearchModal());
        }

        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e: Event) => {
                if (e.target === searchOverlay) {
                    this.closeSearchModal();
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e: Event) => {
                const value = (e.target as HTMLInputElement).value;
                this.handleSearchInput(value);
            });

            searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    this.closeSearchModal();
                }
            });
        }

        if (searchSubmit) {
            searchSubmit.addEventListener('click', () => {
                const query = this.searchElements.searchInput?.value || '';
                if (query.trim()) {
                    // Navigate to shop page with search query
                    window.location.href = `shop.html?q=${encodeURIComponent(query.trim())}`;
                }
            });
        }
    }

    private setupNavigationListeners(): void {
        // Smooth scrolling for anchor links on the same page
        document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e: Event) => {
                const href = anchor.getAttribute('href');
                if (href && href.length > 1) {
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        this.smoothScroll(href);
                    }
                }
            });
        });

        // Keyboard: close search on Escape
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.closeSearchModal();
            }
        });
    }

    private setupWindowListeners(): void {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
        });
    }

    private openSearchModal(): void {
        const { searchOverlay, searchInput } = this.searchElements;
        if (searchOverlay) {
            searchOverlay.classList.add('active');
        }
        if (searchInput) {
            searchInput.focus();
        }
        document.body.style.overflow = 'hidden';
        this.showDefaultContent();
    }

    private closeSearchModal(): void {
        const { searchOverlay, searchInput, searchResults } = this.searchElements;
        if (searchOverlay) {
            searchOverlay.classList.remove('active');
        }
        document.body.style.overflow = 'auto';
        if (searchInput) {
            searchInput.value = '';
        }
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    private showDefaultContent(): void {
        const { searchResults } = this.searchElements;
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    private handleSearchInput(value: string): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = window.setTimeout(() => {
            if (value.trim().length >= 2) {
                this.showLoadingState();
                setTimeout(() => {
                    const results = this.advancedSearch(value.trim(), {});
                    this.displaySearchResults(results);
                }, 200);
            } else {
                this.showDefaultContent();
            }
        }, 300);
    }

    private advancedSearch(query: string, filters: SearchFilters): SearchResult {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        const scoredResults: Array<{ item: FlowerItem; score: number }> = [];

        this.flowerData.forEach(item => {
            if (filters.category && item.category !== filters.category) return;
            if (filters.inStock !== undefined && item.inStock !== filters.inStock) return;
            if (filters.minRating && item.rating < filters.minRating) return;
            if (filters.priceRange) {
                const [min, max] = filters.priceRange;
                if (item.price < min || item.price > max) return;
            }

            let score = 0;
            searchTerms.forEach(term => {
                if (item.name.toLowerCase().includes(term)) {
                    score += item.name.toLowerCase().startsWith(term) ? 100 : 50;
                }
                if (item.category.toLowerCase().includes(term)) score += 40;
                item.flowers.forEach(f => { if (f.toLowerCase().includes(term)) score += 35; });
                item.occasions.forEach(o => { if (o.toLowerCase().includes(term)) score += 30; });
                item.colors.forEach(c => { if (c.toLowerCase().includes(term)) score += 25; });
                if (item.description.toLowerCase().includes(term)) score += 15;
            });

            score += item.rating * 2;
            if (item.inStock) score += 5;

            if (score > 0) {
                scoredResults.push({ item, score });
            }
        });

        const sortedResults = scoredResults
            .sort((a, b) => b.score - a.score)
            .map(r => r.item);

        return {
            items: sortedResults,
            query,
            count: sortedResults.length,
            categories: [...new Set(sortedResults.map(i => i.category))]
        };
    }

    private showLoadingState(): void {
        const { searchResults } = this.searchElements;
        if (!searchResults) return;
        searchResults.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <span>Searching our beautiful collection...</span>
            </div>
        `;
    }

    private displaySearchResults(searchResult: SearchResult): void {
        const { searchResults } = this.searchElements;
        if (!searchResults) return;

        const { items, query, count } = searchResult;

        if (count === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🌸</div>
                    <h3>No flowers found</h3>
                    <p>We couldn't find any flowers matching "${query}"</p>
                    <p><small>Try searching for "roses", "wedding", or browse our categories above</small></p>
                </div>
            `;
            return;
        }

        const resultsHeader = query
            ? `Found ${count} beautiful arrangement${count !== 1 ? 's' : ''} for "${query}"`
            : `${count} arrangement${count !== 1 ? 's' : ''} in this category`;

        const resultsHTML = items.slice(0, 8).map((item: FlowerItem) => `
            <a href="shop.html?q=${encodeURIComponent(item.name)}" class="search-result-item" style="text-decoration:none;color:inherit;">
                <div class="result-image">${item.imageIcon}</div>
                <div class="result-details">
                    <div class="result-name">${item.name}</div>
                    <div class="result-description">${item.description}</div>
                    <div class="result-meta">
                        <span class="result-price">${item.priceDisplay}</span>
                        <span class="result-category">${item.category}</span>
                        ${!item.inStock ? '<span style="color: #999; font-size: 0.8rem;">Out of Stock</span>' : ''}
                    </div>
                </div>
            </a>
        `).join('');

        searchResults.innerHTML = `
            <div class="results-header">${resultsHeader}</div>
            ${resultsHTML}
        `;
    }

    // ✅ FIX: Navigate to shop page instead of showing alert
    public selectFlower(flowerId: string): void {
        const selectedFlower = this.flowerData.find(flower => flower.id === flowerId);
        if (selectedFlower) {
            this.closeSearchModal();
            window.location.href = `shop.html?q=${encodeURIComponent(selectedFlower.name)}`;
        }
    }

    private setupCartFunctionality(): void {
        const cartIcon = document.querySelector<HTMLElement>('.cart-icon');

        // Hero "SHOP" buttons — now <a> tags in HTML, no JS needed

        // ✅ FIX: Cart icon navigates to cart page (already an <a> tag now)
        // Only add click handler if it's a <button>, not an <a>
        if (cartIcon && cartIcon.tagName === 'BUTTON') {
            cartIcon.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }
    }

    private updateCartCount(): void {
        const cartCountElement = document.querySelector<HTMLElement>('.cart-count');
        if (cartCountElement) {
            // Read from localStorage if available (sync with the real cart)
            try {
                const cart = JSON.parse(localStorage.getItem('vf_cart_v1') || '[]');
                const total = cart.reduce((s: number, ci: any) => s + (ci.qty || 0), 0);
                cartCountElement.textContent = String(total);
                cartCountElement.style.display = total > 0 ? 'block' : 'none';
            } catch {
                cartCountElement.textContent = this.cartState.count.toString();
                cartCountElement.style.display = this.cartState.count > 0 ? 'block' : 'none';
            }
        }
    }

    private setupFormHandling(): void {
        const contactForm = document.getElementById('contactForm') as HTMLFormElement | null;
        if (contactForm) {
            contactForm.addEventListener('submit', (e: Event) => {
                e.preventDefault();
                this.handleFormSubmission(contactForm);
            });
        }
    }

    private async handleFormSubmission(form: HTMLFormElement): Promise<void> {
        const submitButton = form.querySelector<HTMLButtonElement>('.submit-button');
        if (!submitButton) return;

        const originalText = submitButton.textContent || '';

        submitButton.innerHTML = '<span class="loading"></span> Sending...';
        submitButton.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 1500));

        submitButton.innerHTML = '✓ Message Sent!';
        submitButton.style.backgroundColor = '#5a8a3a';

        form.reset();

        setTimeout(() => {
            submitButton.textContent = originalText;
            submitButton.style.backgroundColor = '#8b7355';
            submitButton.disabled = false;
        }, 2000);
    }

    // ✅ FIX: Gallery items are now <a> tags — no JS click handlers needed
    // ✅ FIX: Service card hover is handled via CSS transitions, not inline JS

    private setupDropdownMenu(): void {
        const dropdownContainer = document.querySelector<HTMLElement>('.dropdown-container');
        const dropdownMenu = document.querySelector<HTMLElement>('.dropdown-menu');

        if (dropdownContainer && dropdownMenu) {
            dropdownContainer.addEventListener('mouseenter', () => {
                if (this.dropdownTimeout) clearTimeout(this.dropdownTimeout);
                dropdownMenu.style.display = 'block';
            });

            dropdownContainer.addEventListener('mouseleave', () => {
                this.dropdownTimeout = window.setTimeout(() => {
                    dropdownMenu.style.display = 'none';
                }, 100);
            });

            // ✅ FIX: Dropdown items navigate to shop with category filter
            document.querySelectorAll<HTMLAnchorElement>('.dropdown-item').forEach(item => {
                if (!item.href || item.href === '#') {
                    item.addEventListener('click', (e: Event) => {
                        e.preventDefault();
                        const category = item.textContent?.trim().toLowerCase() || '';
                        window.location.href = `shop.html?category=${encodeURIComponent(category)}`;
                    });
                }
            });
        }
    }

    private initializeObservers(): void {
        const observerOptions: IntersectionObserverInit = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-on-scroll');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll<HTMLElement>('.service-card, .gallery-item, .section-title').forEach(el => {
            observer.observe(el);
        });
    }

    private smoothScroll(target: string): void {
        const element = document.querySelector(target) as HTMLElement | null;
        if (element) {
            const offsetTop = element.offsetTop - 100;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    }

    private handleResize(): void {
        const navLeft = document.querySelector<HTMLElement>('.nav-left');
        if (!navLeft) return;
        navLeft.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
    }

    private handleScroll(): void {
        const scrolled = window.pageYOffset;
        const heroImage = document.querySelector<HTMLElement>('.hero-image');
        if (heroImage && scrolled < window.innerHeight) {
            heroImage.style.transform = `translateY(${scrolled * -0.5}px)`;
        }
    }

    // ✅ FIX: Removed alert from addFlowerToCart
    public addFlowerToCart(flower: FlowerItem): void {
        this.cartState.items.push(flower);
        this.cartState.count++;
        this.updateCartCount();
    }

    public searchFlowers(query: string, filters?: SearchFilters): SearchResult {
        return this.advancedSearch(query, filters || {});
    }

    public getFlowerById(id: string): FlowerItem | undefined {
        return this.flowerData.find(flower => flower.id === id);
    }

    public getFlowersByCategory(category: string): FlowerItem[] {
        return this.flowerData.filter(flower => flower.category === category);
    }
}

// Initialize
let flowerShopApp: FlowerShopApp;

document.addEventListener('DOMContentLoaded', () => {
    flowerShopApp = new FlowerShopApp();
    (window as any).flowerShopApp = flowerShopApp;
});

export { FlowerShopApp, FlowerItem, CartState, SearchResult };