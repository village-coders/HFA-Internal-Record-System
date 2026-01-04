const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');

const auth = {
  // Verify JWT token
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
  },
  
  // Check role permission
  checkRole: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }
      
      next();
    };
  },
  
  // Check if user owns the resource or is admin
  checkOwnership: (model, paramName = 'id') => {
    return async (req, res, next) => {
      try {
        const resource = await model.findById(req.params[paramName]);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found'
          });
        }
        
        // Allow if user is admin or owns the resource
        if (req.user.role === 'admin' || resource.user_id.toString() === req.user.userId) {
          req.resource = resource;
          next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not own this resource.'
          });
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    };
  },
  
  // Log user activity
  logActivity: async (req, action, entityType, entityId, details) => {
    try {
      const auditLog = new AuditLog({
        action,
        user_id: req.user?.userId,
        user_name: req.user?.name || 'System',
        user_role: req.user?.role || 'system',
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await auditLog.save();
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
};

module.exports = auth;