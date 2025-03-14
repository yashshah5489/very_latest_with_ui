from flask import render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User, Portfolio, Holding, Watchlist, WatchlistItem, FinancialNews, AIAnalysis
from werkzeug.security import generate_password_hash
from services.ai_service import get_ai_analysis
from services.news_service import get_latest_news, search_news
from services.financial_service import get_stock_data, get_market_summary
import logging


@app.route('/')
def index():
    """Home page route"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')


@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard for authenticated users"""
    # Get user portfolios
    portfolios = Portfolio.query.filter_by(user_id=current_user.id).all()
    
    # Get watchlists
    watchlists = Watchlist.query.filter_by(user_id=current_user.id).all()
    
    # Get latest news
    news = FinancialNews.query.order_by(FinancialNews.published_at.desc()).limit(5).all()
    
    # Get market summary
    market_summary = get_market_summary()
    
    return render_template('dashboard.html', 
                           portfolios=portfolios, 
                           watchlists=watchlists,
                           news=news,
                           market_summary=market_summary)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login route"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        
        flash('Invalid username or password')
    
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration route"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if username or email already exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            flash('Username or email already exists.')
            return render_template('register.html')
        
        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! Please log in.')
        return redirect(url_for('login'))
    
    return render_template('register.html')


@app.route('/logout')
@login_required
def logout():
    """User logout route"""
    logout_user()
    return redirect(url_for('index'))


@app.route('/api/portfolios', methods=['GET', 'POST'])
@login_required
def portfolios():
    """API endpoint for managing portfolios"""
    if request.method == 'GET':
        user_portfolios = Portfolio.query.filter_by(user_id=current_user.id).all()
        result = []
        for portfolio in user_portfolios:
            holdings = []
            for holding in portfolio.holdings:
                stock_data = get_stock_data(holding.symbol)
                current_price = stock_data.get('price', 0)
                holdings.append({
                    'id': holding.id,
                    'symbol': holding.symbol,
                    'quantity': holding.quantity,
                    'purchase_price': holding.purchase_price,
                    'current_price': current_price,
                    'value': holding.quantity * current_price,
                    'profit_loss': (current_price - holding.purchase_price) * holding.quantity
                })
            
            result.append({
                'id': portfolio.id,
                'name': portfolio.name,
                'description': portfolio.description,
                'holdings': holdings
            })
        
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        new_portfolio = Portfolio(
            name=data.get('name'),
            description=data.get('description'),
            user_id=current_user.id
        )
        
        db.session.add(new_portfolio)
        db.session.commit()
        
        return jsonify({'id': new_portfolio.id, 'name': new_portfolio.name, 'message': 'Portfolio created successfully'})


@app.route('/api/portfolios/<int:portfolio_id>', methods=['PUT', 'DELETE'])
@login_required
def manage_portfolio(portfolio_id):
    """API endpoint for updating or deleting a specific portfolio"""
    portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=current_user.id).first_or_404()
    
    if request.method == 'PUT':
        data = request.json
        portfolio.name = data.get('name', portfolio.name)
        portfolio.description = data.get('description', portfolio.description)
        
        db.session.commit()
        return jsonify({'message': 'Portfolio updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(portfolio)
        db.session.commit()
        return jsonify({'message': 'Portfolio deleted successfully'})


@app.route('/api/portfolios/<int:portfolio_id>/holdings', methods=['POST'])
@login_required
def add_holding(portfolio_id):
    """API endpoint for adding a holding to a portfolio"""
    portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=current_user.id).first_or_404()
    
    data = request.json
    new_holding = Holding(
        symbol=data.get('symbol').upper(),
        quantity=data.get('quantity'),
        purchase_price=data.get('purchase_price'),
        portfolio_id=portfolio.id
    )
    
    db.session.add(new_holding)
    db.session.commit()
    
    return jsonify({'message': 'Holding added successfully', 'id': new_holding.id})


@app.route('/api/holdings/<int:holding_id>', methods=['PUT', 'DELETE'])
@login_required
def manage_holding(holding_id):
    """API endpoint for updating or deleting a specific holding"""
    holding = Holding.query.join(Portfolio).filter(
        Holding.id == holding_id,
        Portfolio.user_id == current_user.id
    ).first_or_404()
    
    if request.method == 'PUT':
        data = request.json
        holding.symbol = data.get('symbol', holding.symbol).upper()
        holding.quantity = data.get('quantity', holding.quantity)
        holding.purchase_price = data.get('purchase_price', holding.purchase_price)
        
        db.session.commit()
        return jsonify({'message': 'Holding updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(holding)
        db.session.commit()
        return jsonify({'message': 'Holding deleted successfully'})


@app.route('/api/watchlists', methods=['GET', 'POST'])
@login_required
def watchlists():
    """API endpoint for managing watchlists"""
    if request.method == 'GET':
        user_watchlists = Watchlist.query.filter_by(user_id=current_user.id).all()
        result = []
        for watchlist in user_watchlists:
            items = []
            for item in watchlist.stocks:
                stock_data = get_stock_data(item.symbol)
                items.append({
                    'id': item.id,
                    'symbol': item.symbol,
                    'price': stock_data.get('price', 0),
                    'change': stock_data.get('change', 0),
                    'change_percent': stock_data.get('change_percent', 0),
                    'notes': item.notes
                })
            
            result.append({
                'id': watchlist.id,
                'name': watchlist.name,
                'stocks': items
            })
        
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        new_watchlist = Watchlist(
            name=data.get('name'),
            user_id=current_user.id
        )
        
        db.session.add(new_watchlist)
        db.session.commit()
        
        return jsonify({'id': new_watchlist.id, 'name': new_watchlist.name, 'message': 'Watchlist created successfully'})


@app.route('/api/news', methods=['GET'])
@login_required
def get_news():
    """API endpoint for getting financial news"""
    query = request.args.get('query', '')
    
    if query:
        news_items = search_news(query)
    else:
        news_items = get_latest_news()
    
    # Store in database for future reference
    for news in news_items:
        existing_news = FinancialNews.query.filter_by(url=news['url']).first()
        if not existing_news:
            new_news = FinancialNews(
                title=news['title'],
                url=news['url'],
                source=news['source'],
                published_at=news['published_at'],
                summary=news['summary'],
                sentiment=news['sentiment'],
                symbols=','.join(news['symbols']) if 'symbols' in news else ''
            )
            db.session.add(new_news)
    
    db.session.commit()
    
    return jsonify(news_items)


@app.route('/api/ai-analysis', methods=['POST'])
@login_required
def ai_analysis():
    """API endpoint for getting AI analysis"""
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    # Get AI analysis
    result = get_ai_analysis(query)
    
    # Save to database
    analysis = AIAnalysis(
        query=query,
        response=result,
        user_id=current_user.id
    )
    db.session.add(analysis)
    db.session.commit()
    
    return jsonify({'response': result})


@app.route('/api/stock/<symbol>', methods=['GET'])
@login_required
def stock_data(symbol):
    """API endpoint for getting stock data"""
    data = get_stock_data(symbol.upper())
    return jsonify(data)


@app.route('/api/market-summary', methods=['GET'])
@login_required
def market_summary():
    """API endpoint for getting market summary"""
    summary = get_market_summary()
    return jsonify(summary)


# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html'), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('index.html'), 500
