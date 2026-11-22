import { StatutRendezVous } from '../models/rendez-vous.model';
import { TypeEtablissement } from '../models/etablissement.model';

export const LIBELLES_STATUT: Record<StatutRendezVous, string> = {
  EN_ATTENTE: 'En attente',
  EN_CONSULTATION: 'En consultation',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export function libelleStatut(s: StatutRendezVous | undefined): string {
  return LIBELLES_STATUT[s ?? 'EN_ATTENTE'] ?? String(s);
}

export function classeStatut(s: StatutRendezVous | undefined): string {
  switch (s ?? 'EN_ATTENTE') {
    case 'EN_CONSULTATION': return 'sn-badge--consultation';
    case 'TERMINE': return 'sn-badge--termine';
    case 'ANNULE': return 'sn-badge--annule';
    default: return 'sn-badge--attente';
  }
}

export function libelleType(t: TypeEtablissement | string | undefined): string {
  switch (t) {
    case 'HOPITAL': return 'Hôpital';
    case 'CENTRE_DE_SANTE':
    case 'CENTRE_SANTE': return 'Centre de santé';
    case 'POSTE_DE_SANTE':
    case 'POSTE_SANTE': return 'Poste de santé';
    case 'CLINIQUE': return 'Clinique';
    default: return t ?? '';
  }
}

export const SPECIALITES = [
  'Médecine générale', 'Pédiatrie', 'Cardiologie', 'Gynécologie-obstétrique', 'Dermatologie',
  'Ophtalmologie', 'ORL', 'Chirurgie', 'Dentisterie', 'Psychiatrie', 'Radiologie', 'Kinésithérapie',
];
