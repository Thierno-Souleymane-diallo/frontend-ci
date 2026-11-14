import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Supprime espaces, points, tirets et l'indicatif +221 : "+221 77 123 45 67" -> "771234567". */
export function normaliserTelephone(valeur: string | null | undefined): string {
  return (valeur ?? '')
    .replace(/[\s.\-()]/g, '')
    .replace(/^(\+221|00221|221)/, '');
}

/** Mobiles sénégalais (70, 75, 76, 77, 78) et fixes (33). */
export function telephoneValide(valeur: string | null | undefined): boolean {
  return /^(7[05678]|33)\d{7}$/.test(normaliserTelephone(valeur));
}

export function telephoneValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  if (!v) return null;
  return telephoneValide(v) ? null : { telephone: true };
}

export function dateFutureValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  if (!v) return null;
  const t = new Date(v).getTime();
  if (isNaN(t)) return { dateInvalide: true };
  return t > Date.now() ? null : { passee: true };
}
