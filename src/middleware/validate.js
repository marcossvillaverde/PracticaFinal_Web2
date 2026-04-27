// Middleware generico de validacion con Zod
// Recibe un schema de Zod y valida body, query y params de la peticion
// Si la validacion falla devuelve un 400 con los errores detallados
// Si pasa, sobreescribe req.body con los datos transformados por Zod
// (por ejemplo el email ya llegara en minusculas gracias al .transform())

export const validate = (schema) => (req, res, next) => {
  try {
    const resultado = schema.parse({
      body:   req.body,
      query:  req.query,
      params: req.params,
    });

    // Sobreescribimos con los datos ya transformados por Zod
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