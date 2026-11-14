import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="sn-header">
      <div class="sn-container sn-header__inner">
        <a routerLink="/patient" class="sn-brand" aria-label="SunuSanté, accueil">
          <span class="sn-brand__logo">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>
          </span>
          <span class="sn-brand__name">Sunu<strong>Santé</strong></span>
        </a>

        <nav class="sn-nav" aria-label="Navigation principale">
          <a routerLink="/patient/etablissements" routerLinkActive="is-active">Établissements</a>
          <a routerLink="/patient/mes-rendez-vous" routerLinkActive="is-active">Mes rendez-vous</a>
        </nav>

        <a routerLink="/etablissement" class="sn-btn sn-btn--outline sn-btn--sm">Espace établissement</a>
      </div>
    </header>

    <main class="sn-main">
      <router-outlet />
    </main>

    <footer class="sn-footer">
      <div class="sn-container">
        <strong>SunuSanté</strong> · Prenez rendez-vous dans les établissements de santé du Sénégal, sans vous déplacer.
      </div>
    </footer>
  `,
})
export class PatientLayoutComponent {}
