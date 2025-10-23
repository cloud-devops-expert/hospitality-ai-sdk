# Claude Project Instructions

## Project Overview

This is the **Hospitality AI SDK** - a cost-effective, sustainability-first AI toolkit for hospitality management that combines LLMs with traditional algorithms.

## Core Philosophy

1. **Cost-Effectiveness**: Use the cheapest method that works
2. **Local-First**: Process data locally when possible
3. **Hybrid Approach**: Combine traditional algorithms with AI
4. **Sustainability**: Minimize API calls and computational resources
5. **Pragmatism**: Ship working solutions over perfect ones

## Project Structure

- **`.agent/`** - AI agent workspace for tasks, docs, prompts, and experiments
- **`lib/`** - Core algorithmic modules (sentiment, allocation, pricing, forecast)
- **`app/`** - Next.js pages and API routes
- **`docs/`** - Located in `.agent/docs/` folder

## Development Guidelines

### When Working on This Project

1. **Always try traditional methods first** before suggesting AI/LLM solutions
2. **Consider cost implications** of any new feature
3. **Maintain the hybrid approach** - traditional + AI escalation
4. **Document experiments** in `.agent/experiments/`
5. **Update task tracking** in `.agent/tasks/current.md`

### Code Style

- TypeScript for all new code
- Functional programming preferred
- Clear type definitions
- JSDoc comments for complex logic
- Performance-conscious implementations

### Testing New Features

When adding new features:

1. Implement traditional/algorithmic version first
2. Add AI enhancement as optional
3. Create hybrid decision logic
4. Measure performance and cost
5. Document in `.agent/experiments/`
6. Add demo UI in `app/`

### Cost Optimization Rules

- **Never use AI by default** - make it opt-in
- **Cache results** when possible
- **Batch operations** to reduce API calls
- **Use smaller models** (e.g., GPT-3.5 vs GPT-4)
- **Implement rate limiting** for API calls
- **Provide fallbacks** when AI fails

### Documentation Standards

- Keep `.agent/docs/` up to date
- Document cost analysis for new features
- Provide examples in use case documentation
- Update README.md for major changes
- Maintain QUICKSTART.md accuracy

## Module Responsibilities

### `lib/sentiment/`

- Traditional keyword-based analysis
- AI-powered analysis (optional)
- Hybrid escalation logic
- **Goal**: 70%+ handled by traditional, <30% AI

### `lib/allocation/`

- Rule-based constraint satisfaction
- Weighted scoring algorithm
- Batch optimization
- **Goal**: 85%+ satisfaction match at zero cost

### `lib/pricing/`

- Multi-factor algorithmic pricing
- Seasonal adjustments
- Occupancy-based pricing
- **Goal**: +30% revenue vs fixed pricing

### `lib/forecast/`

- Statistical time-series methods
- Ensemble forecasting
- Seasonality detection
- **Goal**: 80%+ trend accuracy

### `lib/database/`

- **AWS Data API adapter** for serverless PostgreSQL
- **Row-Level Security (RLS)** for multi-tenant isolation
- **DrizzleRLSClient** for automatic tenant context management
- **Goal**: Database-level security, 55% cost reduction, SOC2/GDPR compliant
- **Note**: Hybrid approach - traditional pg for admin, Data API for tenant APIs

## Common Tasks

### Adding a New Algorithm

1. Create in appropriate `lib/` subdirectory
2. Add TypeScript types
3. Implement traditional version
4. Create demo page in `app/`
5. Document in `.agent/docs/use-cases.md`
6. Add cost analysis in `.agent/experiments/`

### Optimizing Performance

1. Profile current implementation
2. Identify bottlenecks
3. Optimize without adding dependencies
4. Benchmark before/after
5. Document in experiments

### Adding AI Enhancement

1. Ensure traditional method exists
2. Implement AI version with error handling
3. Create hybrid decision logic
4. Add cost tracking
5. Make it opt-in via config

## Environment Variables

### AI/ML Features
- `OPENAI_API_KEY` - Optional, for AI features
- `NEXT_PUBLIC_ENABLE_LLM` - Feature flag for AI
- `NEXT_PUBLIC_APP_ENV` - Environment (dev/prod)
- `NEXT_PUBLIC_ENABLE_CACHING` - Enable result caching

### Database Configuration
- `DATABASE_URL` - Traditional PostgreSQL connection string (for admin panel)
- `DB_CLUSTER_ARN` - AWS Aurora cluster ARN (for Data API)
- `DB_SECRET_ARN` - AWS Secrets Manager ARN (for Data API credentials)
- `DATABASE_NAME` - Database name
- `AWS_REGION` - AWS region (default: us-east-1)
- `USE_DATA_API` - Feature flag for Data API (true/false)
- `DEBUG_DATA_API` - Enable debug logging for Data API (true/false)

## File Naming Conventions

- `traditional.ts` - Traditional/algorithmic implementations
- `ai.ts` - AI/LLM implementations
- `hybrid.ts` - Smart escalation logic
- `types.ts` - TypeScript type definitions
- `page.tsx` - Demo UI pages

## Git Workflow

1. Feature branches for new capabilities
2. Commit messages should include cost/performance notes
3. Always push after two commits (as per global CLAUDE.md)
4. Document breaking changes in README

## Hard Rules (from hotel-pro-assistant-monorepo)

### Code Quality & Commits

- **RULE 1**: Push to remote every 2 commits
- **RULE 2**: MUST fix all lint errors before committing
- **RULE 3**: Run lint/typecheck and fix ALL errors before commits
- **RULE 4**: Never commit code with lint, type, or test errors

### Configuration Standards

- **RULE 5**: Use `.ts` files for configuration instead of `.mjs` or `.cjs`
  - Prefer: `eslint.config.ts`, `vite.config.ts`, etc.
  - Exception: Use `.mjs`/`.cjs` only when tool doesn't support TypeScript
- **RULE 6**: Maintain configuration consistency across the project
  - If using specific library/tool, maintain same pattern throughout
  - Configuration file structures follow consistent patterns

### TypeScript Standards

- **RULE 7**: TypeScript for all new code
- **RULE 8**: Clear type definitions required
- **RULE 9**: No `any` types without explicit justification
- **RULE 10**: Prefer explicit return types on functions

### Code Organization

- **RULE 11**: Analysis files go in `.agent/Analysis/` ONLY (never root)
- **RULE 12**: Documentation goes in `.agent/` subfolders ONLY
- **RULE 13**: Tests go in `tests/` or `__tests__/` folders
- **RULE 14**: Demo data goes in `demo/` or `.agent/experiments/` folders
- **RULE 15**: Keep root folder clean (<30 files, no scattered .sh, .py, .md files)

### Local-First Development (CRITICAL)

- **RULE 16**: **LOCAL-FIRST ML ARCHITECTURE (HARD RULE)** - ALL ML inference MUST attempt local processing before cloud
  - 90-95% of operations MUST run on browser/device (Transformers.js, TensorFlow Lite, ML Kit)
  - 4-9% MAY use edge compute (Cloudflare Workers, Vercel Edge) if browser/device insufficient
  - <1% MAY use cloud APIs ONLY when technically impossible locally or user explicitly opts-in
  - **Target**: 95%+ of ML operations at ZERO cloud cost
  - **Reference**: `.agent/docs/local-first-ml-architecture.md` (MANDATORY reading)

- **RULE 17**: Process data locally when possible (applies to all operations, not just ML)
- **RULE 18**: Minimize external API calls (cloud APIs are LAST RESORT, not default)
- **RULE 19**: Implement offline-capable features where feasible (ML MUST work offline)
- **RULE 20**: Cache results to reduce computational resources

### Brand Guidelines

- **RULE 21**: Use Rubik font as the primary brand font
- **RULE 22**: Use navy blue (#1e3a8a) as the primary brand color
- **RULE 23**: ALWAYS implement both light and dark modes
- **RULE 24**: Ensure all UI components support theme switching

## Performance Targets

- Traditional methods: <20ms
- Browser ML (Transformers.js): 50-200ms
- Mobile ML (TensorFlow Lite): 50-150ms
- Edge ML (Cloudflare Workers): 100-400ms
- Cloud APIs (LAST RESORT): <1000ms
- **Target**: 95%+ operations at <200ms and $0 cost
- Average cost per operation: <$0.0001 (target: $0)

## Quality Checklist

Before marking a feature complete:

- [ ] Traditional implementation exists
- [ ] AI enhancement is optional
- [ ] Hybrid logic implemented
- [ ] Demo page created
- [ ] Cost analysis documented
- [ ] README updated
- [ ] Types defined
- [ ] Error handling added
- [ ] Fallbacks implemented

## Future Roadmap

See `.agent/docs/implementation-roadmap.md` for detailed 24-month plan.

**Priority areas (LOCAL-FIRST approach)**:

1. **Browser ML** (Transformers.js) - Month 1-2 (HIGHEST PRIORITY)
2. **Mobile ML** (TensorFlow Lite, ML Kit) - Month 1-2 (HIGHEST PRIORITY)
3. **Edge Functions** (Cloudflare Workers) - Month 3
4. **Model Optimization** (quantization, pruning) - Month 3-4
5. **Cloud APIs** (opt-in only) - Month 6+ (LOWEST PRIORITY)

**Hard Rule**: 95%+ of ML operations MUST run locally (browser/device) at zero cloud cost.

## Resources

### General Documentation
- **Architecture**: `.agent/docs/architecture.md`
- **Use Cases**: `.agent/docs/use-cases.md`
- **Experiments**: `.agent/experiments/cost-analysis.md`
- **Prompts**: `.agent/prompts/sentiment-analysis.md`
- **Tasks**: `.agent/tasks/current.md`

### ML Architecture (CRITICAL - MUST READ)
- **🔥 Local-First ML Architecture**: `.agent/docs/local-first-ml-architecture.md` (HARD RULE - mandatory reading)
- **ML Library Integration**: `.agent/docs/ml-library-integration-analysis.md` (cloud microservices as last resort)
- **On-Device Mobile ML**: `.agent/docs/on-device-ml-mobile-analysis.md` (Expo/React Native strategy)
- **Implementation Roadmap**: `.agent/docs/implementation-roadmap.md` (24-month strategic plan)
- **Gap Analysis**: `.agent/docs/implementation-gap-analysis.md` (what to build next)

### AWS Data API + RLS Documentation
- **Summary**: `.agent/docs/aws-data-api-rls-summary.md` - Executive summary and quick reference
- **Migration Guide**: `.agent/docs/aws-data-api-migration-guide.md` - Complete 5-phase migration plan
- **RLS Deep Dive**: `.agent/docs/data-api-rls-session-variables.md` - How RLS works with Data API
- **Integration Examples**: `.agent/docs/rls-integration-examples.md` - Next.js, Express, PayloadCMS examples
- **Cost Analysis**: `.agent/docs/aws-data-api-migration-analysis.md` - Detailed cost-benefit analysis
- **Infrastructure**: `.agent/infrastructure/aurora-data-api.tf` - Terraform configuration
- **SQL Policies**: `.agent/infrastructure/rls-policies.sql` - PostgreSQL RLS setup

## Remember

> **The best solution is the one that works, ships, and doesn't break the bank.**

Always optimize for:

1. User value
2. Cost efficiency
3. Sustainability
4. Maintainability
5. Performance

In that order.
