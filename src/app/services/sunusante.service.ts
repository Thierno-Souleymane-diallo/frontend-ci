import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Etablissement } from '../models/etablissement.model';
import { Medecin } from '../models/medecin.model';
import { RendezVous, StatutRendezVous } from '../models/rendez-vous.model';

@Injectable({ providedIn: 'root' })
export class SunuSanteService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  // F1
  getEtablissements(ville?: string): Observable<Etablissement[]> {
    let params = new HttpParams();
    if (ville) params = params.set('ville', ville);
    return this.http.get<Etablissement[]>(`${this.apiUrl}/etablissements`, { params });
  }

  // F2
  getMedecinsParEtablissement(etablissementId: number, specialite?: string): Observable<Medecin[]> {
    let params = new HttpParams();
    if (specialite) params = params.set('specialite', specialite);
    return this.http.get<Medecin[]>(`${this.apiUrl}/etablissements/${etablissementId}/medecins`, { params });
  }

  // F3
  creerRendezVous(rendezVous: RendezVous): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${this.apiUrl}/rendez-vous`, rendezVous);
  }

  // F4
  getRendezVousParTelephone(telephone: string): Observable<RendezVous[]> {
    const params = new HttpParams().set('telephone', telephone);
    return this.http.get<RendezVous[]>(`${this.apiUrl}/rendez-vous`, { params });
  }

  // F5
  getFileAttente(etablissementId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.apiUrl}/etablissements/${etablissementId}/file-attente`);
  }

  // F6
  modifierStatutRendezVous(rdvId: number, statut: StatutRendezVous): Observable<any> {
    return this.http.patch(`${this.apiUrl}/rendez-vous/${rdvId}/statut`, { statut });
  }

  // F7
  ajouterMedecin(medecin: Medecin): Observable<Medecin> {
    return this.http.post<Medecin>(`${this.apiUrl}/medecins`, medecin);
  }
}
