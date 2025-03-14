from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # User profile data
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    
    # Relationships
    portfolios = db.relationship('Portfolio', backref='owner', lazy='dynamic')
    watchlists = db.relationship('Watchlist', backref='owner', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    holdings = db.relationship('Holding', backref='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Portfolio {self.name}>'


class Holding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=0)
    purchase_price = db.Column(db.Float)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False)
    
    def __repr__(self):
        return f'<Holding {self.symbol}: {self.quantity}>'


class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    stocks = db.relationship('WatchlistItem', backref='watchlist', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Watchlist {self.name}>'


class WatchlistItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.String(256))
    watchlist_id = db.Column(db.Integer, db.ForeignKey('watchlist.id'), nullable=False)
    
    def __repr__(self):
        return f'<WatchlistItem {self.symbol}>'


class FinancialNews(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    source = db.Column(db.String(128))
    published_at = db.Column(db.DateTime)
    summary = db.Column(db.Text)
    sentiment = db.Column(db.String(20))  # positive, negative, neutral
    symbols = db.Column(db.String(256))  # Comma-separated stock symbols related to the news
    
    def __repr__(self):
        return f'<FinancialNews {self.title}>'


class AIAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    def __repr__(self):
        return f'<AIAnalysis {self.id}>'
