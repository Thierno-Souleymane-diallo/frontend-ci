import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface SessionEtablissement {
  id: number;
  nom: string;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly KEY = 'sunusante_session';

  session = signal<SessionEtablissement | null>(this.lire());

  login(nom: string, motDePasse: string): Observable<SessionEtablissement> {
    return this.http
      .post<SessionEtablissement>('/api/auth/login', { nom, motDePasse })
      .pipe(
        tap(s => {
          this.session.set(s);
          if (this.isBrowser) {
            try { sessionStorage.setItem(this.KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ }
          }
        })
      );
  }

  logout(): void {
    this.session.set(null);
    if (this.isBrowser) {
      try { sessionStorage.removeItem(this.KEY); } catch { /* stockage indisponible */ }
    }
  }

  estConnecte(): boolean {
    return this.session() !== null;
  }

  private lire(): SessionEtablissement | null {
    if (!this.isBrowser) return null;
    try {
      const brut = sessionStorage.getItem(this.KEY);
      return brut ? JSON.parse(brut) : null;
    } catch {
      return null;
    }
  }
}
