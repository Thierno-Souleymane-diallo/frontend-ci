import { RenderMode, ServerRoute } from '@angular/ssr';

// Application 100 % cliente : évite le prérendu des routes dynamiques (/:id) au build.
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Client },
];