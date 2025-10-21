# Code Quality Standards

This document outlines the code quality standards and tools used in the Hospitality AI SDK project.

## ESLint Configuration

The project uses ESLint with the following setup:
- **Config File**: `eslint.config.mjs` (ESLint 9 flat config format)
- **Extends**: `next/core-web-vitals`, `next/typescript`
- **Parser**: `@typescript-eslint/parser`

### Key Rules

#### TypeScript Rules
- `@typescript-eslint/no-explicit-any`: error - Prevents use of `any` type
- `@typescript-eslint/no-unused-vars`: error - Flags unused variables (allows `_` prefix for intentionally unused)
- Explicit function return types recommended for complex functions

#### React/Next.js Rules
- `react/react-in-jsx-scope`: off - Not needed in Next.js
- `react/prop-types`: off - Using TypeScript instead
- `react/no-unescaped-entities`: error - Requires proper HTML entities

#### Code Quality Rules
- `no-console`: warn - Allows `console.warn` and `console.error` only
- `prefer-const`: error - Use `const` for values that don't change
- `no-var`: error - Always use `let` or `const`, never `var`

## Scripts

### Linting
```bash
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors where possible
```

### Type Checking
```bash
npm run typecheck     # Verify TypeScript types
```

## Pre-Commit Checklist

Before committing code, ensure:
- ✅ `npm run lint` passes with no errors
- ✅ `npm run typecheck` passes with no errors
- ✅ All new functions have proper TypeScript types
- ✅ No `any` types without explicit justification
- ✅ Unused variables are prefixed with `_` or removed

## Hard Rules (from hotel-pro-assistant-monorepo)

### Commit Rules
1. **MUST fix all lint errors before committing**
2. **Push to remote every 2 commits**
3. **Never commit code with lint, type, or test errors**

### Configuration Standards
1. **Use `.ts` files for configuration** when possible
2. **Maintain configuration consistency** across the project
3. **Follow the same patterns** for similar functionality

### TypeScript Standards
1. **TypeScript for all new code**
2. **Clear type definitions required**
3. **No `any` types without explicit justification**
4. **Prefer explicit return types on functions**

### Code Organization
1. **Analysis files** → `.agent/Analysis/` only
2. **Documentation** → `.agent/` subfolders only
3. **Tests** → `tests/` or `__tests__/` folders
4. **Demo data** → `demo/` or `.agent/experiments/` folders
5. **Keep root folder clean** (<30 files, no scattered scripts)

### Brand Guidelines
1. **Use Rubik font** as the primary brand font (from Google Fonts)
2. **Use navy blue (#1e3a8a)** as the primary brand color
3. **ALWAYS implement both light and dark modes**
4. **Ensure all UI components support theme switching**

## Local-First Development

Following the project's core philosophy:
1. **Process data locally** when possible
2. **Minimize external API calls**
3. **Implement offline-capable features** where feasible
4. **Cache results** to reduce computational resources

## Performance Targets

Code should meet these performance targets:
- **Traditional methods**: <20ms
- **AI methods**: <1000ms
- **Hybrid average**: <200ms
- **Cost per operation**: <$0.0001

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
- [ ] All lint/type checks pass

## Tools

### ESLint
- **Version**: 9.38.0+
- **Config**: Flat config format (`.mjs`)
- **Extensions**: Next.js, TypeScript

### TypeScript
- **Version**: 5.3.0+
- **Strict Mode**: Enabled
- **No Emit**: Used for type checking only

### Development Dependencies
- `eslint`: Core linting engine
- `eslint-config-next`: Next.js specific rules
- `@typescript-eslint/parser`: TypeScript parser
- `@typescript-eslint/eslint-plugin`: TypeScript rules
- `@eslint/eslintrc`: Compatibility layer
- `jiti`: TypeScript config loader

## Best Practices

### Error Handling
```typescript
// ✅ Good - No unused catch parameter
try {
  await riskyOperation();
} catch {
  // Handle error without binding
  return fallbackValue;
}

// ❌ Bad - Unused error variable
try {
  await riskyOperation();
} catch (error) {
  // error is defined but never used
  return fallbackValue;
}
```

### Type Safety
```typescript
// ✅ Good - Explicit types
export function calculatePrice(
  baseRate: number,
  occupancy: number
): PriceResult {
  // Implementation
}

// ❌ Bad - Implicit any
export function calculatePrice(baseRate, occupancy) {
  // Implementation
}
```

### Constants
```typescript
// ✅ Good - Use const for immutable values
const maxGuests = 4;
const roomTypes = ['standard', 'deluxe', 'suite'];

// ❌ Bad - Using let unnecessarily
let maxGuests = 4;
let roomTypes = ['standard', 'deluxe', 'suite'];
```

### React Components
```typescript
// ✅ Good - Proper HTML entities
<p>Click &ldquo;Submit&rdquo; to continue</p>

// ❌ Bad - Unescaped quotes
<p>Click "Submit" to continue</p>
```

## Continuous Improvement

Code quality is continuously monitored and improved:
1. **Regular reviews** of ESLint rules
2. **Updates** to match evolving best practices
3. **Team feedback** incorporated into standards
4. **Automated checks** in development workflow

## Resources

- [ESLint Documentation](https://eslint.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [React Hooks Rules](https://react.dev/reference/rules)

## Questions or Issues?

If you encounter code quality issues or have questions about standards:
1. Check this documentation first
2. Review `.claude/CLAUDE.md` for project-specific rules
3. Consult the ESLint configuration in `eslint.config.mjs`
4. Ask the team for clarification
