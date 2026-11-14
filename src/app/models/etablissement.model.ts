// Définition de l'énumération correspondant au backend Java
export type TypeEtablissement = 'HOPITAL' | 'CENTRE_SANTE' | 'POSTE_SANTE';

export interface Etablissement {
  id?: number;
  nom: string;
  type: TypeEtablissement;
  ville: string;
  adresse: string;
  telephone: string;
  createdAt?: string; // Représenté sous forme de chaîne ISO (LocalDateTime) en JSON
}