import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SunuSanteService } from '../services/sunusante.service';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="sn-login">
      <aside class="sn-login__brand">
        <div class="sn-brand sn-brand--light">
          <span class="sn-brand__logo">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>
          </span>
          <span class="sn-brand__name">Sunu<strong>Santé</strong></span>
        </div>
        <h2>Pilotez votre file d'attente en temps réel.</h2>
        <p>Suivez les patients du jour, mettez à jour leur statut et gérez les praticiens de votre établissement.</p>
      </aside>

      <section class="sn-login__panel">
        <form class="sn-login__card" [formGroup]="form" (ngSubmit)="connexion()" novalidate>
          <h1>Espace établissement</h1>
          <p class="sn-muted">Connectez-vous avec le nom de votre établissement.</p>

          <div class="sn-field">
            <label for="nom">Nom de l'établissement</label>
            <input id="nom" class="sn-input" formControlName="nom" list="liste-etabs" autocomplete="username"
                   placeholder="Ex : Centre de santé de Bambey" [class.is-invalid]="invalide('nom')" />
            <datalist id="liste-etabs">
              @for (n of noms(); track n) { <option [value]="n"></option> }
            </datalist>
            @if (invalide('nom')) { <small class="sn-error">Saisissez le nom de l'établissement.</small> }
          </div>

          <div class="sn-field">
            <label for="mdp">Mot de passe</label>
            <div class="sn-password">
              <input id="mdp" class="sn-input" formControlName="motDePasse" autocomplete="current-password"
                     [type]="afficherMdp() ? 'text' : 'password'" [class.is-invalid]="invalide('motDePasse')" />
              <button type="button" class="sn-password__toggle" (click)="afficherMdp.set(!afficherMdp())"
                      [attr.aria-label]="afficherMdp() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                {{ afficherMdp() ? 'Masquer' : 'Afficher' }}
              </button>
            </div>
            @if (invalide('motDePasse')) { <small class="sn-error">Saisissez votre mot de passe.</small> }
          </div>

          @if (erreur(); as err) { <div class="sn-alert sn-alert--error" role="alert">{{ err }}</div> }

          <button type="submit" class="sn-btn sn-btn--primary sn-btn--block sn-btn--lg" [disabled]="envoi()">
            @if (envoi()) { <span class="sn-spinner" aria-hidden="true"></span> Connexion… } @else { Se connecter }
          </button>

          <a routerLink="/patient" class="sn-back sn-back--center">← Retour à l'espace patient</a>
        </form>
      </section>
    </div>
  `,
})
export class ConnexionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private service = inject(SunuSanteService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    motDePasse: ['', Validators.required],
  });

  noms = signal<string[]>([]);
  afficherMdp = signal(false);
  envoi = signal(false);
  erreur = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.estConnecte()) {
      this.router.navigateByUrl('/etablissement');
      return;
    }
    this.service.getEtablissements().subscribe({
      next: liste => this.noms.set(liste.map(e => e.nom)),
      error: () => { /* l'aide à la saisie est facultative */ },
    });
  }

  invalide(champ: 'nom' | 'motDePasse'): boolean {
    const c = this.form.controls[champ];
    return c.invalid && (c.touched || c.dirty);
  }

  connexion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nom, motDePasse } = this.form.getRawValue();
    this.envoi.set(true);
    this.erreur.set(null);
    this.auth.login(nom.trim(), motDePasse).subscribe({
      next: () => this.router.navigateByUrl('/etablissement'),
      error: (e: HttpErrorResponse) => {
        this.envoi.set(false);
        this.erreur.set(
          [400, 401, 403, 404].includes(e.status)
            ? "Nom d'établissement ou mot de passe incorrect."
            : e.status === 0
              ? 'Serveur injoignable. Vérifiez votre connexion.'
              : 'Une erreur est survenue. Réessayez dans un instant.'
        );
      },
    });
  }
}
