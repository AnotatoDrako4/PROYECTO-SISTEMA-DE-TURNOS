
import { Shift, ShiftType } from "../types";

interface AutoFillResult {
  autoShifts: Partial<Shift>[];
  message: string;
}

/**
 * Calcula la duración en horas entre dos strings de tiempo (HH:MM).
 * Maneja automáticamente el cruce de medianoche (Turnos Nocturnos).
 * Ej: 20:00 a 08:00 -> 12 horas.
 */
export const calculateShiftDuration = (startTime?: string | null, endTime?: string | null): number => {
  if (!startTime || !endTime) return 0;
  
  try {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    // Usamos una fecha base arbitraria
    const start = new Date(2000, 0, 1, startH, startM);
    const end = new Date(2000, 0, 1, endH, endM);

    let diffMs = end.getTime() - start.getTime();

    // Si la diferencia es negativa, asumimos que el turno termina al día siguiente (Nocturno)
    if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
    }

    return diffMs / (1000 * 60 * 60);
  } catch (e) {
    return 0;
  }
};

/**
 * Genera una secuencia de turnos basada en una modalidad y un turno base.
 */
export const generateAutoShifts = (
  baseDateStr: string,
  baseShift: Shift,
  modality: string
): AutoFillResult => {
  const shifts: Partial<Shift>[] = [];
  const baseDate = new Date(baseDateStr + 'T00:00:00');
  
  // Normalizar modalidad para comparación insensible a mayúsculas
  const mode = modality.toLowerCase().trim();

  // Configuración de ciclos
  let workDays = 0;
  let restDays = 0;

  if (mode === '4x4') {
    workDays = 4;
    restDays = 4;
  } else if (mode === '7x7') {
    workDays = 7;
    restDays = 7;
  } else {
    // 24/7, 5x2, Administrativo no tienen autorrellenado automático simple
    return { 
      autoShifts: [], 
      message: "Esta modalidad no soporta autorrellenado automático de ciclo fijo." 
    };
  }

  const totalCycle = workDays + restDays;

  // Generar el ciclo
  for (let i = 0; i < totalCycle; i++) {
    // Calcular fecha: Base + i días
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Determinar si es día de trabajo o descanso
    // Los primeros 'workDays' son copia del base, el resto son LIBRE
    const isWorkDay = i < workDays;

    if (isWorkDay) {
        // Clonar datos del turno base (excepto ID y fecha)
        shifts.push({
            employeeId: baseShift.employeeId,
            unitId: baseShift.unitId,
            date: dateStr,
            type: baseShift.type,
            startTime: baseShift.startTime,
            endTime: baseShift.endTime,
            notes: i === 0 ? baseShift.notes : "Ciclo generado automáticamente"
        });
    } else {
        // Crear turno LIBRE
        shifts.push({
            employeeId: baseShift.employeeId,
            unitId: baseShift.unitId,
            date: dateStr,
            type: ShiftType.LIBRE,
            startTime: undefined,
            endTime: undefined,
            notes: "Descanso por ciclo"
        });
    }
  }

  return {
    autoShifts: shifts,
    message: `Se han generado ${workDays} días de trabajo y ${restDays} días libres.`
  };
};
