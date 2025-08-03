# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📁 Project Structure Update

**Scripts SQL organizados em:** `/sql/` (diagnostics, migrations, fixes, maintenance)
**Scripts JavaScript organizados em:** `/scripts/` (migrations, user-management, testing)
**Documentação SQL:** `/docs/sql/README.md` - Consulte para informações detalhadas sobre scripts

## 🛠️ Development Commands

### Essential Commands
```bash
# Development server (frontend only)
npm run dev

# PIX service server (backend payment processing)
npm run dev:pix

# Both servers simultaneously (requires concurrently)
npm run dev:full

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview

# Run database migrations (IUGU specific)
npm run migrate:iugu

# Bootstrap super admin user (one-time setup)
npm run bootstrap:admin
```

### Payment Integration
The application uses AbacatePay for PIX payments through Supabase Edge Functions. No separate payment service is required - all payment processing is handled via secure edge functions.

### Testing
- No specific test script found in package.json
- When implementing tests, check for existing testing setup in the codebase
- Always verify tests run successfully before committing changes

### Type Checking
- TypeScript is configured with relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- Path aliases configured: `@/*` maps to `./src/*`
- Always run type checking via `npm run build` or IDE

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: React Query + Context API + Custom Hooks
- **Validation**: Zod schemas
- **Routing**: React Router DOM
- **PWA**: Service Worker + Web App Manifest

### Key Architectural Patterns

#### 1. Hook-Centric Architecture
The application heavily relies on custom hooks for business logic:
- `useAuth.tsx` - Authentication and user management
- `useAgendamento.tsx` - Scheduling operations
- `useAdminPermissions.tsx` - Role-based access control
- Pattern: Component → Hook → Supabase → Database

#### 2. Context + Query Architecture
```
AuthProvider (user context)
  ↓
EmpresaUnificadoProvider (business context)
  ↓
QueryClientProvider (data caching)
  ↓
Components (UI layer)
```

#### 3. Role-Based Security
Two main user types with strict permission boundaries:
- **super_admin**: Full system access
- **admin_empresa**: Company-scoped access
- Security enforced at database level (RLS) and application level

#### 4. Multi-Environment Configuration
The build system supports multiple environments:
- **Development**: Full logging, dev tools enabled
- **Staging**: Reduced logging, testing features
- **Production**: Minimal logging, security hardened

## 🔐 Security & Compliance

### Critical Security Features
1. **Production Log Suppression**: All console logs are stripped in production builds
2. **Supabase Security Manager**: Custom wrapper that sanitizes database logs
3. **Audit Trail**: Comprehensive logging of all admin actions
4. **Row Level Security**: Database-level access control via Supabase RLS

### Security Guidelines
- **Never log sensitive data** (UUIDs, emails, etc.) in production
- **Always validate permissions** before database operations
- **Use audit logging** for admin actions via `auditLogger.ts`
- **Sanitize user inputs** using Zod schemas

## 📂 Key Directory Structure

### `/src/components/`
- **`admin/`**: Admin dashboard components (complex business logic)
- **`auth/`**: Authentication forms and flows
- **`billing/`**: Subscription and payment components
- **`entregador/`**: Delivery worker interface
- **`ui/`**: Reusable shadcn/ui components

### `/src/hooks/`
Contains business logic hooks - **always prefer these over direct Supabase calls**:
- Authentication: `useAuth.tsx`
- Permissions: `useAdminPermissions.tsx`, `useUserPermissions.tsx`
- Data operations: `useAgendamento.tsx`, `useCriacaoAgendas.tsx`

### `/src/services/`
Service layer for complex operations:
- `adminManagementService.ts` - Admin CRUD operations
- `agendamentoService.ts` - Scheduling business logic
- `iuguService.ts` - Payment integration

### `/src/lib/`
Utilities and configuration:
- `auditLogger.ts` - Security audit logging
- `logger.ts` - Application logging
- `supabaseSecurityManager.ts` - Database security

### `/src/types/`
TypeScript definitions - **always use existing types or extend them**

## 🔄 Common Development Patterns

### Adding New Admin Features
1. Create component in `/src/components/admin/`
2. Add corresponding hook in `/src/hooks/`
3. Add audit logging for sensitive operations
4. Implement permission checks using `useAdminPermissions`
5. Add to admin sidebar navigation

### Working with Database
1. **Use existing hooks** rather than direct Supabase calls
2. For new queries, extend existing services in `/src/services/`
3. Always implement proper error handling
4. Add audit logging for data modifications

### Security Checklist
- [ ] Permission validation implemented
- [ ] Audit logging added for sensitive operations
- [ ] Input validation using Zod schemas
- [ ] No sensitive data in console logs
- [ ] RLS policies considered for new database operations

## 🚀 Deployment & Environments

### Environment Configuration
The application uses environment-specific builds:
- `.env` files for different environments
- Vite config handles environment-specific optimizations
- Production builds automatically strip console logs and debugging code

### Supabase Integration
- Database migrations in `/supabase/migrations/`
- Edge functions in `/supabase/functions/`
- Configuration in `/supabase/config.toml`

## 📊 Monitoring & Debugging

### Logging System
- **Development**: Full logging via `logger.ts`
- **Production**: Sanitized logs only, security events tracked
- **Audit Trail**: All admin actions logged to database

### Performance Monitoring
- Web Vitals tracking in `App.tsx`
- Memory usage monitoring
- Performance metrics via `performanceMonitor`

## 🧪 Code Quality Standards

### TypeScript Usage
- Relaxed strictness settings in this project
- Always use `@/` import alias for src files
- Prefer type inference over explicit typing where possible

### Component Patterns
- Use shadcn/ui components as base
- Implement responsive design using Tailwind
- Follow existing naming conventions (PascalCase for components)

### Database Operations
- Always use React Query for data fetching
- Implement optimistic updates where appropriate
- Handle loading and error states consistently

## 📱 PWA & Mobile Support

The application is designed as a Progressive Web App:
- Service Worker for offline functionality
- Mobile-optimized navigation
- Touch-friendly interface design
- Installation prompts for mobile users

## 🔧 Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript configuration and import paths
2. **Auth Issues**: Verify Supabase configuration and RLS policies
3. **Permission Errors**: Check user roles and company assignments
4. **Database Errors**: Review audit logs and check migration status

### Development Tips
- Use browser dev tools network tab to debug Supabase queries
- Check audit logs table for admin action debugging
- Verify environment variables are properly loaded
- Test PWA functionality using Chrome DevTools Application tab

## 🛡️ Error Boundaries & Resilience

### Granular Error Boundary System
The application implements specialized error boundaries for different contexts:

#### Error Boundary Types
1. **`ErrorBoundary`** (`/src/components/ErrorBoundary.tsx`)
   - Global fallback error boundary
   - Used at the root level for catastrophic failures
   - Sanitizes error messages in production

2. **`BillingErrorBoundary`** (`/src/components/ErrorBoundary/BillingErrorBoundary.tsx`)
   - Specialized for payment and subscription operations
   - Context-aware error messages for financial operations
   - Enhanced security for payment-related errors
   - Retry mechanism with payment operation safety

3. **`AdminErrorBoundary`** (`/src/components/ErrorBoundary/AdminErrorBoundary.tsx`)
   - Administrative operations protection
   - Critical operation flags for system-level errors
   - Context-specific recovery options
   - Issue reporting system integration

4. **`IntegrationErrorBoundary`** (`/src/components/ErrorBoundary/IntegrationErrorBoundary.tsx`)
   - External API integration failures (Mercado Pago, Iugu, Supabase)
   - Network connectivity awareness
   - Service status page integration
   - Progressive retry with exponential backoff

5. **`LazyLoadErrorBoundary`** (`/src/components/ErrorBoundary/LazyLoadErrorBoundary.tsx`)
   - Chunk loading failures and dynamic imports
   - Cache clearing capabilities
   - Auto-retry for chunk errors
   - Graceful degradation for missing components

#### Implementation Pattern
```tsx
// Wrapper pattern for existing components
function ComponentWrapper(props: ComponentProps) {
  return (
    <SpecificErrorBoundary 
      context="component-context"
      criticalOperation={true}
      onRetry={() => /* recovery logic */}
    >
      <OriginalComponent {...props} />
    </SpecificErrorBoundary>
  );
}
```

#### Error Boundary Usage
- **Billing Components**: Wrapped with `BillingErrorBoundary`
  - `BillingDashboard`, `PlanoSelector`, `SubscriptionForm`
- **Admin Components**: Wrapped with `AdminErrorBoundary`
  - `GestaoEntregadores`, `GestaoEmpresas`, `ConfiguracoesSistema`
- **Integration Components**: Wrapped with `IntegrationErrorBoundary`
  - `ConfiguracoesIugu`, `ConfiguracoesMercadoPago`, `WebhookMonitor`
- **Lazy Components**: Enhanced with `LazyWrapper`
  - All components in `LazyComponents.tsx` now include error recovery

#### Error Recovery Features
- **Contextual Error Messages**: Specific to the operation type
- **Progressive Retry**: Different retry limits per error boundary type
- **Status Page Integration**: Links to service status pages
- **Cache Management**: Service worker cache clearing for chunk errors
- **Offline Mode Support**: Graceful degradation when possible
- **Security Compliance**: Sanitized error reporting in production

### Development Tips
- Use browser dev tools network tab to debug Supabase queries
- Check audit logs table for admin action debugging
- Verify environment variables are properly loaded
- Test PWA functionality using Chrome DevTools Application tab
- **Error boundaries are tested by intentionally throwing errors in development**
- **Monitor error boundary logs to identify recurring issues**

## 💳 PIX Payment Integration & Validation

### AbacatePay Integration Architecture
The application uses AbacatePay for PIX payments with a secure, API-validated approach:

#### Payment Flow Overview
```
User → PlanoSelector → PixQrCodeModal → AbacatePay API → Payment Confirmation
```

### 🔒 **VALIDATED: Real API Payment Verification**

**✅ CONFIRMED**: The system does **NOT** emit automatic success. All payments are validated against real AbacatePay API responses.

#### Payment Validation Process

1. **PIX Creation** (`abacatepay-create-pix` edge function)
   ```
   Frontend → Supabase Edge Function → AbacatePay API
   └─ Creates real PIX QR Code with expiration time
   ```

2. **Payment Status Check** (`abacatepay-check-pix` edge function)
   ```
   "Já efetuei o pagamento" button → checkPaymentStatus()
   └─ Supabase Edge Function → AbacatePay API → Real status
   ```

3. **Status Responses**
   | API Status | System Behavior |
   |------------|----------------|
   | `PAID` | ✅ Success modal + plan activation |
   | `PENDING` | ⏳ "Payment still pending" message |
   | `EXPIRED` | ❌ "PIX expired" error |
   | `CANCELLED` | ❌ "PIX cancelled" error |

### Edge Functions for PIX
Located in `/supabase/functions/`:

1. **`abacatepay-create-pix/`**
   - Creates PIX QR Code via AbacatePay API
   - Handles authentication and error responses
   - Returns QR code image and payment data

2. **`abacatepay-check-pix/`**
   - Validates payment status in real-time
   - Queries AbacatePay API for actual payment status
   - No automatic success - only real API responses

3. **`abacatepay-list-billings/`**
   - Lists all billings from AbacatePay
   - Used for payment history and reconciliation

### Configuration Required

#### Environment Variables (Supabase Secrets)
```bash
# Set via: npx supabase secrets set VARIABLE_NAME=value
ABACATEPAY_API_KEY_PROD=your_production_key
ABACATEPAY_API_KEY_DEV=your_development_key
```

#### supabase/config.toml
```toml
[functions.abacatepay-create-pix]
verify_jwt = true

[functions.abacatepay-check-pix]
verify_jwt = true

[functions.abacatepay-list-billings]
verify_jwt = true
```

### Security Features

1. **No Direct Frontend API Calls**
   - All AbacatePay calls go through secure edge functions
   - Prevents CORS issues and API key exposure
   - Server-side validation only

2. **Real Payment Verification**
   - Cannot bypass payment validation
   - No mock success in production
   - API keys secured in Supabase environment

3. **Development vs Production**
   ```
   Development: Uses ABACATEPAY_API_KEY_DEV (sandbox)
   Production:  Uses ABACATEPAY_API_KEY_PROD (real payments)
   ```

### Debug Logs for PIX
Monitor these console logs during payment flow:

```javascript
// PIX Creation
"📤 Criando PIX na AbacatePay via Edge Function"
"✅ PIX criado com sucesso via Edge Function: [pixId]"

// Payment Verification  
"Verificando status do pagamento PIX: [pixId]"
"Status atualizado do PIX: { status: 'PAID/PENDING/...' }"

// Success Confirmation
"🎉 Modal de sucesso fechado, plano confirmado: [planoType]"
"✅ Notificando componente pai sobre novo plano: [planoType]"
```

### QR Code Display Fix
**Issue Resolved**: QR Code was blurred due to duplicate base64 prefix.

**Solution**: `getQrCodeImageSrc()` function in `PixQrCodeModal.tsx`:
```typescript
const getQrCodeImageSrc = (brCodeBase64: string): string => {
  // Prevents duplicate "data:image/png;base64," prefix
  if (brCodeBase64.startsWith('data:image/')) {
    return brCodeBase64;
  }
  return `data:image/png;base64,${brCodeBase64}`;
};
```

### Payment Flow Components

1. **`PlanoSelector.tsx`** - Plan selection and payment initiation
2. **`PixQrCodeModal.tsx`** - QR code display and payment verification
3. **`PaymentSuccessModal.tsx`** - Success confirmation and plan activation
4. **`abacatePayService.ts`** - Service layer for all AbacatePay operations

### Troubleshooting PIX Issues

Common issues and solutions:

1. **CORS Errors**: Ensure edge functions are deployed
2. **QR Code Blurred**: Check base64 prefix format
3. **Payment Not Detected**: Verify API keys and environment
4. **Mock Success**: Check if using development environment

### Testing Payment Flow

1. **Development**: Uses sandbox environment with test payments
2. **Production**: Real AbacatePay API with actual money transfers
3. **Verification**: Always check console logs for API call traces