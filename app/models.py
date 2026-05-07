# -*- coding: utf-8 -*-
"""
Databázové modely
"""
from app import db
from app.category_areas import effective_area_label
from datetime import datetime

class Category(db.Model):
    """Model kategórie výdavkov (s podporou podkategórií)"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(20), default='📦')
    description = db.Column(db.String(255))
    parent_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    area = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Hierarchické vzťahy
    parent = db.relationship('Category', remote_side=[id], backref='subcategories')
    expenses = db.relationship('Expense', backref='category', lazy=True, cascade='all, delete-orphan')
    
    # UniqueConstraint pre (name, parent_id) aby sa dali rovnaké podkategórie pod rôznymi hlavnými
    __table_args__ = (db.UniqueConstraint('name', 'parent_id', name='unique_category_parent'),)
    
    def to_dict(self, include_subcategories=False):
        data = {
            'id': self.id,
            'name': self.name,
            'icon': self.icon,
            'description': self.description,
            'parent_id': self.parent_id,
            'area': self.area,
            'effective_area': effective_area_label(self),
            'is_subcategory': self.parent_id is not None
        }
        
        if include_subcategories and self.subcategories:
            data['subcategories'] = [sub.to_dict() for sub in self.subcategories]
        
        return data
    
    @property
    def full_name(self):
        """Vrátí plné meno s hierarchiou (napr. 'Dom > Opravy')"""
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    def __repr__(self):
        return f'<Category {self.full_name}>'


class Expense(db.Model):
    """Model výdavku"""
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    store = db.Column(db.String(100))  # Obchod (LIDL, KAUFLAND, atď.)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category': self.category.name,
            'category_icon': self.category.icon,
            'amount': float(self.amount),
            'description': self.description,
            'store': self.store,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Expense {self.amount}€ - {self.category.name} ({self.store})>'


class Income(db.Model):
    """Model príjmu"""
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    source = db.Column(db.String(100))
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),
            'description': self.description,
            'source': self.source,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Income {self.amount}€ - {self.source or "Príjem"}>'
