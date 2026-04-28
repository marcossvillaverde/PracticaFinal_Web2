// Utilidades para el manejo de contraseñas con bcrypt
// Usamos un factor de coste de 10

import bcrypt from 'bcryptjs';

// Encripta una contraseña en texto plano
export const encrypt = async (contraseña) => {
  return bcrypt.hash(contraseña, 10);
};

// Compara una contraseña en texto plano con su hash almacenado
export const compare = async (contraseña, hash) => {
  return bcrypt.compare(contraseña, hash);
};