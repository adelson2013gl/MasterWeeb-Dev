/**
 * Barrel exports para Error Boundaries
 * Facilita importação dos diferentes tipos de error boundaries
 */

export { ErrorBoundary } from '../ErrorBoundary';
export { BillingErrorBoundary } from './BillingErrorBoundary';
export { AdminErrorBoundary } from './AdminErrorBoundary';
export { IntegrationErrorBoundary } from './IntegrationErrorBoundary';
export { LazyLoadErrorBoundary, LazyWrapper } from './LazyLoadErrorBoundary';

// Re-export types se necessário
export type { ComponentType, ReactNode } from 'react';