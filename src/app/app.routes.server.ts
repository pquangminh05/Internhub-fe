import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'settings/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tasks/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-tasks/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'skills/**',
    renderMode: RenderMode.Client,
  },
];
