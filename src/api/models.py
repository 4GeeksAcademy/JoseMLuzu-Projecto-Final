from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relación con los favoritos
    favorites = db.relationship('Crypto', secondary='user_favorites', backref=db.backref('users', lazy='dynamic'))

    def serialize(self):
        return {
            'id': self.id,
            'email': self.email,
            'is_active': self.is_active
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'user_id': self.user_id
        }

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)

    category = db.relationship('Category', backref=db.backref('items', lazy=True))

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'category': self.category.name,
            'user_id': self.user_id
        }

class Crypto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    symbol = db.Column(db.String(10), unique=True, nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'symbol': self.symbol
        }

# Tabla de asociación para los favoritos de los usuarios
class UserFavorites(db.Model):
    __tablename__ = 'user_favorites'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    crypto_id = db.Column(db.Integer, db.ForeignKey('crypto.id'), primary_key=True)

    user = db.relationship('User', backref=db.backref('user_favorites', cascade='all, delete-orphan'))
    crypto = db.relationship('Crypto', backref=db.backref('crypto_favorites', cascade='all, delete-orphan'))
