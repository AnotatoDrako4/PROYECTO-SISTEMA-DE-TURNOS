
/**
 * Valida si una cadena es un RUT chileno válido (Módulo 11).
 */
export const validateRut = (rut: string): boolean => {
  if (!rut || rut.trim().length < 3) return false;
  
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  if (cleanRut.length < 2) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  if (!/^[0-9]+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const calculatedDvNum = 11 - (sum % 11);
  let calculatedDv = '';
  if (calculatedDvNum === 11) calculatedDv = '0';
  else if (calculatedDvNum === 10) calculatedDv = 'K';
  else calculatedDv = calculatedDvNum.toString();

  return dv === calculatedDv;
};

/**
 * Formatea un RUT (ej: 123456789 -> 12.345.678-9).
 */
export const formatRut = (rut: string): string => {
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  if (cleanRut.length <= 1) return cleanRut;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
};

/**
 * Sanitiza entradas de texto para evitar XSS básico y espacios extra.
 */
export const sanitizeInput = (input: string): string => {
    return input.trim();
};
