import { Routes } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { StudyPlanner } from './study-planner/study-planner';
import { Techniques } from './techniques/techniques';
import { Main } from './main';

export const MainRoutes: Routes = [
 {
    path: 'main',
    component: Main,
    children: [
      { path: '', redirectTo: 'study', pathMatch: 'full' },
      { path: 'study', component: StudyPlanner},
      { path: 'techniques', component: Techniques },
    ],
  },
];
