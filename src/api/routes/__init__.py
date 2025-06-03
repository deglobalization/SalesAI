"""
SalesAI API 라우트 모듈
"""

from .analysis_routes import analysis_bp
from .data_routes import data_bp
from .recommendations_routes import recommendations_bp

__all__ = [
    'analysis_bp',
    'data_bp', 
    'recommendations_bp'
] 