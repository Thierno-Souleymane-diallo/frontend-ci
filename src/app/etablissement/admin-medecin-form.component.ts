import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SunuSanteService } from '../services/sunusante.service';
import { Medecin } from '../models/medecin.model';
import { SPECIALITES } from '../shared/statut';
import { normaliserTelephone, telephoneValidator } from '../shared/telephone';

type Champ = 'prenom' | 'nom' | 'specialite' | 'telephone';

/** Corps envoyé au backend pour créer un médecin. */
export interface MedecinRequest {
  prenom: string;
  nom: string;
  specialite: string;
  telephone?: string;
  etablissementId: number;
}

@Component({
  selector: 'app-admin-medecin-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="sn-card sn-form" [formGroup]="form" (ngSubmit)="soumettre()" novalidate>
      <h2>Nouveau médecin</h2>

      <div class="sn-formgrid">
        <div class="sn-field">
          <label for="prenom">Prénom</label>
          <input id="prenom" class="sn-input" formControlName="prenom" [class.is-invalid]="invalide('prenom')" />
          @if (invalide('prenom')) { <small class="sn-error">Le prénom est obligatoire.</small> }
        </div>
        <div class="sn-field">
          <label for="nom-med">Nom</label>
          <input id="nom-med" class="sn-input" formControlName="nom" [class.is-invalid]="invalide('nom')" />
          @if (invalide('nom')) { <small class="sn-error">Le nom est obligatoire.</small> }
        </div>
        <div class="sn-field">
          <label for="spec">Spécialité</label>
          <input id="spec" class="sn-input" formControlName="specialite" list="specialites" placeholder="Ex : Pédiatrie" [class.is-invalid]="invalide('specialite')" />
          <datalist id="specialites">
            @for (s of specialites; track s) { <option [value]="s"></option> }
          </datalist>
          @if (invalide('specialite')) { <small class="sn-error">La spécialité est obligatoire.</small> }
        </div>
        <div class="sn-field">
          <label for="tel-med">Téléphone <span class="sn-muted">(facultatif)</span></label>
          <input id="tel-med" class="sn-input" formControlName="telephone" type="tel" placeholder="Ex : 77 123 45 67" [class.is-invalid]="invalide('telephone')" />
          @if (invalide('telephone')) { <small class="sn-error">Numéro invalide (ex : 77 123 45 67).</small> }
        </div>
      </div>

      @if (erreur(); as err) { <div class="sn-alert sn-alert--error">{{ err }}</div> }

      <div class="sn-actions">
        <button type="submit" class="sn-btn sn-btn--primary" [disabled]="envoi()">
          @if (envoi()) { <span class="sn-spinner" aria-hidden="true"></span> Enregistrement… } @else { Enregistrer le médecin }
        </button>
        <button type="button" class="sn-btn sn-btn--ghost" (click)="annule.emit()">Annuler</button>
      </div>
    </form>
  `,
})
export class AdminMedecinFormComponent {
  private fb = inject(FormBuilder);
  private service = inject(SunuSanteService);

  etablissementId = input.required<number>();
  ajoute = output<Medecin>();
  annule = output<void>();

  readonly specialites = SPECIALITES;
  envoi = signal(false);
  erreur = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.maxLength(80)]],
    nom: ['', [Validators.required, Validators.maxLength(80)]],
    specialite: ['', [Validators.required, Validators.maxLength(80)]],
    telephone: ['', [telephoneValidator]],
  });

  invalide(champ: Champ): boolean {
    const c = this.form.controls[champ];
    return c.invalid && (c.touched || c.dirty);
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const medecin: MedecinRequest = {
      prenom: v.prenom.trim(),
      nom: v.nom.trim(),
      specialite: v.specialite.trim(),
      etablissementId: this.etablissementId(),
    };
    if (v.telephone) medecin.telephone = normaliserTelephone(v.telephone);

    this.envoi.set(true);
    this.erreur.set(null);
    this.service.ajouterMedecin(medecin).subscribe({
      next: cree => {
        this.envoi.set(false);
        this.form.reset();
        this.ajoute.emit(cree);
      },
      error: (e: HttpErrorResponse) => {
        this.envoi.set(false);
        this.erreur.set(
          e.status === 0
            ? 'Serveur injoignable. Réessayez dans un instant.'
            : e.error?.message ?? "Le médecin n'a pas pu être enregistré."
        );
      },
    });
  }
}