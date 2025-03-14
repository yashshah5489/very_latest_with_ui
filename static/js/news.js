/**
 * Financial News Module
 * Handles fetching, processing, and displaying financial news
 */

// News DOM elements
const newsContainer = document.getElementById('news-container');
const newsSearchForm = document.getElementById('news-search-form');
const newsSearchInput = document.getElementById('news-search-input');
const newsFilterDropdown = document.getElementById('news-filter-dropdown');
const newsPagination = document.getElementById('news-pagination');

// News state
let currentNewsPage = 1;
const newsPerPage = 5;
let allNews = [];
let filteredNews = [];
let currentNewsFilter = 'all'; // all, positive, negative, neutral

/**
 * Initialize News Module
 */
function initializeNewsModule() {
    // Check if news elements exist (we might be on a different page)
    if (!newsContainer) return;
    
    // Fetch news
    fetchLatestNews()
        .then(data => {
            allNews = data;
            filteredNews = [...allNews];
            renderNews();
            setupNewsListeners();
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            showNewsError('Failed to load financial news. Please try again later.');
        });
}

/**
 * Fetch latest financial news from API
 * @returns {Promise} Promise that resolves to news data
 */
function fetchLatestNews() {
    return fetch('/api/news')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
}

/**
 * Search for news with specific query
 * @param {string} query - Search query
 * @returns {Promise} Promise that resolves to news data
 */
function searchNews(query) {
    return fetch(`/api/news?query=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
}

/**
 * Render news items in the news container
 */
function renderNews() {
    if (!newsContainer) return;
    
    if (filteredNews.length === 0) {
        newsContainer.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <p class="text-muted">No financial news found.</p>
                    ${currentNewsFilter !== 'all' ? 
                        '<button class="btn btn-outline mt-2" id="reset-news-filter">Reset Filter</button>' : ''}
                </div>
            </div>
        `;
        
        // Add listener to reset filter button
        const resetButton = document.getElementById('reset-news-filter');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                currentNewsFilter = 'all';
                filteredNews = [...allNews];
                currentNewsPage = 1;
                renderNews();
                updateFilterUI();
            });
        }
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentNewsPage - 1) * newsPerPage;
    const endIndex = startIndex + newsPerPage;
    const newsToShow = filteredNews.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredNews.length / newsPerPage);
    
    // Build news HTML
    let newsHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title">Financial News</h5>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline dropdown-toggle" id="news-filter-button">
                        Filter: ${getFilterName(currentNewsFilter)}
                    </button>
                    <div class="dropdown-menu dropdown-menu-right" id="news-filter-menu">
                        <a href="#" class="dropdown-item ${currentNewsFilter === 'all' ? 'active' : ''}" data-filter="all">All News</a>
                        <a href="#" class="dropdown-item ${currentNewsFilter === 'positive' ? 'active' : ''}" data-filter="positive">Positive</a>
                        <a href="#" class="dropdown-item ${currentNewsFilter === 'negative' ? 'active' : ''}" data-filter="negative">Negative</a>
                        <a href="#" class="dropdown-item ${currentNewsFilter === 'neutral' ? 'active' : ''}" data-filter="neutral">Neutral</a>
                    </div>
                </div>
            </div>
            <div class="card-body">
    `;
    
    // News search form
    newsHTML += `
        <form id="news-search-form" class="mb-4">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Search financial news..." id="news-search-input">
                <div class="input-group-append">
                    <button class="btn btn-primary" type="submit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                </div>
            </div>
        </form>
    `;
    
    // News items
    newsToShow.forEach(news => {
        // Format date
        const date = new Date(news.published_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Sentiment badge
        let sentimentBadge = '';
        let sentimentClass = '';
        if (news.sentiment === 'positive') {
            sentimentBadge = '<span class="badge badge-success">Positive</span>';
            sentimentClass = 'sentiment-positive';
        } else if (news.sentiment === 'negative') {
            sentimentBadge = '<span class="badge badge-danger">Negative</span>';
            sentimentClass = 'sentiment-negative';
        } else {
            sentimentBadge = '<span class="badge badge-secondary">Neutral</span>';
            sentimentClass = 'sentiment-neutral';
        }
        
        // Stock symbols
        let symbolsHTML = '';
        if (news.symbols && news.symbols.length > 0) {
            symbolsHTML = '<div class="news-symbols mt-2">';
            news.symbols.forEach(symbol => {
                symbolsHTML += `<span class="badge badge-primary mr-1">${symbol}</span>`;
            });
            symbolsHTML += '</div>';
        }
        
        newsHTML += `
            <div class="news-item ${sentimentClass}">
                <h6 class="news-title">
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer">${news.title}</a>
                </h6>
                <div class="news-source">
                    <span>${news.source}</span>
                    <span class="news-date">${formattedDate}</span>
                    <span class="news-sentiment">${sentimentBadge}</span>
                </div>
                <div class="news-summary">${news.summary}</div>
                ${symbolsHTML}
            </div>
        `;
    });
    
    // Pagination
    if (totalPages > 1) {
        newsHTML += `</div><div class="card-footer">`;
        newsHTML += '<ul class="pagination justify-content-center mb-0">';
        
        // Previous button
        if (currentNewsPage > 1) {
            newsHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" id="news-prev-page">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </a>
                </li>
            `;
        } else {
            newsHTML += `
                <li class="page-item disabled">
                    <span class="page-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </span>
                </li>
            `;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentNewsPage) {
                newsHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                // Only show pages close to current page to avoid cluttering
                if (i === 1 || i === totalPages || (i >= currentNewsPage - 1 && i <= currentNewsPage + 1)) {
                    newsHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
                } else if (i === currentNewsPage - 2 || i === currentNewsPage + 2) {
                    newsHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
            }
        }
        
        // Next button
        if (currentNewsPage < totalPages) {
            newsHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" id="news-next-page">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                </li>
            `;
        } else {
            newsHTML += `
                <li class="page-item disabled">
                    <span class="page-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                </li>
            `;
        }
        
        newsHTML += '</ul>';
        newsHTML += '</div>';
    }
    
    newsHTML += '</div>';
    newsContainer.innerHTML = newsHTML;
    
    // Add event listeners to the newly created elements
    setupNewsListeners();
}

/**
 * Setup event listeners for news elements
 */
function setupNewsListeners() {
    // Filter dropdown toggle
    const filterButton = document.getElementById('news-filter-button');
    const filterMenu = document.getElementById('news-filter-menu');
    
    if (filterButton && filterMenu) {
        filterButton.addEventListener('click', (e) => {
            e.preventDefault();
            filterMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterButton.contains(e.target) && !filterMenu.contains(e.target)) {
                filterMenu.classList.remove('show');
            }
        });
        
        // Filter options
        const filterOptions = filterMenu.querySelectorAll('[data-filter]');
        filterOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                currentNewsFilter = option.getAttribute('data-filter');
                filterNews();
                filterMenu.classList.remove('show');
            });
        });
    }
    
    // Search form
    const searchForm = document.getElementById('news-search-form');
    const searchInput = document.getElementById('news-search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;
            
            searchNews(query)
                .then(data => {
                    allNews = data;
                    filteredNews = [...allNews];
                    currentNewsPage = 1;
                    currentNewsFilter = 'all';
                    renderNews();
                    updateFilterUI();
                })
                .catch(error => {
                    console.error('Error searching news:', error);
                    showNewsError('Failed to search for news. Please try again.');
                });
        });
    }
    
    // Pagination
    const prevPageBtn = document.getElementById('news-prev-page');
    const nextPageBtn = document.getElementById('news-next-page');
    const pageLinks = document.querySelectorAll('.pagination .page-link[data-page]');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentNewsPage > 1) {
                currentNewsPage--;
                renderNews();
                window.scrollTo({
                    top: newsContainer.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const totalPages = Math.ceil(filteredNews.length / newsPerPage);
            if (currentNewsPage < totalPages) {
                currentNewsPage++;
                renderNews();
                window.scrollTo({
                    top: newsContainer.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.getAttribute('data-page'));
            if (page !== currentNewsPage) {
                currentNewsPage = page;
                renderNews();
                window.scrollTo({
                    top: newsContainer.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Filter news based on currentNewsFilter
 */
function filterNews() {
    if (currentNewsFilter === 'all') {
        filteredNews = [...allNews];
    } else {
        filteredNews = allNews.filter(news => news.sentiment === currentNewsFilter);
    }
    
    currentNewsPage = 1;
    renderNews();
}

/**
 * Update filter UI to reflect current filter
 */
function updateFilterUI() {
    const filterButton = document.getElementById('news-filter-button');
    const filterOptions = document.querySelectorAll('#news-filter-menu .dropdown-item');
    
    if (filterButton) {
        filterButton.textContent = `Filter: ${getFilterName(currentNewsFilter)}`;
    }
    
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-filter') === currentNewsFilter);
        });
    }
}

/**
 * Get readable name for filter
 * @param {string} filter - Filter value
 * @returns {string} Readable filter name
 */
function getFilterName(filter) {
    switch (filter) {
        case 'positive': return 'Positive';
        case 'negative': return 'Negative';
        case 'neutral': return 'Neutral';
        default: return 'All News';
    }
}

/**
 * Show error message in news container
 * @param {string} message - Error message to display
 */
function showNewsError(message) {
    if (!newsContainer) return;
    
    newsContainer.innerHTML = `
        <div class="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ${message}
        </div>
    `;
}

// Initialize news module when document is ready
document.addEventListener('DOMContentLoaded', initializeNewsModule);
