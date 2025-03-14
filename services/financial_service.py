import os
import logging
import requests
from datetime import datetime, timedelta
import json
from typing import Dict, Any, List

# Set up logging
logger = logging.getLogger(__name__)

# You would normally use a real financial data API like Alpha Vantage, Yahoo Finance, or similar
# For now, we'll create a simple mock implementation that would be replaced with real API calls
# Get API key from environment variables
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "")

def get_stock_data(symbol: str) -> Dict[str, Any]:
    """
    Get stock data for a given symbol using Alpha Vantage API.
    
    Args:
        symbol (str): The stock symbol to get data for.
        
    Returns:
        Dict[str, Any]: Stock data including price, change, volume, etc.
    """
    try:
        if not ALPHA_VANTAGE_API_KEY:
            logger.warning("ALPHA_VANTAGE_API_KEY is not set in environment variables")
            # Return dummy data for development/testing
            return {
                "symbol": symbol,
                "price": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "volume": 0,
                "market_cap": 0.0,
                "pe_ratio": 0.0,
                "dividend_yield": 0.0,
                "error": "API key not configured"
            }
        
        # Make request to Alpha Vantage API
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Error fetching stock data: {response.status_code}")
            return {
                "symbol": symbol,
                "price": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "volume": 0,
                "market_cap": 0.0,
                "pe_ratio": 0.0,
                "dividend_yield": 0.0,
                "error": f"API error: {response.status_code}"
            }
        
        data = response.json()
        
        # Check if we have data
        if "Global Quote" not in data or not data["Global Quote"]:
            logger.error(f"No data found for symbol: {symbol}")
            return {
                "symbol": symbol,
                "price": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "volume": 0,
                "market_cap": 0.0,
                "pe_ratio": 0.0,
                "dividend_yield": 0.0,
                "error": "No data found"
            }
        
        quote = data["Global Quote"]
        
        # Parse data
        price = float(quote.get("05. price", 0))
        change = float(quote.get("09. change", 0))
        change_percent = float(quote.get("10. change percent", "0%").replace("%", ""))
        volume = int(quote.get("06. volume", 0))
        
        # Get additional data - this would typically come from a different API call
        # For now, we'll provide placeholder values
        market_cap = 0.0
        pe_ratio = 0.0
        dividend_yield = 0.0
        
        return {
            "symbol": symbol,
            "price": price,
            "change": change,
            "change_percent": change_percent,
            "volume": volume,
            "market_cap": market_cap,
            "pe_ratio": pe_ratio,
            "dividend_yield": dividend_yield
        }
    
    except Exception as e:
        logger.error(f"Error getting stock data for {symbol}: {str(e)}")
        return {
            "symbol": symbol,
            "price": 0.0,
            "change": 0.0,
            "change_percent": 0.0,
            "volume": 0,
            "market_cap": 0.0,
            "pe_ratio": 0.0,
            "dividend_yield": 0.0,
            "error": str(e)
        }


def get_market_summary() -> Dict[str, Any]:
    """
    Get a summary of the market including major indices.
    
    Returns:
        Dict[str, Any]: Market summary data
    """
    try:
        if not ALPHA_VANTAGE_API_KEY:
            logger.warning("ALPHA_VANTAGE_API_KEY is not set in environment variables")
            # Return dummy data for development/testing
            return {
                "indices": [
                    {
                        "symbol": "SPY",
                        "name": "S&P 500",
                        "price": 0.0,
                        "change": 0.0,
                        "change_percent": 0.0
                    },
                    {
                        "symbol": "DIA",
                        "name": "Dow Jones Industrial Average",
                        "price": 0.0,
                        "change": 0.0,
                        "change_percent": 0.0
                    },
                    {
                        "symbol": "QQQ",
                        "name": "NASDAQ-100",
                        "price": 0.0,
                        "change": 0.0,
                        "change_percent": 0.0
                    }
                ],
                "sectors": [],
                "error": "API key not configured"
            }
        
        # Get data for major indices
        indices = ["SPY", "DIA", "QQQ"]
        index_data = []
        
        for symbol in indices:
            stock_data = get_stock_data(symbol)
            
            # Map symbols to proper names
            name_map = {
                "SPY": "S&P 500",
                "DIA": "Dow Jones Industrial Average",
                "QQQ": "NASDAQ-100"
            }
            
            index_data.append({
                "symbol": symbol,
                "name": name_map.get(symbol, symbol),
                "price": stock_data["price"],
                "change": stock_data["change"],
                "change_percent": stock_data["change_percent"]
            })
        
        # In a real implementation, we would also get sector performance
        # For now, we'll provide placeholder data
        
        return {
            "indices": index_data,
            "sectors": []  # Would include sector performance data
        }
    
    except Exception as e:
        logger.error(f"Error getting market summary: {str(e)}")
        return {
            "indices": [],
            "sectors": [],
            "error": str(e)
        }


def get_historical_data(symbol: str, days: int = 30) -> List[Dict[str, Any]]:
    """
    Get historical price data for a stock.
    
    Args:
        symbol (str): The stock symbol
        days (int): Number of days of historical data to return
        
    Returns:
        List[Dict[str, Any]]: List of daily price data
    """
    try:
        if not ALPHA_VANTAGE_API_KEY:
            logger.warning("ALPHA_VANTAGE_API_KEY is not set in environment variables")
            # Return dummy data for development/testing
            return []
        
        # Make request to Alpha Vantage API
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=compact&apikey={ALPHA_VANTAGE_API_KEY}"
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Error fetching historical data: {response.status_code}")
            return []
        
        data = response.json()
        
        # Check if we have data
        if "Time Series (Daily)" not in data:
            logger.error(f"No historical data found for symbol: {symbol}")
            return []
        
        time_series = data["Time Series (Daily)"]
        
        # Convert to list and limit to requested number of days
        historical_data = []
        
        for date, values in list(time_series.items())[:days]:
            historical_data.append({
                "date": date,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"])
            })
        
        # Sort by date (newest first)
        historical_data.sort(key=lambda x: x["date"], reverse=True)
        
        return historical_data
    
    except Exception as e:
        logger.error(f"Error getting historical data for {symbol}: {str(e)}")
        return []
