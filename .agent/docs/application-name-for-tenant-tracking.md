# Using application_name for Tenant Tracking

## What is application_name?

`application_name` is a PostgreSQL connection parameter that identifies the application connecting to the database.

### Traditional PostgreSQL Usage

```typescript
// With node-postgres (pg)
const client = new Pool({
  connectionString: 'postgresql://...',
  application_name: 'hospitality-api',
});

// Shows in pg_stat_activity
SELECT application_name, query FROM pg_stat_activity;
// Result: 'hospitality-api' | 'SELECT * FROM bookings'
```

### Benefits in Traditional Connections

1. ✅ **Visible in `pg_stat_activity`** - See which app is running which queries
2. ✅ **Performance Insights** - Group queries by application
3. ✅ **Query logging** - Appears in PostgreSQL logs
4. ✅ **Connection tracking** - Identify connections by application

---

## AWS Data API Limitation

### ❌ Data API Does NOT Support Connection Parameters

**Problem**: AWS Data API doesn't expose `application_name` or other connection parameters in the API.

```typescript
// ❌ This doesn't work with Data API
const command = new ExecuteStatementCommand({
  resourceArn: '...',
  secretArn: '...',
  database: 'mydb',
  sql: 'SELECT * FROM bookings',
  // ❌ No parameter for application_name
  // applicationName: 'tenant-123', // NOT SUPPORTED
});
```

**Why**: Data API is HTTP-based and stateless. AWS manages connections internally.

---

## Workaround: SET application_name in Transaction

### ✅ You CAN Set It Via SQL

Even though you can't set `application_name` as a connection parameter, you **CAN** set it within your transaction:

```typescript
// lib/database/drizzle-rls-client-with-app-name.ts

export class DrizzleRLSClient {
  async withRLS<T>(context: RLSContext, callback: (tx: any) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      // Set application_name to tenant_id
      await tx.execute(sql`SET LOCAL application_name = ${context.tenantId}`);

      // Also set custom session variables for RLS
      await tx.execute(sql`SET LOCAL app.current_tenant_id = ${context.tenantId}`);

      if (context.userId) {
        await tx.execute(sql`SET LOCAL app.current_user_id = ${context.userId}`);
      }

      // Execute queries
      const result = await callback(tx);

      return result;
    });
  }
}
```

### What This Achieves

```sql
-- Now visible in monitoring
SELECT application_name, state, query
FROM pg_stat_activity
WHERE application_name LIKE 'tenant-%';

-- Result:
-- application_name | state  | query
-- tenant-123       | active | SELECT * FROM bookings WHERE...
-- tenant-456       | active | INSERT INTO properties VALUES...
```

---

## Comparison: application_name vs. Custom Session Variables

### Current Approach (Custom Session Variables)

```sql
SET LOCAL app.current_tenant_id = 'tenant-123';
SET LOCAL app.current_user_id = 'user-456';
```

**Advantages**:
- ✅ Clear semantic meaning
- ✅ Multiple variables (tenant + user)
- ✅ Works with RLS policies
- ✅ No conflicts with other apps

**Disadvantages**:
- ❌ Not visible in `pg_stat_activity`
- ❌ Not visible in Performance Insights
- ❌ Requires custom RLS policy functions

---

### Alternative: application_name

```sql
SET LOCAL application_name = 'tenant-123';
```

**Advantages**:
- ✅ Visible in `pg_stat_activity`
- ✅ Visible in Performance Insights
- ✅ Shows up in database logs
- ✅ Standard PostgreSQL parameter

**Disadvantages**:
- ❌ Only one value (can't store both tenant + user)
- ❌ String concatenation needed for multiple IDs
- ❌ RLS policies must parse application_name
- ❌ Conflicts if using for actual app identification

---

## Hybrid Approach (Recommended)

### Use BOTH for Different Purposes

```typescript
export class DrizzleRLSClient {
  async withRLS<T>(context: RLSContext, callback: (tx: any) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      // 1. Set application_name for monitoring visibility
      await tx.execute(sql`
        SET LOCAL application_name = ${`tenant-${context.tenantId}`}
      `);

      // 2. Set custom session variables for RLS
      await tx.execute(sql`
        SET LOCAL app.current_tenant_id = ${context.tenantId}
      `);

      if (context.userId) {
        await tx.execute(sql`
          SET LOCAL app.current_user_id = ${context.userId}
        `);
      }

      return await callback(tx);
    });
  }
}
```

**Why this works**:
- ✅ `application_name` provides **visibility** in monitoring tools
- ✅ Custom variables provide **precise RLS** control
- ✅ No conflicts - each serves a different purpose

---

## RLS Policies with application_name

### Option 1: Keep Current Approach (Recommended)

```sql
-- RLS policy using custom session variable (current)
CREATE POLICY tenant_isolation ON bookings
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

**Advantage**: Clean, explicit, separate from monitoring

---

### Option 2: Use application_name in RLS Policies

```sql
-- RLS policy using application_name
CREATE POLICY tenant_isolation_via_app_name ON bookings
  FOR SELECT
  USING (
    tenant_id = REPLACE(current_setting('application_name', true), 'tenant-', '')
  );
```

**Disadvantage**: Mixing monitoring and security concerns

---

## Monitoring Queries with application_name

### Query: Active Tenants

```sql
SELECT
  REPLACE(application_name, 'tenant-', '') as tenant_id,
  COUNT(*) as active_connections,
  state
FROM pg_stat_activity
WHERE application_name LIKE 'tenant-%'
GROUP BY application_name, state;
```

### Query: Slow Queries by Tenant

```sql
SELECT
  REPLACE(application_name, 'tenant-', '') as tenant_id,
  query,
  state_change - query_start as duration
FROM pg_stat_activity
WHERE application_name LIKE 'tenant-%'
  AND state = 'active'
  AND (now() - query_start) > interval '1 second'
ORDER BY duration DESC;
```

### Performance Insights Integration

With `application_name` set to `tenant-123`, Performance Insights will show:
- SQL queries grouped by tenant
- Wait events per tenant
- Database load per tenant

**Use case**: "Which tenant is causing high database load?"

---

## Implementation Comparison

### Current (Custom Session Variables Only)

```typescript
await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
await tx.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
```

**Visibility**:
- ✅ RLS policies work perfectly
- ❌ Not visible in `pg_stat_activity`
- ❌ Not visible in Performance Insights

---

### With application_name (Additional Visibility)

```typescript
await tx.execute(sql`SET LOCAL application_name = ${`tenant-${tenantId}`}`);
await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
await tx.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
```

**Visibility**:
- ✅ RLS policies work perfectly
- ✅ Visible in `pg_stat_activity`
- ✅ Visible in Performance Insights
- ✅ Shows in database logs

**Cost**: One additional `SET LOCAL` per transaction (~0.5ms)

---

## Recommendation

### Use the Hybrid Approach

**Set both `application_name` and custom session variables**:

```typescript
// lib/database/drizzle-rls-client.ts

private async setSessionVariables(tx: any, context: RLSContext): Promise<void> {
  metrics.totalContextSets++;

  // 1. Set application_name for monitoring (ADDED)
  await tx.execute(sql`
    SET LOCAL application_name = ${`tenant-${context.tenantId}`}
  `);

  // 2. Set tenant ID for RLS (existing)
  await tx.execute(sql`
    SET LOCAL app.current_tenant_id = ${this.escapeSQL(context.tenantId)}
  `);

  // 3. Set user ID for RLS (existing)
  if (context.userId) {
    await tx.execute(sql`
      SET LOCAL app.current_user_id = ${this.escapeSQL(context.userId)}
    `);
  }

  // 4. Set custom variables (existing)
  if (context.customVars) {
    for (const [key, value] of Object.entries(context.customVars)) {
      await tx.execute(sql`SET LOCAL ${sql.raw(key)} = ${this.escapeSQL(value)}`);
    }
  }
}
```

### Benefits

1. ✅ **RLS Security**: Custom variables ensure proper isolation
2. ✅ **Monitoring**: `application_name` provides tenant visibility
3. ✅ **Performance Insights**: Track tenant-specific database load
4. ✅ **Debugging**: Identify slow queries by tenant
5. ✅ **Minimal Cost**: ~0.5ms overhead per transaction

### Trade-offs

- Slightly more setup commands per transaction (3-4 vs 2-3)
- Negligible performance impact

---

## Example: Full Implementation

```typescript
// lib/database/drizzle-rls-client.ts

export class DrizzleRLSClient {
  async withRLS<T>(context: RLSContext, callback: (tx: any) => Promise<T>): Promise<T> {
    this.validateContext(context);

    const startTime = Date.now();
    metrics.totalTransactions++;

    try {
      return await this.db.transaction(async (tx) => {
        // Set session context
        await this.setSessionVariables(tx, context);

        // Execute user's queries
        const result = await callback(tx);

        return result;
      });
    } catch (error) {
      metrics.errors++;
      throw error;
    } finally {
      metrics.totalLatencyMs += Date.now() - startTime;
    }
  }

  private async setSessionVariables(tx: any, context: RLSContext): Promise<void> {
    // 1. Set application_name for visibility in monitoring
    await tx.execute(sql`
      SET LOCAL application_name = ${`tenant-${context.tenantId}${context.userId ? `-user-${context.userId}` : ''}`}
    `);

    // 2. Set tenant ID for RLS
    await tx.execute(sql`
      SET LOCAL app.current_tenant_id = ${context.tenantId}
    `);

    // 3. Set user ID for RLS (optional)
    if (context.userId) {
      await tx.execute(sql`
        SET LOCAL app.current_user_id = ${context.userId}
      `);
    }

    if (this.config.debug) {
      console.log(`[RLS] Set context: tenant=${context.tenantId}, user=${context.userId}`);
    }
  }
}
```

---

## Monitoring Queries

### Find Slow Tenants

```sql
SELECT
  SUBSTRING(application_name FROM 'tenant-([^-]+)') as tenant_id,
  COUNT(*) as query_count,
  AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_duration_seconds
FROM pg_stat_activity
WHERE application_name LIKE 'tenant-%'
  AND state = 'active'
GROUP BY tenant_id
ORDER BY avg_duration_seconds DESC;
```

### Find Active Tenants

```sql
SELECT
  SUBSTRING(application_name FROM 'tenant-([^-]+)') as tenant_id,
  COUNT(*) as connections,
  state
FROM pg_stat_activity
WHERE application_name LIKE 'tenant-%'
GROUP BY tenant_id, state;
```

---

## Summary

| Approach | RLS Security | Monitoring Visibility | Performance | Complexity |
|----------|-------------|---------------------|-------------|-----------|
| **Custom vars only** | ✅ Excellent | ❌ No | ✅ Fast | ✅ Simple |
| **application_name only** | ⚠️ Requires parsing | ✅ Excellent | ✅ Fast | ⚠️ Medium |
| **Both (recommended)** | ✅ Excellent | ✅ Excellent | ✅ Fast (~0.5ms) | ⚠️ Medium |

**Recommendation**: Use the **hybrid approach** - it provides the best of both worlds with minimal overhead.

### Action Items

1. ✅ Keep current RLS implementation (custom session variables)
2. ✅ Add `SET LOCAL application_name` for monitoring visibility
3. ✅ Query `pg_stat_activity` to identify tenant-specific issues
4. ✅ Use Performance Insights to track tenant database load
