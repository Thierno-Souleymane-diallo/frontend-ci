import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  // La page d'accueil est l'espace patient (sans mot de passe)
  { path: '', pathMatch: 'full', redirectTo: 'patient' },

  // ESPACE PATIENT
  {
    path: 'patient',
    loadComponent: () => import('./layouts/patient-layout.component').then(m => m.PatientLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'etablissements' },
      { path: 'etablissements', loadComponent: () => import('./patient/etablissements-list.component').then(m => m.EtablissementsListComponent) },
      { path: 'etablissements/:id/medecins', loadComponent: () => import('./patient/medecins-list.component').then(m => m.MedecinsListComponent) },
      { path: 'rendez-vous/nouveau', loadComponent: () => import('./patient/rdv-form.component').then(m => m.RdvFormComponent) },
      { path: 'mes-rendez-vous', loadComponent: () => import('./patient/suivi-rdv.component').then(m => m.SuiviRdvComponent) },
    ],
  },

  // ESPACE ÉTABLISSEMENT (protégé, sauf la page de connexion)
  {
    path: 'etablissement',
    children: [
      { path: 'connexion', loadComponent: () => import('./etablissement/connexion.component').then(m => m.ConnexionComponent) },
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layouts/etablissement-layout.component').then(m => m.EtablissementLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'file-attente' },
          { path: 'file-attente', loadComponent: () => import('./etablissement/file-attente.component').then(m => m.FileAttenteComponent) },
          { path: 'medecins', loadComponent: () => import('./etablissement/medecins-gestion.component').then(m => m.MedecinsGestionComponent) },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'patient' },
];