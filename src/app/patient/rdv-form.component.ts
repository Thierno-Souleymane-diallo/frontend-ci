import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { SunuSanteService } from '../services/sunusante.service';
import { Etablissement } from '../models/etablissement.model';
import { Medecin } from '../models/medecin.model';
import { RendezVous } from '../models/rendez-vous.model';
import { dateFutureValidator, normaliserTelephone, telephoneValidator } from '../shared/telephone';

type Champ = 'nomPatient' | 'telephonePatient' | 'dateHeure' | 'motif';

@Component({
  selector: 'app-rdv-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <div class="sn-container sn-section sn-narrow">
      @if (confirmation(); as c) {
        <div class="sn-card sn-success">
          <div class="sn-success__icon" aria-hidden="true">✓</div>
          <h1>Rendez-vous enregistré</h1>
          <p class="sn-muted">Présentez-vous à l'accueil quelques minutes avant l'heure prévue.</p>
          <dl class="sn-summary">
            <div><dt>Patient</dt><dd>{{ c.nomPatient }}</dd></div>
            <div><dt>Médecin</dt><dd>Dr {{ medecin()?.prenom }} {{ medecin()?.nom }} · {{ medecin()?.specialite }}</dd></div>
            @if (etablissement(); as e) { <div><dt>Établissement</dt><dd>{{ e.nom }}</dd></div> }
            <div><dt>Date et heure</dt><dd>{{ c.dateHeure | date: "EEEE d MMMM y 'à' HH:mm" }}</dd></div>
          </dl>
          <div class="sn-actions">
            <a class="sn-btn sn-btn--primary" routerLink="/patient/mes-rendez-vous" [queryParams]="{ tel: c.telephonePatient }">Suivre mes rendez-vous</a>
            <a class="sn-btn sn-btn--outline" routerLink="/patient/etablissements">Retour à l'accueil</a>
          </div>
        </div>
      } @else if (chargement()) {
        <div class="sn-card sn-skeleton" style="height: 420px"></div>
      } @else if (erreurChargement()) {
        <div class="sn-alert sn-alert--error">
          <div><strong>Impossible de charger le médecin.</strong><p>Vérifiez votre connexion puis réessayez.</p></div>
          <button type="button" class="sn-btn sn-btn--outline sn-btn--sm" (click)="ngOnInit()">Réessayer</button>
        </div>
      } @else if (!medecin()) {
        <div class="sn-empty">
          <h3>Aucun médecin sélectionné</h3>
          <p>Choisissez d'abord un établissement puis un médecin.</p>
          <a class="sn-btn sn-btn--primary" routerLink="/patient/etablissements">Voir les établissements</a>
        </div>
      } @else {
        @if (medecin(); as m) {
          <a [routerLink]="['/patient/etablissements', m.etablissement?.id ?? etabId, 'medecins']" class="sn-back">← Retour aux médecins</a>
          <header class="sn-pagehead">
            <h1>Réserver un rendez-vous</h1>
          </header>

          <div class="sn-card sn-recap">
            <div class="sn-avatar" aria-hidden="true">{{ (m.prenom.charAt(0) + m.nom.charAt(0)).toUpperCase() }}</div>
            <div>
              <strong>Dr {{ m.prenom }} {{ m.nom }}</strong>
              <div><span class="sn-badge sn-badge--spec">{{ m.specialite }}</span></div>
              @if (etablissement(); as e) { <small class="sn-muted">{{ e.nom }} · {{ e.ville }}</small> }
            </div>
          </div>

          <form class="sn-card sn-form" [formGroup]="form" (ngSubmit)="soumettre()" novalidate>
            <div class="sn-field">
              <label for="nom">Nom complet</label>
              <input id="nom" class="sn-input" formControlName="nomPatient" autocomplete="name" placeholder="Ex : Awa Diop" [class.is-invalid]="invalide('nomPatient')" />
              @if (invalide('nomPatient')) { <small class="sn-error">{{ message('nomPatient') }}</small> }
            </div>

            <div class="sn-field">
              <label for="tel">Téléphone</label>
              <input id="tel" class="sn-input" formControlName="telephonePatient" type="tel" autocomplete="tel" placeholder="Ex : 77 123 45 67" [class.is-invalid]="invalide('telephonePatient')" />
              @if (invalide('telephonePatient')) { <small class="sn-error">{{ message('telephonePatient') }}</small> }
              @else { <small class="sn-hint">Vous retrouverez vos rendez-vous avec ce numéro.</small> }
            </div>

            <div class="sn-field">
              <label for="date">Date et heure souhaitées</label>
              <input id="date" class="sn-input" formControlName="dateHeure" type="datetime-local" [min]="minDate" [class.is-invalid]="invalide('dateHeure')" />
              @if (invalide('dateHeure')) { <small class="sn-error">{{ message('dateHeure') }}</small> }
            </div>

            <div class="sn-field">
              <label for="motif">Motif de la consultation</label>
              <textarea id="motif" class="sn-input" rows="3" formControlName="motif" maxlength="300" placeholder="Ex : Fièvre depuis deux jours, vaccin de rappel…" [class.is-invalid]="invalide('motif')"></textarea>
              @if (invalide('motif')) { <small class="sn-error">{{ message('motif') }}</small> }
              @else { <small class="sn-hint">{{ form.controls.motif.value.length }}/300</small> }
            </div>

            @if (erreurEnvoi(); as err) { <div class="sn-alert sn-alert--error">{{ err }}</div> }

            <button type="submit" class="sn-btn sn-btn--primary sn-btn--block sn-btn--lg" [disabled]="envoi()">
              @if (envoi()) { <span class="sn-spinner" aria-hidden="true"></span> Enregistrement… } @else { Confirmer le rendez-vous }
            </button>
          </form>
        }
      }
    </div>
  `,
})
export class RdvFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(SunuSanteService);
  private fb = inject(FormBuilder);

  etabId = 0;
  medecin = signal<Medecin | null>(null);
  etablissement = signal<Etablissement | null>(null);
  chargement = signal(true);
  erreurChargement = signal(false);
  envoi = signal(false);
  erreurEnvoi = signal<string | null>(null);
  confirmation = signal<RendezVous | null>(null);

  readonly minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  form = this.fb.nonNullable.group({
    nomPatient: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    telephonePatient: ['', [Validators.required, telephoneValidator]],
    dateHeure: ['', [Validators.required, dateFutureValidator]],
    motif: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.etabId = Number(q.get('etablissementId'));
    const medId = Number(q.get('medecinId'));
    if (!this.etabId || !medId) {
      this.chargement.set(false);
      return;
    }
    this.chargement.set(true);
    this.erreurChargement.set(false);
    forkJoin({
      medecins: this.service.getMedecinsParEtablissement(this.etabId),
      etabs: this.service.getEtablissements().pipe(catchError(() => of([] as Etablissement[]))),
    }).subscribe({
      next: ({ medecins, etabs }) => {
        this.medecin.set(medecins.find(m => m.id === medId) ?? null);
        this.etablissement.set(etabs.find(e => e.id === this.etabId) ?? null);
        this.chargement.set(false);
      },
      error: () => {
        this.erreurChargement.set(true);
        this.chargement.set(false);
      },
    });
  }

  invalide(champ: Champ): boolean {
    const c = this.form.controls[champ];
    return c.invalid && (c.touched || c.dirty);
  }

  message(champ: Champ): string {
    const e = this.form.controls[champ].errors;
    if (!e) return '';
    if (e['required']) return 'Ce champ est obligatoire.';
    if (e['minlength']) return `Minimum ${e['minlength'].requiredLength} caractères.`;
    if (e['telephone']) return 'Numéro invalide (ex : 77 123 45 67).';
    if (e['passee']) return 'Choisissez une date et une heure à venir.';
    if (e['dateInvalide']) return 'Date invalide.';
    return 'Valeur invalide.';
  }

  soumettre(): void {
    const m = this.medecin();
    if (this.form.invalid || !m) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rdv: RendezVous = {
      nomPatient: v.nomPatient.trim(),
      telephonePatient: normaliserTelephone(v.telephonePatient),
      dateHeure: v.dateHeure.length === 16 ? `${v.dateHeure}:00` : v.dateHeure,
      motif: v.motif.trim(),
      statut: 'EN_ATTENTE',
      medecin: { id: m.id } as Medecin,
    };

    this.envoi.set(true);
    this.erreurEnvoi.set(null);
    this.service.creerRendezVous(rdv).subscribe({
      next: cree => {
        this.envoi.set(false);
        this.confirmation.set({ ...rdv, ...cree });
      },
      error: (e: HttpErrorResponse) => {
        this.envoi.set(false);
        this.erreurEnvoi.set(
          e.status === 0
            ? 'Serveur injoignable. Vérifiez votre connexion puis réessayez.'
            : e.error?.message ?? "Le rendez-vous n'a pas pu être enregistré. Réessayez dans un instant."
        );
      },
    });
  }
}
