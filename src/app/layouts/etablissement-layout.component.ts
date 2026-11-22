import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-etablissement-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="sn-admin">
      <aside class="sn-side">
        <a routerLink="/etablissement" class="sn-brand sn-brand--light" aria-label="SunuSanté, tableau de bord">
          <span class="sn-brand__logo">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>
          </span>
          <span class="sn-brand__name">Sunu<strong>Santé</strong></span>
        </a>

        <div class="sn-side__etab">
          <small>Établissement connecté</small>
          <strong>{{ session()?.nom }}</strong>
        </div>

        <nav class="sn-side__nav" aria-label="Navigation établissement">
          <a routerLink="/etablissement/file-attente" routerLinkActive="is-active">File d'attente</a>
          <a routerLink="/etablissement/medecins" routerLinkActive="is-active">Médecins</a>
        </nav>

        <div class="sn-side__foot">
          <a routerLink="/patient" class="sn-side__link">← Espace patient</a>
          <button type="button" class="sn-btn sn-btn--light sn-btn--sm" (click)="sortir()">Se déconnecter</button>
        </div>
      </aside>

      <main class="sn-admin__main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class EtablissementLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  session = this.auth.session;

  sortir(): void {
    this.auth.logout();
    this.router.navigateByUrl('/etablissement/connexion');
  }
}
