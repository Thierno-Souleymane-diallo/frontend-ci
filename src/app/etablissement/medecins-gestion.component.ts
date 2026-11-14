import { Component, OnInit, inject, signal } from '@angular/core';
import { SunuSanteService } from '../services/sunusante.service';
import { AuthService } from '../services/auth.service';
import { Medecin } from '../models/medecin.model';
import { AdminMedecinFormComponent } from './admin-medecin-form.component';

@Component({
  selector: 'app-medecins-gestion',
  standalone: true,
  imports: [AdminMedecinFormComponent],
  template: `
    <header class="sn-pagehead sn-pagehead--row">
      <div>
        <h1>Médecins</h1>
        <p class="sn-muted">Les praticiens rattachés à votre établissement.</p>
      </div>
      @if (!formulaireOuvert()) {
        <button type="button" class="sn-btn sn-btn--primary" (click)="formulaireOuvert.set(true)">+ Ajouter un médecin</button>
      }
    </header>

    @if (message(); as m) { <div class="sn-toast" role="status">{{ m }}</div> }

    @if (formulaireOuvert() && etabId !== undefined) {
      <app-admin-medecin-form [etablissementId]="etabId" (ajoute)="surAjout($event)" (annule)="formulaireOuvert.set(false)" />
    }

    @if (chargement()) {
      <div class="sn-grid">
        @for (i of [1, 2, 3]; track i) { <div class="sn-card sn-skeleton" style="height: 120px"></div> }
      </div>
    } @else if (erreur()) {
      <div class="sn-alert sn-alert--error">
        <div><strong>Impossible de charger les médecins.</strong></div>
        <button type="button" class="sn-btn sn-btn--outline sn-btn--sm" (click)="charger()">Réessayer</button>
      </div>
    } @else if (medecins().length === 0) {
      <div class="sn-empty">
        <h3>Aucun médecin pour l'instant</h3>
        <p>Ajoutez votre premier praticien pour ouvrir les réservations.</p>
      </div>
    } @else {
      <div class="sn-grid">
        @for (m of medecins(); track m.id) {
          <article class="sn-card sn-doc">
            <div class="sn-avatar" aria-hidden="true">{{ (m.prenom.charAt(0) + m.nom.charAt(0)).toUpperCase() }}</div>
            <div class="sn-doc__body">
              <h3>Dr {{ m.prenom }} {{ m.nom }}</h3>
              <span class="sn-badge sn-badge--spec">{{ m.specialite }}</span>
              @if (m.telephone) { <p class="sn-muted">📞 {{ m.telephone }}</p> }
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class MedecinsGestionComponent implements OnInit {
  private service = inject(SunuSanteService);
  private auth = inject(AuthService);

  readonly etabId = this.auth.session()?.id;
  medecins = signal<Medecin[]>([]);
  chargement = signal(true);
  erreur = signal(false);
  formulaireOuvert = signal(false);
  message = signal<string | null>(null);

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    if (this.etabId === undefined) return;
    this.chargement.set(true);
    this.erreur.set(false);
    this.service.getMedecinsParEtablissement(this.etabId).subscribe({
      next: liste => {
        this.medecins.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  surAjout(m: Medecin): void {
    this.formulaireOuvert.set(false);
    this.message.set(`Dr ${m.prenom} ${m.nom} a été ajouté.`);
    setTimeout(() => this.message.set(null), 4000);
    this.charger();
  }
}