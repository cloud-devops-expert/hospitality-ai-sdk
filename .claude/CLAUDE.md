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

- `OPENAI_API_KEY` - Optional, for AI features
- `NEXT_PUBLIC_ENABLE_LLM` - Feature flag for AI
- `NEXT_PUBLIC_APP_ENV` - Environment (dev/prod)
- `NEXT_PUBLIC_ENABLE_CACHING` - Enable result caching

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

## Performance Targets

- Traditional methods: <20ms
- AI methods: <1000ms
- Hybrid average: <200ms
- Cost per operation: <$0.0001

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

See `.agent/docs/project-summary.md` for detailed roadmap.

Priority areas:
1. Browser-based AI (Transformers.js)
2. Result caching layer
3. ARIMA forecasting
4. Batch processing API

## Resources

- **Architecture**: `.agent/docs/architecture.md`
- **Use Cases**: `.agent/docs/use-cases.md`
- **Experiments**: `.agent/experiments/cost-analysis.md`
- **Prompts**: `.agent/prompts/sentiment-analysis.md`
- **Tasks**: `.agent/tasks/current.md`

## Remember

> **The best solution is the one that works, ships, and doesn't break the bank.**

Always optimize for:
1. User value
2. Cost efficiency
3. Sustainability
4. Maintainability
5. Performance

In that order.
