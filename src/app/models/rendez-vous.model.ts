import { Medecin } from './medecin.model';

export type StatutRendezVous = 'EN_ATTENTE' | 'EN_CONSULTATION' | 'TERMINE' | 'ANNULE';

export interface RendezVous {
  id?: number;
  nomPatient: string;
  telephonePatient: string;
  dateHeure: string; // Stocké sous format ISO string (LocalDateTime)
  motif?: string;
  statut?: StatutRendezVous;
  medecin?: Medecin;
  medecinId?: number;
  medecinNom?: string;
  medecinSpecialite?: string;
  etablissementId?: number;
  etablissementNom?: string;
  createdAt?: string;
  updatedAt?: string;
}
