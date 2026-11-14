import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SunuSanteService } from '../services/sunusante.service';
import { Etablissement } from '../models/etablissement.model';
import { libelleType } from '../shared/statut';

/** Minuscules + suppression des accents, pour comparer "Thiès" et "thies". */
function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Component({
  selector: 'app-etablissements-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="sn-hero">
      <div class="sn-container">
        <span class="sn-eyebrow">Plateforme de santé · Sénégal</span>
        <h1>Prenez rendez-vous, sans file d'attente.</h1>
        <p>Trouvez un établissement près de chez vous, choisissez votre médecin et réservez en quelques clics.</p>

        <div class="sn-search">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            type="search"
            placeholder="Rechercher par ville (ex : Dakar, Bambey…)"
            aria-label="Rechercher un établissement par ville"
            [value]="ville()"
            (input)="surSaisie($event)" />
        </div>
      </div>
    </section>

    <section class="sn-container sn-section">
      <div class="sn-toolbar">
        <div class="sn-chips" role="group" aria-label="Type d'établissement">
          @for (t of types; track t.valeur) {
            <button type="button" class="sn-chip" [class.is-active]="typeActif() === t.valeur" (click)="typeActif.set(t.valeur)">
              {{ t.libelle }}
            </button>
          }
        </div>
        @if (!chargement() && !erreur()) {
          <span class="sn-muted">{{ filtres().length }} établissement{{ filtres().length > 1 ? 's' : '' }}</span>
        }
      </div>

      @if (chargement()) {
        <div class="sn-grid">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="sn-card sn-skeleton" style="height: 200px"></div>
          }
        </div>
      } @else if (erreur()) {
        <div class="sn-alert sn-alert--error">
          <div>
            <strong>Impossible de charger les établissements.</strong>
            <p>Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.</p>
          </div>
          <button type="button" class="sn-btn sn-btn--outline sn-btn--sm" (click)="recharger()">Réessayer</button>
        </div>
      } @else if (filtres().length === 0) {
        <div class="sn-empty">
          <h3>Aucun établissement trouvé</h3>
          <p>Essayez une autre ville ou retirez le filtre de type.</p>
        </div>
      } @else {
        <div class="sn-grid">
          @for (e of filtres(); track e.id) {
            <article class="sn-card sn-etab">
              <span class="sn-badge sn-badge--type">{{ libelleType(e.type) }}</span>
              <h3>{{ e.nom }}</h3>
              <ul class="sn-meta">
                <li>📍 {{ e.ville }}@if (e.adresse) { · {{ e.adresse }} }</li>
                @if (e.telephone) { <li>📞 {{ e.telephone }}</li> }
              </ul>
              <a class="sn-btn sn-btn--primary sn-btn--block" [routerLink]="['/patient/etablissements', e.id, 'medecins']">
                Voir les médecins
              </a>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class EtablissementsListComponent implements OnInit {
  private service = inject(SunuSanteService);

  etablissements = signal<Etablissement[]>([]);
  chargement = signal(true);
  erreur = signal(false);
  ville = signal('');
  typeActif = signal('');

  readonly libelleType = libelleType;
  readonly types = [
    { valeur: '', libelle: 'Tous' },
    { valeur: 'HOPITAL', libelle: 'Hôpitaux' },
    { valeur: 'CENTRE_DE_SANTE', libelle: 'Centres de santé' },
    { valeur: 'POSTE_DE_SANTE', libelle: 'Postes de santé' },
  ];

  /** Filtrage local : type + début du nom de la ville (sans tenir compte de la casse ni des accents). */
  filtres = computed(() => {
    const t = this.typeActif();
    const q = normaliser(this.ville());
    return this.etablissements().filter(e => {
      const okType = !t || e.type === t;
      const okVille = !q || normaliser(e.ville ?? '').startsWith(q);
      return okType && okVille;
    });
  });

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.service.getEtablissements().subscribe({
      next: liste => {
        this.etablissements.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  surSaisie(event: Event): void {
    this.ville.set((event.target as HTMLInputElement).value);
  }

  recharger(): void {
    this.charger();
  }
}