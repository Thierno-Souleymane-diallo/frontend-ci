import { Etablissement } from './etablissement.model';

export interface Medecin {
  id?: number;
  nom: string;
  prenom: string;
  specialite: string;
  telephone?: string;
  etablissement?: Etablissement;
  etablissementId?: number;
  etablissementNom?: string;
  createdAt?: string;
}
