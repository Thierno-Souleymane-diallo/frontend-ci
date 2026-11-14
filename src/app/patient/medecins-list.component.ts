import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SunuSanteService } from '../services/sunusante.service';
import { Etablissement } from '../models/etablissement.model';
import { Medecin } from '../models/medecin.model';
import { libelleType } from '../shared/statut';

@Component({
  selector: 'app-medecins-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="sn-container sn-section">
      <a routerLink="/patient/etablissements" class="sn-back">← Tous les établissements</a>

      <header class="sn-pagehead">
        @if (etablissement(); as e) {
          <span class="sn-badge sn-badge--type">{{ libelleType(e.type) }}</span>
          <h1>{{ e.nom }}</h1>
          <p class="sn-muted">📍 {{ e.ville }}@if (e.adresse) { · {{ e.adresse }} }@if (e.telephone) { · 📞 {{ e.telephone }} }</p>
        } @else {
          <h1>Médecins disponibles</h1>
        }
      </header>

      @if (!chargement() && !erreur() && medecins().length > 0) {
        <div class="sn-toolbar">
          <div class="sn-chips" role="group" aria-label="Spécialité">
            <button type="button" class="sn-chip" [class.is-active]="specialiteActive() === ''" (click)="specialiteActive.set('')">Toutes</button>
            @for (s of specialites(); track s) {
              <button type="button" class="sn-chip" [class.is-active]="specialiteActive() === s" (click)="specialiteActive.set(s)">{{ s }}</button>
            }
          </div>
          <input class="sn-input sn-input--inline" type="search" placeholder="Rechercher un médecin…"
                 aria-label="Rechercher un médecin" (input)="recherche.set($any($event.target).value)" />
        </div>
      }

      @if (chargement()) {
        <div class="sn-grid">
          @for (i of [1, 2, 3]; track i) {
            <div class="sn-card sn-skeleton" style="height: 180px"></div>
          }
        </div>
      } @else if (erreur()) {
        <div class="sn-alert sn-alert--error">
          <div>
            <strong>Impossible de charger les médecins.</strong>
            <p>Vérifiez votre connexion puis réessayez.</p>
          </div>
          <button type="button" class="sn-btn sn-btn--outline sn-btn--sm" (click)="charger()">Réessayer</button>
        </div>
      } @else if (filtres().length === 0) {
        <div class="sn-empty">
          <h3>Aucun médecin trouvé</h3>
          <p>Cet établissement n'a pas encore de praticien pour ce filtre.</p>
        </div>
      } @else {
        <div class="sn-grid">
          @for (m of filtres(); track m.id) {
            <article class="sn-card sn-doc">
              <div class="sn-avatar" aria-hidden="true">{{ initiales(m) }}</div>
              <div class="sn-doc__body">
                <h3>Dr {{ m.prenom }} {{ m.nom }}</h3>
                <span class="sn-badge sn-badge--spec">{{ m.specialite }}</span>
                @if (m.telephone) { <p class="sn-muted">📞 {{ m.telephone }}</p> }
              </div>
              <a class="sn-btn sn-btn--primary sn-btn--block"
                 routerLink="/patient/rendez-vous/nouveau"
                 [queryParams]="{ etablissementId: etabId, medecinId: m.id }">
                Prendre rendez-vous
              </a>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class MedecinsListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(SunuSanteService);

  readonly etabId = Number(this.route.snapshot.paramMap.get('id'));
  readonly libelleType = libelleType;

  etablissement = signal<Etablissement | null>(null);
  medecins = signal<Medecin[]>([]);
  chargement = signal(true);
  erreur = signal(false);
  specialiteActive = signal('');
  recherche = signal('');

  specialites = computed(() =>
    Array.from(new Set(this.medecins().map(m => m.specialite).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr'))
  );

  filtres = computed(() => {
    const spec = this.specialiteActive();
    const q = this.recherche().trim().toLowerCase();
    return this.medecins().filter(m =>
      (!spec || m.specialite === spec) &&
      (!q || `${m.prenom} ${m.nom}`.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
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
    this.service.getEtablissements().subscribe({
      next: liste => this.etablissement.set(liste.find(e => e.id === this.etabId) ?? null),
      error: () => { /* l'en-tête reste générique */ },
    });
  }

  initiales(m: Medecin): string {
    return ((m.prenom?.[0] ?? '') + (m.nom?.[0] ?? '')).toUpperCase();
  }
}
