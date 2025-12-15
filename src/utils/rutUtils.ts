
/**
 * Elimina puntos y guión del RUT, dejando solo números y K mayúscula.
 * Ej: 12.345.678-k -> 12345678K
 */
export const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

/**
 * Formatea un RUT limpio o sucio al formato estándar chileno.
 * Ej: 123456789 -> 12.345.678-9
 */
export const formatRut = (rut: string): string => {
  const clean = cleanRut(rut);
  if (clean.length <= 1) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
};

/**
 * Valida un RUT usando el algoritmo Módulo 11.
 */
export const validateRut = (rut: string): boolean => {
  const clean = cleanRut(rut);
  if (clean.length < 7) return false; // Mínimo RUT razonable

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body.charAt(i)) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
  
  return dv === dvCalculado;
};
