import { Page } from '@playwright/test';
import { StateFactory } from 'poc-model-state-playwright';
import { HomePage } from './pages/HomePage';
import { DocsOverviewPage } from './pages/DocsPage';
import { GettingStartedPage } from './pages/GettingStartedPage';
import { ApiPage } from './pages/ApiPage';

/**
 * Configures the StateFactory with all Page Object mappings.
 */
export function createStateFactory(page: Page): StateFactory {
  const factory = new StateFactory(page);

  factory.register('home', HomePage);
  factory.register('docs', DocsOverviewPage);
  factory.register('docs.overview', DocsOverviewPage);
  factory.register('docs.gettingStarted', GettingStartedPage);
  factory.register('docs.api', ApiPage);
  factory.register('api', ApiPage);

  return factory;
}
