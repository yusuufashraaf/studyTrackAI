import { Routes } from '@angular/router';
import { StudyPlanner } from './study-planner/study-planner';
import { Techniques } from './techniques/techniques';
import { Main } from './main';
import { authguardGuard } from '../auth/authguard-guard';

export const MainRoutes: Routes = [
  {
    path: 'main',
    component: Main,
    canActivate: [authguardGuard],
    children: [
      { path: '', redirectTo: 'study', pathMatch: 'full' },
      { path: 'study', component: StudyPlanner },
      { path: 'techniques', component: Techniques },
    ],
  },
];
