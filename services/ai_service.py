import os
import logging
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferMemory

# Set up logging
logger = logging.getLogger(__name__)

# Get API key from environment variable
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Financial analysis prompt template
financial_prompt = PromptTemplate(
    input_variables=["input", "history"],
    template="""
    You are a professional financial analyst with deep expertise in stock markets, economy, and investment strategies.
    
    Provide detailed, accurate analysis based on facts. If you're uncertain about specific data points, acknowledge the limitations.
    
    Previous conversation:
    {history}
    
    User's question about finance:
    {input}
    
    Please provide your expert financial analysis:
    """
)

# Memory initialization function to ensure fresh memory for each request
def get_memory():
    return ConversationBufferMemory(input_key="input", memory_key="history")

# LLM initialization function to avoid initializing at import time
def get_llm():
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not set in environment variables")
        return None
        
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model_name="llama3-70b-8192",  # Using Llama 3 70B model for superior financial analysis
        temperature=0.2,  # Low temperature for more factual responses
        max_tokens=2048
    )

# Chain creation function
def get_financial_chain():
    llm = get_llm()
    if not llm:
        return None
        
    return LLMChain(
        llm=llm,
        prompt=financial_prompt,
        verbose=True,
        memory=get_memory()
    )

def get_ai_analysis(query):
    """
    Get financial analysis using LangChain and Groq.
    
    Args:
        query (str): The financial query to analyze
        
    Returns:
        str: The AI-generated financial analysis
    """
    try:
        if not GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set in environment variables")
            return "Error: API key not configured. Please set the GROQ_API_KEY environment variable."
        
        # Get a new chain for this request
        financial_chain = get_financial_chain()
        if not financial_chain:
            return "Error: Could not initialize LLM. Please check your API key configuration."
            
        # Run the chain
        response = financial_chain.run(input=query)
        
        return response
    except Exception as e:
        logger.error(f"Error getting AI analysis: {str(e)}")
        return f"An error occurred while processing your request: {str(e)}"
