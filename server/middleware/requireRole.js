/**
 * Role-Based Access Control (RBAC) Middleware for Sangam API
 */

export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Please log in.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. This endpoint requires one of the following roles: ${roles.join(', ')}.`
        }
      });
    }

    next();
  };
}

export default requireRole;
