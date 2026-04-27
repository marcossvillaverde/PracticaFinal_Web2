// Clase de error personalizada para errores operacionales de la API
// Permite distinguir errores esperados de errores inesperados
// Los factory methods facilitan crear errores concretos con un solo metodo

export class AppError extends Error {
  constructor(mensaje, statusCode = 500, code = null) {
    super(mensaje);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Marca que es un error controlado
    Error.captureStackTrace(this, this.constructor);
  }

  // 400 — datos incorrectos o faltantes
  static badRequest(mensaje = 'Solicitud invalida') {
    return new AppError(mensaje, 400, 'BAD_REQUEST');
  }

  // 401 — no autenticado
  static unauthorized(mensaje = 'No autorizado') {
    return new AppError(mensaje, 401, 'UNAUTHORIZED');
  }

  // 403 — autenticado pero sin permisos
  static forbidden(mensaje = 'Acceso prohibido') {
    return new AppError(mensaje, 403, 'FORBIDDEN');
  }

  // 404 — recurso no encontrado
  static notFound(recurso = 'Recurso') {
    return new AppError(`${recurso} no encontrado`, 404, 'NOT_FOUND');
  }

  // 409 — conflicto con dato existente
  static conflict(mensaje = 'Ya existe un registro con esos datos') {
    return new AppError(mensaje, 409, 'CONFLICT');
  }

  // 429 — demasiados intentos
  static tooManyRequests(mensaje = 'Demasiados intentos') {
    return new AppError(mensaje, 429, 'TOO_MANY_REQUESTS');
  }

  // 500 — error interno generico
  static internal(mensaje = 'Error interno del servidor') {
    return new AppError(mensaje, 500, 'INTERNAL_ERROR');
  }
}