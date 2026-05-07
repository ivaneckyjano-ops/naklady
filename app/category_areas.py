# -*- coding: utf-8 -*-
"""
Oblasti výdavkov – zoskupenie kategórií v štatistikách (napr. nevyhnutné vs. chcenia).
"""
DEFAULT_AREA_LABEL = 'Nezaradené'

AREA_ICONS = {
    'Nevyhnutné potreby': '🛒',
    'Chcenia': '✨',
    'Investície': '📈',
    'Rezerva': '🏦',
    DEFAULT_AREA_LABEL: '📋',
}


def area_icon_for_label(label):
    return AREA_ICONS.get(label, '📁')


def effective_area_label(cat):
    """
    Vráti oblasť priradenú kategórii; ak chýba, zdedí z hlavnej kategórie.
    """
    if cat.area and str(cat.area).strip():
        return cat.area.strip()
    if cat.parent_id:
        parent = getattr(cat, 'parent', None)
        if parent is None:
            from app.models import Category
            parent = Category.query.get(cat.parent_id)
        if parent:
            return effective_area_label(parent)
    return DEFAULT_AREA_LABEL
