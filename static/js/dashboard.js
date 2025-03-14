/**
 * Dashboard.js - Main JavaScript for the Financial Analytics Dashboard
 */

// DOM Elements
const dashboardEl = document.getElementById('dashboard');
const portfolioListEl = document.getElementById('portfolio-list');
const watchlistEl = document.getElementById('watchlist-container');
const newsContainerEl = document.getElementById('news-container');
const aiQueryInput = document.getElementById('ai-query');
const aiSubmitBtn = document.getElementById('ai-submit');
const aiResponseEl = document.getElementById('ai-response');
const aiChatMessages = document.getElementById('ai-chat-messages');
const marketSummaryEl = document.getElementById('market-summary');
const searchForm = document.getElementById('search-form');

// State
let portfolios = [];
let watchlists = [];
let newsItems = [];
let marketData = {};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initializeMarketSummary();
    initializePortfolios();
    initializeWatchlists();
    initializeNews();
    initializeAIChat();
    initializeSearch();
    
    // Add event listeners
    setupEventListeners();
    
    // Initialize tooltips and other UI enhancements
    initializeUI();
});

/**
 * Initializes market summary section
 */
function initializeMarketSummary() {
    fetchMarketSummary()
        .then(data => {
            marketData = data;
            renderMarketSummary();
        })
        .catch(error => {
            console.error('Error initializing market summary:', error);
            showErrorMessage(marketSummaryEl, 'Unable to load market data');
        });
}

/**
 * Fetches market summary data from the API
 */
function fetchMarketSummary() {
    return fetch('/api/market-summary')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

/**
 * Renders market summary data
 */
function renderMarketSummary() {
    if (!marketData.indices || marketData.indices.length === 0) {
        marketSummaryEl.innerHTML = '<div class="text-center text-muted">No market data available</div>';
        return;
    }
    
    let html = '<div class="card market-summary-card">';
    html += '<div class="card-header"><h5 class="card-title">Market Summary</h5></div>';
    html += '<div class="card-body">';
    
    marketData.indices.forEach(index => {
        const changeClass = index.change >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = index.change >= 0 ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        
        html += `
            <div class="market-index">
                <div class="market-index-name">${index.name}</div>
                <div class="d-flex align-items-center">
                    <div class="market-index-price mr-2">${formatCurrency(index.price)}</div>
                    <div class="${changeClass} d-flex align-items-center">
                        ${changeIcon}
                        ${formatPercentage(index.change_percent)}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    marketSummaryEl.innerHTML = html;
}

/**
 * Initializes portfolios
 */
function initializePortfolios() {
    fetchPortfolios()
        .then(data => {
            portfolios = data;
            renderPortfolios();
        })
        .catch(error => {
            console.error('Error initializing portfolios:', error);
            showErrorMessage(portfolioListEl, 'Unable to load portfolios');
        });
}

/**
 * Fetches portfolios from the API
 */
function fetchPortfolios() {
    return fetch('/api/portfolios')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

/**
 * Renders portfolios
 */
function renderPortfolios() {
    if (portfolios.length === 0) {
        portfolioListEl.innerHTML = `
            <div class="text-center p-4">
                <p class="text-muted">No portfolios yet.</p>
                <button id="create-portfolio-btn" class="btn btn-primary mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Create Portfolio
                </button>
            </div>
        `;
        
        document.getElementById('create-portfolio-btn').addEventListener('click', showCreatePortfolioModal);
        return;
    }
    
    let html = '';
    
    portfolios.forEach(portfolio => {
        // Calculate total value and performance
        let totalValue = 0;
        let totalCost = 0;
        let holdingsHtml = '';
        
        portfolio.holdings.forEach(holding => {
            totalValue += holding.value;
            totalCost += holding.purchase_price * holding.quantity;
            
            const profitLossClass = holding.profit_loss >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = holding.profit_loss >= 0 ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
            
            holdingsHtml += `
                <div class="stock-holding d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <div class="stock-symbol">${holding.symbol}</div>
                        <div class="text-muted">${holding.quantity} shares</div>
                    </div>
                    <div class="text-right">
                        <div>${formatCurrency(holding.current_price)}</div>
                        <div class="${profitLossClass} d-flex align-items-center justify-content-end">
                            ${changeIcon}
                            ${formatCurrency(holding.profit_loss)} (${formatPercentage((holding.current_price / holding.purchase_price - 1) * 100)})
                        </div>
                    </div>
                </div>
            `;
        });
        
        const totalProfitLoss = totalValue - totalCost;
        const totalProfitLossPercentage = totalCost > 0 ? ((totalValue / totalCost - 1) * 100) : 0;
        const profitLossClass = totalProfitLoss >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = totalProfitLoss >= 0 ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        
        html += `
            <div class="card portfolio-card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title m-0">${portfolio.name}</h5>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline" data-toggle="dropdown">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </button>
                        <div class="dropdown-menu dropdown-menu-right">
                            <a href="#" class="dropdown-item add-holding" data-portfolio-id="${portfolio.id}">Add Holding</a>
                            <a href="#" class="dropdown-item edit-portfolio" data-portfolio-id="${portfolio.id}">Edit Portfolio</a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item text-danger delete-portfolio" data-portfolio-id="${portfolio.id}">Delete Portfolio</a>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="portfolio-summary mb-4">
                        <div>
                            <h6 class="text-white-50 mb-1">Total Value</h6>
                            <div class="portfolio-value">${formatCurrency(totalValue)}</div>
                            <div class="${profitLossClass} portfolio-change">
                                ${changeIcon}
                                ${formatCurrency(totalProfitLoss)} (${formatPercentage(totalProfitLossPercentage)})
                            </div>
                        </div>
                        <div>
                            <canvas id="portfolio-chart-${portfolio.id}" width="100" height="60"></canvas>
                        </div>
                    </div>
                    <h6 class="mb-3">Holdings</h6>
                    ${portfolio.holdings.length > 0 ? holdingsHtml : '<p class="text-muted">No holdings in this portfolio yet.</p>'}
                    <button class="btn btn-sm btn-outline mt-3 add-holding" data-portfolio-id="${portfolio.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Stock
                    </button>
                </div>
            </div>
        `;
    });
    
    // Add button to create a new portfolio
    html += `
        <div class="text-center mb-4">
            <button id="create-portfolio-btn" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create Portfolio
            </button>
        </div>
    `;
    
    portfolioListEl.innerHTML = html;
    
    // Initialize portfolio charts
    portfolios.forEach(portfolio => {
        if (portfolio.holdings.length > 0) {
            initializePortfolioChart(portfolio.id, portfolio.holdings);
        }
    });
    
    // Add event listeners
    document.getElementById('create-portfolio-btn').addEventListener('click', showCreatePortfolioModal);
    
    document.querySelectorAll('.add-holding').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const portfolioId = button.getAttribute('data-portfolio-id');
            showAddHoldingModal(portfolioId);
        });
    });
    
    document.querySelectorAll('.edit-portfolio').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const portfolioId = button.getAttribute('data-portfolio-id');
            showEditPortfolioModal(portfolioId);
        });
    });
    
    document.querySelectorAll('.delete-portfolio').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const portfolioId = button.getAttribute('data-portfolio-id');
            showDeletePortfolioModal(portfolioId);
        });
    });
}

/**
 * Initializes a chart for a portfolio
 */
function initializePortfolioChart(portfolioId, holdings) {
    const chartEl = document.getElementById(`portfolio-chart-${portfolioId}`);
    if (!chartEl) return;
    
    // Create data for chart
    const labels = holdings.map(holding => holding.symbol);
    const data = holdings.map(holding => holding.value);
    const backgroundColors = [
        '#2fbbf3', '#4e54c8', '#8c54f8', '#c32bae', '#eb367f', '#ff6b53', '#ffa600',
        '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c', '#34495e'
    ];
    
    // Create chart
    new Chart(chartEl, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = context.parsed >= 0 ? Math.round((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initializes watchlists
 */
function initializeWatchlists() {
    fetchWatchlists()
        .then(data => {
            watchlists = data;
            renderWatchlists();
        })
        .catch(error => {
            console.error('Error initializing watchlists:', error);
            showErrorMessage(watchlistEl, 'Unable to load watchlists');
        });
}

/**
 * Fetches watchlists from the API
 */
function fetchWatchlists() {
    return fetch('/api/watchlists')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

/**
 * Renders watchlists
 */
function renderWatchlists() {
    if (watchlists.length === 0) {
        watchlistEl.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <p class="text-muted">No watchlists yet.</p>
                    <button id="create-watchlist-btn" class="btn btn-primary mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create Watchlist
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('create-watchlist-btn').addEventListener('click', showCreateWatchlistModal);
        return;
    }
    
    let html = '';
    
    watchlists.forEach(watchlist => {
        let stocksHtml = '';
        
        if (watchlist.stocks.length === 0) {
            stocksHtml = '<p class="text-muted">No stocks in this watchlist yet.</p>';
        } else {
            watchlist.stocks.forEach(stock => {
                const changeClass = stock.change >= 0 ? 'text-success' : 'text-danger';
                const changeIcon = stock.change >= 0 ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
                
                stocksHtml += `
                    <div class="watchlist-item">
                        <div class="watchlist-symbol">${stock.symbol}</div>
                        <div class="d-flex align-items-center">
                            <div class="watchlist-price mr-2">${formatCurrency(stock.price)}</div>
                            <div class="${changeClass} d-flex align-items-center">
                                ${changeIcon}
                                ${formatPercentage(stock.change_percent)}
                            </div>
                            <button class="btn btn-sm btn-outline ml-2 remove-stock" data-watchlist-id="${watchlist.id}" data-stock-id="${stock.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
            <div class="card watchlist-card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title m-0">${watchlist.name}</h5>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline" data-toggle="dropdown">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </button>
                        <div class="dropdown-menu dropdown-menu-right">
                            <a href="#" class="dropdown-item edit-watchlist" data-watchlist-id="${watchlist.id}">Edit Watchlist</a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item text-danger delete-watchlist" data-watchlist-id="${watchlist.id}">Delete Watchlist</a>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    ${stocksHtml}
                    <form class="add-symbol-form mt-3" data-watchlist-id="${watchlist.id}">
                        <input type="text" class="form-control" placeholder="Add symbol (e.g. AAPL)" required>
                        <button type="submit" class="btn btn-primary ml-2">Add</button>
                    </form>
                </div>
            </div>
        `;
    });
    
    // Add button to create a new watchlist
    html += `
        <div class="text-center mb-4">
            <button id="create-watchlist-btn" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create Watchlist
            </button>
        </div>
    `;
    
    watchlistEl.innerHTML = html;
    
    // Add event listeners
    document.getElementById('create-watchlist-btn').addEventListener('click', showCreateWatchlistModal);
    
    document.querySelectorAll('.edit-watchlist').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const watchlistId = button.getAttribute('data-watchlist-id');
            showEditWatchlistModal(watchlistId);
        });
    });
    
    document.querySelectorAll('.delete-watchlist').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const watchlistId = button.getAttribute('data-watchlist-id');
            showDeleteWatchlistModal(watchlistId);
        });
    });
    
    document.querySelectorAll('.remove-stock').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const watchlistId = button.getAttribute('data-watchlist-id');
            const stockId = button.getAttribute('data-stock-id');
            removeStockFromWatchlist(watchlistId, stockId);
        });
    });
    
    document.querySelectorAll('.add-symbol-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const watchlistId = form.getAttribute('data-watchlist-id');
            const symbol = form.querySelector('input').value.trim().toUpperCase();
            addStockToWatchlist(watchlistId, symbol);
            form.reset();
        });
    });
}

/**
 * Initializes news section
 */
function initializeNews() {
    fetchNews()
        .then(data => {
            newsItems = data;
            renderNews();
        })
        .catch(error => {
            console.error('Error initializing news:', error);
            showErrorMessage(newsContainerEl, 'Unable to load financial news');
        });
}

/**
 * Fetches news from the API
 */
function fetchNews(query = '') {
    let url = '/api/news';
    if (query) {
        url += `?query=${encodeURIComponent(query)}`;
    }
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

/**
 * Renders news items
 */
function renderNews() {
    if (newsItems.length === 0) {
        newsContainerEl.innerHTML = '<div class="text-center text-muted p-4">No financial news available</div>';
        return;
    }
    
    let html = '<div class="card">';
    html += '<div class="card-header">';
    html += '<h5 class="card-title">Financial News</h5>';
    html += '</div>';
    html += '<div class="card-body">';
    
    newsItems.forEach(news => {
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
        if (news.sentiment === 'positive') {
            sentimentBadge = '<span class="badge badge-success">Positive</span>';
        } else if (news.sentiment === 'negative') {
            sentimentBadge = '<span class="badge badge-danger">Negative</span>';
        } else {
            sentimentBadge = '<span class="badge badge-secondary">Neutral</span>';
        }
        
        // Stock symbols
        let symbolsHtml = '';
        if (news.symbols && news.symbols.length > 0) {
            symbolsHtml = '<div class="news-symbols mt-2">';
            news.symbols.forEach(symbol => {
                symbolsHtml += `<span class="badge badge-primary mr-1">${symbol}</span>`;
            });
            symbolsHtml += '</div>';
        }
        
        html += `
            <div class="news-item">
                <h6 class="news-title">
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer">${news.title}</a>
                </h6>
                <div class="news-source">
                    <span>${news.source}</span>
                    <span class="news-date">${formattedDate}</span>
                    <span class="news-sentiment">${sentimentBadge}</span>
                </div>
                <div class="news-summary">${news.summary}</div>
                ${symbolsHtml}
            </div>
        `;
    });
    
    html += '</div></div>';
    newsContainerEl.innerHTML = html;
}

/**
 * Initializes AI chat
 */
function initializeAIChat() {
    if (!aiQueryInput || !aiSubmitBtn || !aiChatMessages) return;
    
    aiSubmitBtn.addEventListener('click', () => {
        const query = aiQueryInput.value.trim();
        if (!query) return;
        
        // Add user message to chat
        const userMessageEl = document.createElement('div');
        userMessageEl.className = 'message message-user';
        userMessageEl.textContent = query;
        aiChatMessages.appendChild(userMessageEl);
        
        // Clear input
        aiQueryInput.value = '';
        
        // Show loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message message-ai';
        loadingEl.innerHTML = '<div class="spinner"></div>';
        aiChatMessages.appendChild(loadingEl);
        
        // Scroll to bottom
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        
        // Send query to AI
        sendAIQuery(query)
            .then(response => {
                // Remove loading indicator
                aiChatMessages.removeChild(loadingEl);
                
                // Add AI response to chat
                const aiMessageEl = document.createElement('div');
                aiMessageEl.className = 'message message-ai';
                aiMessageEl.textContent = response.response;
                aiChatMessages.appendChild(aiMessageEl);
                
                // Scroll to bottom
                aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
            })
            .catch(error => {
                // Remove loading indicator
                aiChatMessages.removeChild(loadingEl);
                
                // Add error message
                const errorMessageEl = document.createElement('div');
                errorMessageEl.className = 'message message-ai text-danger';
                errorMessageEl.textContent = `Error: ${error.message}`;
                aiChatMessages.appendChild(errorMessageEl);
                
                // Scroll to bottom
                aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
            });
    });
    
    // Submit on Enter key
    aiQueryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            aiSubmitBtn.click();
        }
    });
}

/**
 * Sends a query to the AI service
 */
function sendAIQuery(query) {
    return fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

/**
 * Initializes search functionality
 */
function initializeSearch() {
    if (!searchForm) return;
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;
        
        // Search for news related to the query
        fetchNews(query)
            .then(data => {
                newsItems = data;
                renderNews();
                
                // Scroll to news section
                newsContainerEl.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error searching news:', error);
                showErrorMessage(newsContainerEl, 'Unable to search for news');
            });
    });
}

/**
 * Sets up global event listeners
 */
function setupEventListeners() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('open');
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdowns = document.querySelectorAll('.dropdown-menu.show');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target) && !e.target.classList.contains('dropdown-toggle')) {
                dropdown.classList.remove('show');
            }
        });
    });
}

/**
 * Initializes UI enhancements (like dropdowns, tooltips, etc.)
 */
function initializeUI() {
    // Initialize dropdowns
    document.querySelectorAll('[data-toggle="dropdown"]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = button.nextElementSibling;
            dropdown.classList.toggle('show');
        });
    });
}

/**
 * Shows an error message in a container
 */
function showErrorMessage(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ${message}
        </div>
    `;
}

/**
 * Shows a modal to create a new portfolio
 */
function showCreatePortfolioModal() {
    const modalHtml = `
        <div class="modal fade show" id="createPortfolioModal" tabindex="-1" style="display: block;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Portfolio</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="create-portfolio-form">
                            <div class="form-group">
                                <label for="portfolio-name">Portfolio Name</label>
                                <input type="text" class="form-control" id="portfolio-name" required>
                            </div>
                            <div class="form-group">
                                <label for="portfolio-description">Description (optional)</label>
                                <textarea class="form-control" id="portfolio-description"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="create-portfolio-submit">Create</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    document.body.classList.add('modal-open');
    
    // Add event listeners
    const closeButtons = modalContainer.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            document.body.classList.remove('modal-open');
        });
    });
    
    const createButton = modalContainer.querySelector('#create-portfolio-submit');
    createButton.addEventListener('click', () => {
        const name = modalContainer.querySelector('#portfolio-name').value.trim();
        const description = modalContainer.querySelector('#portfolio-description').value.trim();
        
        if (!name) return;
        
        createPortfolio(name, description)
            .then(() => {
                document.body.removeChild(modalContainer);
                document.body.classList.remove('modal-open');
                
                // Refresh portfolios
                initializePortfolios();
            })
            .catch(error => {
                console.error('Error creating portfolio:', error);
                alert('Error creating portfolio. Please try again.');
            });
    });
}

/**
 * Creates a new portfolio
 */
function createPortfolio(name, description) {
    return fetch('/api/portfolios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

/**
 * Shows a modal to add a holding to a portfolio
 */
function showAddHoldingModal(portfolioId) {
    const modalHtml = `
        <div class="modal fade show" id="addHoldingModal" tabindex="-1" style="display: block;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Stock</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="add-holding-form">
                            <div class="form-group">
                                <label for="holding-symbol">Stock Symbol</label>
                                <input type="text" class="form-control" id="holding-symbol" placeholder="e.g. AAPL" required>
                            </div>
                            <div class="form-group">
                                <label for="holding-quantity">Quantity</label>
                                <input type="number" class="form-control" id="holding-quantity" min="0.01" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="holding-price">Purchase Price</label>
                                <div class="input-group">
                                    <div class="input-group-prepend">
                                        <span class="input-group-text">$</span>
                                    </div>
                                    <input type="number" class="form-control" id="holding-price" min="0.01" step="0.01" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="add-holding-submit">Add</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    document.body.classList.add('modal-open');
    
    // Add event listeners
    const closeButtons = modalContainer.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            document.body.classList.remove('modal-open');
        });
    });
    
    const addButton = modalContainer.querySelector('#add-holding-submit');
    addButton.addEventListener('click', () => {
        const symbol = modalContainer.querySelector('#holding-symbol').value.trim().toUpperCase();
        const quantity = parseFloat(modalContainer.querySelector('#holding-quantity').value);
        const purchasePrice = parseFloat(modalContainer.querySelector('#holding-price').value);
        
        if (!symbol || isNaN(quantity) || isNaN(purchasePrice)) return;
        
        addHolding(portfolioId, symbol, quantity, purchasePrice)
            .then(() => {
                document.body.removeChild(modalContainer);
                document.body.classList.remove('modal-open');
                
                // Refresh portfolios
                initializePortfolios();
            })
            .catch(error => {
                console.error('Error adding holding:', error);
                alert('Error adding holding. Please try again.');
            });
    });
}

/**
 * Adds a holding to a portfolio
 */
function addHolding(portfolioId, symbol, quantity, purchasePrice) {
    return fetch(`/api/portfolios/${portfolioId}/holdings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            symbol,
            quantity,
            purchase_price: purchasePrice
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

/**
 * Utility function to format currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Utility function to format percentage
 */
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value / 100);
}
