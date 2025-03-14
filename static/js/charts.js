/**
 * Financial Analytics Dashboard Charts
 * This file handles the creation and rendering of all charts used in the dashboard
 */

// Chart color palette - using the dark theme colors
const chartColors = {
    primary: '#2fbbf3',
    secondary: '#4e54c8',
    tertiary: '#8c54f8',
    quartenary: '#c32bae',
    quinary: '#eb367f',
    success: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    text: '#e6e6e6',
    background: '#1a1a1a',
    muted: '#666'
};

// Default chart options for consistent styling
const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 1000,
        easing: 'easeOutQuart'
    },
    plugins: {
        legend: {
            labels: {
                color: chartColors.text,
                font: {
                    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(36, 36, 36, 0.9)',
            titleColor: chartColors.text,
            bodyColor: chartColors.text,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 4,
            displayColors: true,
            boxPadding: 4,
            bodyFont: {
                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
            },
            titleFont: {
                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                weight: 'bold'
            }
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
            },
            ticks: {
                color: chartColors.muted,
                font: {
                    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                }
            }
        },
        y: {
            grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
            },
            ticks: {
                color: chartColors.muted,
                font: {
                    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                }
            }
        }
    }
};

/**
 * Creates a portfolio allocation chart (doughnut)
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} holdings - Array of portfolio holdings
 */
function createPortfolioAllocationChart(elementId, holdings) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;
    
    // Extract data from holdings
    const labels = holdings.map(holding => holding.symbol);
    const values = holdings.map(holding => holding.value);
    const colors = [
        chartColors.primary,
        chartColors.secondary,
        chartColors.tertiary,
        chartColors.quartenary,
        chartColors.quinary,
        chartColors.success,
        chartColors.info,
        chartColors.warning,
        '#9b59b6', // Additional colors for larger portfolios
        '#1abc9c',
        '#34495e',
        '#16a085',
        '#27ae60',
        '#2980b9',
        '#8e44ad',
        '#f1c40f'
    ];
    
    // Create chart configuration
    const config = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: chartColors.background
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: chartColors.text,
                        font: {
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(36, 36, 36, 0.9)',
                    titleColor: chartColors.text,
                    bodyColor: chartColors.text,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    };
    
    return new Chart(ctx, config);
}

/**
 * Creates a line chart for stock price history
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} data - Array of price data points
 * @param {string} symbol - Stock symbol
 */
function createStockPriceChart(elementId, data, symbol) {
    const ctx = document.getElementById(elementId);
    if (!ctx || !data || data.length === 0) return null;
    
    // Process data
    const dates = data.map(item => new Date(item.date).toLocaleDateString());
    const prices = data.map(item => item.close);
    
    // Determine color based on performance
    const startPrice = prices[prices.length - 1];
    const endPrice = prices[0];
    const isPositive = endPrice >= startPrice;
    const lineColor = isPositive ? chartColors.success : chartColors.danger;
    
    // Create gradient fill
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, isPositive ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    // Create chart configuration
    const config = {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: `${symbol} Price`,
                data: prices,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: lineColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Price: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    };
    
    return new Chart(ctx, config);
}

/**
 * Creates a performance comparison chart
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} portfolioData - Array of portfolio performance data points
 * @param {Array} benchmarkData - Array of benchmark performance data points
 */
function createPerformanceComparisonChart(elementId, portfolioData, benchmarkData) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;
    
    // Process data (assuming data is normalized to percentage change)
    const dates = portfolioData.map(item => item.date);
    const portfolioValues = portfolioData.map(item => item.value);
    const benchmarkValues = benchmarkData.map(item => item.value);
    
    // Create chart configuration
    const config = {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Portfolio',
                    data: portfolioValues,
                    borderColor: chartColors.primary,
                    backgroundColor: 'rgba(47, 187, 243, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: chartColors.primary,
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'S&P 500',
                    data: benchmarkValues,
                    borderColor: chartColors.secondary,
                    backgroundColor: 'rgba(78, 84, 200, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: chartColors.secondary,
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.3,
                    fill: false,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                ...defaultChartOptions.scales,
                y: {
                    ...defaultChartOptions.scales.y,
                    ticks: {
                        ...defaultChartOptions.scales.y.ticks,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    };
    
    return new Chart(ctx, config);
}

/**
 * Creates a market sentiment chart
 * @param {string} elementId - The ID of the canvas element
 * @param {Object} sentimentData - Object with sentiment data
 */
function createMarketSentimentChart(elementId, sentimentData) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;
    
    // Create chart configuration
    const config = {
        type: 'radar',
        data: {
            labels: ['Bullish', 'Bearish', 'Neutral', 'Fear', 'Greed', 'Momentum'],
            datasets: [{
                label: 'Current Sentiment',
                data: [
                    sentimentData.bullish,
                    sentimentData.bearish,
                    sentimentData.neutral,
                    sentimentData.fear,
                    sentimentData.greed,
                    sentimentData.momentum
                ],
                backgroundColor: 'rgba(78, 84, 200, 0.3)',
                borderColor: chartColors.secondary,
                borderWidth: 2,
                pointBackgroundColor: chartColors.secondary,
                pointBorderColor: '#fff',
                pointHoverRadius: 5
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        display: false
                    },
                    pointLabels: {
                        color: chartColors.text,
                        font: {
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(36, 36, 36, 0.9)',
                    titleColor: chartColors.text,
                    bodyColor: chartColors.text,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    };
    
    return new Chart(ctx, config);
}

/**
 * Creates a simple bar chart for sector performance
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} sectorData - Array of sector performance data
 */
function createSectorPerformanceChart(elementId, sectorData) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;
    
    // Process data
    const sectors = sectorData.map(item => item.name);
    const performances = sectorData.map(item => item.performance);
    
    // Create custom colors based on performance
    const barColors = performances.map(perf => {
        if (perf > 1.5) return chartColors.success;
        if (perf > 0) return 'rgba(46, 204, 113, 0.7)';
        if (perf > -1.5) return 'rgba(231, 76, 60, 0.7)';
        return chartColors.danger;
    });
    
    // Create chart configuration
    const config = {
        type: 'bar',
        data: {
            labels: sectors,
            datasets: [{
                label: 'Sector Performance',
                data: performances,
                backgroundColor: barColors,
                borderColor: barColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            ...defaultChartOptions,
            indexAxis: 'y',
            plugins: {
                ...defaultChartOptions.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Performance: ${context.raw > 0 ? '+' : ''}${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ...defaultChartOptions.scales.x,
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    };
    
    return new Chart(ctx, config);
}

/**
 * Utility function to format currency
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
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
 * Creates a market volume chart
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} volumeData - Array of volume data points
 */
function createVolumeChart(elementId, volumeData) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;
    
    // Process data
    const dates = volumeData.map(item => item.date);
    const volumes = volumeData.map(item => item.volume);
    
    // Create chart configuration
    const config = {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Trading Volume',
                data: volumes,
                backgroundColor: 'rgba(78, 84, 200, 0.5)',
                borderColor: chartColors.secondary,
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const volume = context.raw;
                            if (volume >= 1000000000) {
                                return `Volume: ${(volume / 1000000000).toFixed(2)}B`;
                            } else if (volume >= 1000000) {
                                return `Volume: ${(volume / 1000000).toFixed(2)}M`;
                            } else if (volume >= 1000) {
                                return `Volume: ${(volume / 1000).toFixed(2)}K`;
                            }
                            return `Volume: ${volume}`;
                        }
                    }
                }
            },
            scales: {
                ...defaultChartOptions.scales,
                y: {
                    ...defaultChartOptions.scales.y,
                    ticks: {
                        ...defaultChartOptions.scales.y.ticks,
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1) + 'B';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K';
                            }
                            return value;
                        }
                    }
                }
            }
        }
    };
    
    return new Chart(ctx, config);
}
