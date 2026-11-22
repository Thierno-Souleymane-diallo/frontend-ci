import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SunuSanteService } from '../services/sunusante.service';
import { AuthService } from '../services/auth.service';
import { RendezVous, StatutRendezVous } from '../models/rendez-vous.model';
import { classeStatut, libelleStatut } from '../shared/statut';

type Filtre = 'TOUS' | StatutRendezVous;

const RANG: Record<StatutRendezVous, number> = { EN_CONSULTATION: 0, EN_ATTENTE: 1, TERMINE: 2, ANNULE: 3 };

@Component({
  selector: 'app-file-attente',
  standalone: true,
  imports: [DatePipe],
  template: `
    <header class="sn-pagehead sn-pagehead--row">
      <div>
        <h1>File d'attente du jour</h1>
        <p class="sn-muted">{{ aujourdhui | date: 'EEEE d MMMM y' }}@if (maj(); as d) { · mis à jour à {{ d | date: 'HH:mm:ss' }} }</p>
      </div>
      <div class="sn-actions">
        <label class="sn-switch">
          <input type="checkbox" [checked]="auto()" (change)="auto.set(!auto())" />
          <span>Actualisation auto</span>
        </label>
        <button type="button" class="sn-btn sn-btn--outline sn-btn--sm" (click)="charger()" [disabled]="chargement()">Actualiser</button>
      </div>
    </header>

    @if (message(); as msg) {
      <div class="sn-toast" [class.sn-toast--error]="msg.type === 'err'" role="status">{{ msg.texte }}</div>
    }

    <section class="sn-kpis" aria-label="Résumé de la journée">
      <button type="button" class="sn-kpi sn-kpi--attente" [class.is-active]="filtre() === 'EN_ATTENTE'" (click)="basculer('EN_ATTENTE')">
        <strong>{{ compteurs().EN_ATTENTE }}</strong><span>En attente</span>
      </button>
      <button type="button" class="sn-kpi sn-kpi--consultation" [class.is-active]="filtre() === 'EN_CONSULTATION'" (click)="basculer('EN_CONSULTATION')">
        <strong>{{ compteurs().EN_CONSULTATION }}</strong><span>En consultation</span>
      </button>
      <button type="button" class="sn-kpi sn-kpi--termine" [class.is-active]="filtre() === 'TERMINE'" (click)="basculer('TERMINE')">
        <strong>{{ compteurs().TERMINE }}</strong><span>Terminés</span>
      </button>
      <button type="button" class="sn-kpi sn-kpi--annule" [class.is-active]="filtre() === 'ANNULE'" (click)="basculer('ANNULE')">
        <strong>{{ compteurs().ANNULE }}</strong><span>Annulés</span>
      </button>
    </section>

    @if (chargement() && rdvs().length === 0) {
      <div class="sn-stack">
        @for (i of [1, 2, 3, 4]; track i) { <div class="sn-card sn-skeleton" style="height: 84px"></div> }
      </div>
    } @else if (erreur()) {
      <div class="sn-alert sn-alert--error">
        <div><strong>Impossible de charger la file d'attente.</strong><p>Le serveur ne répond pas.</p></div>
        <button type="button" class="sn-btn sn-btn--outline sn-btn--sm" (click)="charger()">Réessayer</button>
      </div>
    } @else if (liste().length === 0) {
      <div class="sn-empty">
        <h3>{{ filtre() === 'TOUS' ? "Aucun patient attendu aujourd'hui" : 'Aucun rendez-vous dans cette catégorie' }}</h3>
        <p>Les nouvelles réservations apparaîtront ici automatiquement.</p>
      </div>
    } @else {
      <div class="sn-stack">
        @for (r of liste(); track r.id) {
          <article class="sn-card sn-qrow"
                   [class.is-active]="statutDe(r) === 'EN_CONSULTATION'"
                   [class.is-done]="statutDe(r) === 'TERMINE' || statutDe(r) === 'ANNULE'">
            <div class="sn-qrow__time">
              <strong>{{ r.dateHeure | date: 'HH:mm' }}</strong>
              @if (positions().get(r.id ?? -1); as p) { <small>N° {{ p }}</small> }
            </div>

            <div class="sn-qrow__main">
              <h3>{{ r.nomPatient }}</h3>
              <p class="sn-muted">📞 {{ r.telephonePatient }}</p>
              @if (r.motif) { <p>{{ r.motif }}</p> }
            </div>

            <div class="sn-qrow__doc">
              <strong>{{ nomMedecin(r) }}</strong>
              <small class="sn-muted">{{ specialiteMedecin(r) }}</small>
            </div>

            <span [class]="'sn-badge ' + classeStatut(r.statut)">{{ libelleStatut(r.statut) }}</span>

            <div class="sn-qrow__actions">
              @if (statutDe(r) === 'EN_ATTENTE') {
                <button type="button" class="sn-btn sn-btn--primary sn-btn--sm" [disabled]="enCours() === r.id" (click)="changer(r, 'EN_CONSULTATION')">Prendre en charge</button>
              }
              @if (statutDe(r) === 'EN_CONSULTATION') {
                <button type="button" class="sn-btn sn-btn--success sn-btn--sm" [disabled]="enCours() === r.id" (click)="changer(r, 'TERMINE')">Terminer</button>
              }
              @if (statutDe(r) === 'EN_ATTENTE' || statutDe(r) === 'EN_CONSULTATION') {
                @if (confirmation() === r.id) {
                  <button type="button" class="sn-btn sn-btn--danger sn-btn--sm" [disabled]="enCours() === r.id" (click)="changer(r, 'ANNULE')">Confirmer l'annulation</button>
                  <button type="button" class="sn-btn sn-btn--ghost sn-btn--sm" (click)="confirmation.set(null)">Garder</button>
                } @else {
                  <button type="button" class="sn-btn sn-btn--ghost sn-btn--sm" (click)="confirmation.set(r.id ?? null)">Annuler</button>
                }
              }
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class FileAttenteComponent implements OnInit, OnDestroy {
  private service = inject(SunuSanteService);
  private auth = inject(AuthService);

  rdvs = signal<RendezVous[]>([]);
  chargement = signal(true);
  erreur = signal(false);
  maj = signal<Date | null>(null);
  auto = signal(true);
  filtre = signal<Filtre>('TOUS');
  enCours = signal<number | null>(null);
  confirmation = signal<number | null>(null);
  message = signal<{ type: 'ok' | 'err'; texte: string } | null>(null);

  readonly aujourdhui = new Date();
  readonly libelleStatut = libelleStatut;
  readonly classeStatut = classeStatut;

  private timer?: ReturnType<typeof setInterval>;
  private timerMessage?: ReturnType<typeof setTimeout>;

  compteurs = computed(() => {
    const c: Record<StatutRendezVous, number> = { EN_ATTENTE: 0, EN_CONSULTATION: 0, TERMINE: 0, ANNULE: 0 };
    for (const r of this.rdvs()) c[this.statutDe(r)]++;
    return c;
  });

  triees = computed(() =>
    [...this.rdvs()].sort((a, b) =>
      RANG[this.statutDe(a)] - RANG[this.statutDe(b)] || a.dateHeure.localeCompare(b.dateHeure)
    )
  );

  liste = computed(() => {
    const f = this.filtre();
    return f === 'TOUS' ? this.triees() : this.triees().filter(r => this.statutDe(r) === f);
  });

  /** Numéro d'ordre des patients encore en attente (1 = prochain). */
  positions = computed(() => {
    const m = new Map<number, number>();
    this.triees()
      .filter(r => this.statutDe(r) === 'EN_ATTENTE' && r.id !== undefined)
      .forEach((r, i) => m.set(r.id as number, i + 1));
    return m;
  });

  ngOnInit(): void {
    this.charger();
    this.timer = setInterval(() => {
      if (this.auto() && this.enCours() === null) this.charger(true);
    }, 15000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearTimeout(this.timerMessage);
  }

  statutDe(r: RendezVous): StatutRendezVous {
    return r.statut ?? 'EN_ATTENTE';
  }

  nomMedecin(r: RendezVous): string {
    if (r.medecin?.prenom || r.medecin?.nom) {
      return `Dr ${r.medecin.prenom ?? ''} ${r.medecin.nom ?? ''}`.trim();
    }
    return r.medecinNom ? `Dr ${r.medecinNom}` : '—';
  }

  specialiteMedecin(r: RendezVous): string {
    return r.medecin?.specialite ?? r.medecinSpecialite ?? '';
  }

  basculer(f: StatutRendezVous): void {
    this.filtre.set(this.filtre() === f ? 'TOUS' : f);
  }

  charger(silencieux = false): void {
    const id = this.auth.session()?.id;
    if (id === undefined) return;
    if (!silencieux) this.chargement.set(true);
    this.service.getFileAttente(id).subscribe({
      next: liste => {
        this.rdvs.set(liste);
        this.maj.set(new Date());
        this.erreur.set(false);
        this.chargement.set(false);
      },
      error: () => {
        // En actualisation automatique, on garde la liste affichée sans l'effacer.
        if (!silencieux) this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  changer(r: RendezVous, statut: StatutRendezVous): void {
    if (r.id === undefined) return;
    this.enCours.set(r.id);
    this.service.modifierStatutRendezVous(r.id, statut).subscribe({
      next: () => {
        this.rdvs.update(l => l.map(x => (x.id === r.id ? { ...x, statut } : x)));
        this.enCours.set(null);
        this.confirmation.set(null);
        this.notifier('ok', `${r.nomPatient} : ${libelleStatut(statut).toLowerCase()}.`);
      },
      error: () => {
        this.enCours.set(null);
        this.notifier('err', 'Mise à jour impossible. Réessayez.');
      },
    });
  }

  private notifier(type: 'ok' | 'err', texte: string): void {
    this.message.set({ type, texte });
    clearTimeout(this.timerMessage);
    this.timerMessage = setTimeout(() => this.message.set(null), 4000);
  }
}
