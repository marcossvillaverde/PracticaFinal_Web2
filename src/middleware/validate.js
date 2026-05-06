
export const validate = (schema) => (req, res, next) => {
  try {
    const resultado = schema.parse({
      body:   req.body,
      query:  req.query,
      params: req.params,
    });

    req.body = resultado.body ?? req.body;
    next();
  } catch (error) {
    const errores = error.errors.map((e) => ({
      campo:   e.path.join('.'),
      mensaje: e.message,
    }));
    res.status(400).json({
      error:    true,
      mensaje:  'Error de validacion',
      detalles: errores,
    });
  }
};