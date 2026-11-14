import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SunuSanteService } from '../services/sunusante.service';
import { RendezVous } from '../models/rendez-vous.model';
import { normaliserTelephone, telephoneValide } from '../shared/telephone';
import { classeStatut, libelleStatut } from '../shared/statut';

@Component({
  selector: 'app-suivi-rdv',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="sn-container sn-section sn-narrow">
      <header class="sn-pagehead">
        <h1>Mes rendez-vous</h1>
        <p class="sn-muted">Entrez le numéro de téléphone utilisé lors de la réservation.</p>
      </header>

      <form class="sn-card sn-searchbar" (submit)="$event.preventDefault(); rechercher()">
        <input class="sn-input" type="tel" autocomplete="tel" placeholder="Ex : 77 123 45 67" aria-label="Numéro de téléphone"
               [value]="telephone()" (input)="telephone.set($any($event.target).value)" />
        <button type="submit" class="sn-btn sn-btn--primary" [disabled]="chargement()">
          @if (chargement()) { <span class="sn-spinner" aria-hidden="true"></span> } Rechercher
        </button>
      </form>
      @if (erreurSaisie(); as e) { <small class="sn-error">{{ e }}</small> }

      @if (erreur()) {
        <div class="sn-alert sn-alert--error">Impossible de récupérer vos rendez-vous. Réessayez dans un instant.</div>
      }

      @if (resultats(); as liste) {
        @if (liste.length === 0) {
          <div class="sn-empty">
            <h3>Aucun rendez-vous trouvé</h3>
            <p>Aucune réservation n'est associée à ce numéro.</p>
            <a class="sn-btn sn-btn--primary" routerLink="/patient/etablissements">Prendre un rendez-vous</a>
          </div>
        } @else {
          <p class="sn-muted sn-count">{{ liste.length }} rendez-vous</p>
          <div class="sn-stack">
            @for (r of liste; track r.id) {
              <article class="sn-card sn-rdv">
                <div class="sn-rdv__date">
                  <strong>{{ r.dateHeure | date: 'd MMM' }}</strong>
                  <span>{{ r.dateHeure | date: 'HH:mm' }}</span>
                </div>
                <div class="sn-rdv__body">
                  <h3>Dr {{ r.medecin.prenom }} {{ r.medecin.nom }}</h3>
                  <p class="sn-muted">{{ r.medecin.specialite }}@if (r.medecin.etablissement?.nom) { · {{ r.medecin.etablissement?.nom }} }</p>
                  @if (r.motif) { <p>{{ r.motif }}</p> }
                </div>
                <span [class]="'sn-badge ' + classeStatut(r.statut)">{{ libelleStatut(r.statut) }}</span>
              </article>
            }
          </div>
        }
      }
    </div>
  `,
})
export class SuiviRdvComponent implements OnInit {
  private service = inject(SunuSanteService);
  private route = inject(ActivatedRoute);

  telephone = signal('');
  resultats = signal<RendezVous[] | null>(null);
  chargement = signal(false);
  erreur = signal(false);
  erreurSaisie = signal<string | null>(null);

  readonly libelleStatut = libelleStatut;
  readonly classeStatut = classeStatut;

  ngOnInit(): void {
    const tel = this.route.snapshot.queryParamMap.get('tel');
    if (tel) {
      this.telephone.set(tel);
      this.rechercher();
    }
  }

  rechercher(): void {
    const tel = normaliserTelephone(this.telephone());
    if (!telephoneValide(tel)) {
      this.erreurSaisie.set('Entrez un numéro valide (ex : 77 123 45 67).');
      return;
    }
    this.erreurSaisie.set(null);
    this.erreur.set(false);
    this.chargement.set(true);
    this.service.getRendezVousParTelephone(tel).subscribe({
      next: liste => {
        this.resultats.set([...liste].sort((a, b) => b.dateHeure.localeCompare(a.dateHeure)));
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.resultats.set(null);
        this.chargement.set(false);
      },
    });
  }
}
