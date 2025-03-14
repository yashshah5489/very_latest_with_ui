import os
import logging
from datetime import datetime
from tavily import TavilyClient
from typing import List, Dict, Any

# Set up logging
logger = logging.getLogger(__name__)

# Get API key from environment variable
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")

# Function to get Tavily client
def get_tavily_client():
    if not TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY is not set in environment variables")
        return None
    
    return TavilyClient(api_key=TAVILY_API_KEY)

def get_latest_news(max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Get the latest financial news using Tavily.
    
    Args:
        max_results (int, optional): Maximum number of news items to return. Defaults to 10.
    
    Returns:
        List[Dict[str, Any]]: List of news items with title, url, source, published_at, and summary.
    """
    try:
        if not TAVILY_API_KEY:
            logger.error("TAVILY_API_KEY is not set in environment variables")
            return [{"title": "Error", "url": "#", "source": "System", 
                     "published_at": datetime.now(), "summary": "API key not configured"}]
        
        # Get Tavily client
        tavily = get_tavily_client()
        if not tavily:
            return [{"title": "Error", "url": "#", "source": "System", 
                     "published_at": datetime.now(), "summary": "API key not configured"}]
                     
        # Query for financial news
        search_results = tavily.search(
            query="latest financial news stock market",
            search_depth="advanced",
            include_domains=["bloomberg.com", "cnbc.com", "reuters.com", "wsj.com", 
                              "ft.com", "marketwatch.com", "investing.com", "finance.yahoo.com"],
            max_results=max_results
        )
        
        # Process and format results
        news_items = []
        for result in search_results['results']:
            # Parse the published date
            published_at = datetime.now()  # Default to now if not available
            if 'published_date' in result:
                try:
                    published_at = datetime.fromisoformat(result['published_date'])
                except (ValueError, TypeError):
                    pass
            
            # Extract stock symbols from content if available
            symbols = []
            if 'content' in result:
                # Simple regex-like check for ticker symbols
                content = result['content']
                words = content.split()
                for word in words:
                    if word.startswith('$') and len(word) > 1 and word[1:].isalpha():
                        symbols.append(word[1:])
            
            # Calculate simple sentiment
            sentiment = "neutral"
            positive_words = ["gain", "rise", "up", "increase", "profit", "bull", "growth", "positive"]
            negative_words = ["loss", "fall", "down", "decrease", "deficit", "bear", "recession", "negative"]
            
            if 'content' in result:
                content_lower = result['content'].lower()
                positive_count = sum(1 for word in positive_words if word in content_lower)
                negative_count = sum(1 for word in negative_words if word in content_lower)
                
                if positive_count > negative_count:
                    sentiment = "positive"
                elif negative_count > positive_count:
                    sentiment = "negative"
            
            # Add to news items
            news_items.append({
                "title": result['title'],
                "url": result['url'],
                "source": result.get('source', 'Unknown'),
                "published_at": published_at,
                "summary": result.get('content', '')[:300] + '...' if 'content' in result else '',
                "sentiment": sentiment,
                "symbols": list(set(symbols))  # Remove duplicates
            })
        
        # Sort by published date (newest first)
        news_items.sort(key=lambda x: x['published_at'], reverse=True)
        
        return news_items
    
    except Exception as e:
        logger.error(f"Error fetching news from Tavily: {str(e)}")
        return [{"title": f"Error: {str(e)}", "url": "#", "source": "System", 
                 "published_at": datetime.now(), "summary": "An error occurred while fetching financial news."}]


def search_news(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search for financial news using Tavily.
    
    Args:
        query (str): The search query.
        max_results (int, optional): Maximum number of news items to return. Defaults to 10.
    
    Returns:
        List[Dict[str, Any]]: List of news items with title, url, source, published_at, and summary.
    """
    try:
        if not TAVILY_API_KEY:
            logger.error("TAVILY_API_KEY is not set in environment variables")
            return [{"title": "Error", "url": "#", "source": "System", 
                     "published_at": datetime.now(), "summary": "API key not configured"}]
        
        # Add financial context to the query
        financial_query = f"{query} financial news stock market"
        
        # Get Tavily client
        tavily = get_tavily_client()
        if not tavily:
            return [{"title": "Error", "url": "#", "source": "System", 
                     "published_at": datetime.now(), "summary": "API key not configured"}]
        
        # Query for financial news
        search_results = tavily.search(
            query=financial_query,
            search_depth="advanced",
            include_domains=["bloomberg.com", "cnbc.com", "reuters.com", "wsj.com", 
                              "ft.com", "marketwatch.com", "investing.com", "finance.yahoo.com"],
            max_results=max_results
        )
        
        # Process and format results
        news_items = []
        for result in search_results['results']:
            # Parse the published date
            published_at = datetime.now()  # Default to now if not available
            if 'published_date' in result:
                try:
                    published_at = datetime.fromisoformat(result['published_date'])
                except (ValueError, TypeError):
                    pass
            
            # Extract stock symbols from content if available
            symbols = []
            if 'content' in result:
                # Simple regex-like check for ticker symbols
                content = result['content']
                words = content.split()
                for word in words:
                    if word.startswith('$') and len(word) > 1 and word[1:].isalpha():
                        symbols.append(word[1:])
            
            # Calculate simple sentiment
            sentiment = "neutral"
            positive_words = ["gain", "rise", "up", "increase", "profit", "bull", "growth", "positive"]
            negative_words = ["loss", "fall", "down", "decrease", "deficit", "bear", "recession", "negative"]
            
            if 'content' in result:
                content_lower = result['content'].lower()
                positive_count = sum(1 for word in positive_words if word in content_lower)
                negative_count = sum(1 for word in negative_words if word in content_lower)
                
                if positive_count > negative_count:
                    sentiment = "positive"
                elif negative_count > positive_count:
                    sentiment = "negative"
            
            # Add to news items
            news_items.append({
                "title": result['title'],
                "url": result['url'],
                "source": result.get('source', 'Unknown'),
                "published_at": published_at,
                "summary": result.get('content', '')[:300] + '...' if 'content' in result else '',
                "sentiment": sentiment,
                "symbols": list(set(symbols))  # Remove duplicates
            })
        
        # Sort by published date (newest first)
        news_items.sort(key=lambda x: x['published_at'], reverse=True)
        
        return news_items
    
    except Exception as e:
        logger.error(f"Error searching news from Tavily: {str(e)}")
        return [{"title": f"Error: {str(e)}", "url": "#", "source": "System", 
                 "published_at": datetime.now(), "summary": "An error occurred while searching for financial news."}]
