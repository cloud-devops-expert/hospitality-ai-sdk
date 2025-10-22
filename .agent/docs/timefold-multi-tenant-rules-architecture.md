# Multi-Tenant Dynamic Constraint Architecture

## The Challenge

**Requirements**:
1. ✅ Multi-tenant SaaS platform
2. ✅ Tenant-specific rules (Hotel A has different rules than Hotel B)
3. ✅ Rules configurable via UI (no code changes)
4. ✅ Hot-reloadable (changes apply immediately)
5. ✅ Version control (track rule changes over time)
6. ✅ Rule templates (predefined constraints with configurable parameters)

**Traditional Timefold Problem**:
```java
// ❌ Hard-coded constraints - same for all tenants
.reward(HardSoftScore.ofSoft(100))  // Fixed weight
```

**What We Need**:
```typescript
// ✅ Database-driven constraints - different per tenant
.reward(HardSoftScore.ofSoft(tenantConfig.vipOceanViewWeight))
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Tenant Admin UI (Next.js)                │
│  Hotel Manager configures rules via web interface           │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP POST /api/tenant-rules
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │ Tenant Settings  │  │  Constraint Configurations     │  │
│  │ - tenant_id      │  │  - constraint_type             │  │
│  │ - hotel_name     │  │  - enabled                     │  │
│  │ - rules_version  │  │  - weight                      │  │
│  └──────────────────┘  │  - parameters (JSONB)          │  │
│                        └────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ Load on startup + cache
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Timefold Solver Service (Java)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dynamic Constraint Provider                         │  │
│  │  - Reads tenant config from database                 │  │
│  │  - Builds constraints with tenant-specific weights   │  │
│  │  - Enables/disables constraints per tenant           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ Optimized room allocation
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Best Solution for Tenant                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table 1: `tenants`
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_key VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'hotel-oceanview'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table 2: `constraint_templates`
```sql
CREATE TABLE constraint_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    constraint_type VARCHAR(100) NOT NULL,  -- e.g., 'VIP_OCEAN_VIEW'
    category VARCHAR(50) NOT NULL,  -- 'HARD' or 'SOFT'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_enabled BOOLEAN DEFAULT true,
    default_weight INTEGER,  -- Default soft constraint weight
    configurable_parameters JSONB,  -- Parameters that can be configured
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default templates
INSERT INTO constraint_templates (constraint_type, category, name, description, default_enabled, default_weight, configurable_parameters) VALUES
('ROOM_TYPE_MATCH', 'HARD', 'Room Type Match', 'Guest must receive requested room type', true, NULL, '{}'),
('NO_DOUBLE_BOOKING', 'HARD', 'No Double Booking', 'Prevent overlapping bookings', true, NULL, '{}'),
('ACCESSIBILITY_REQUIRED', 'HARD', 'Accessibility Required', 'ADA compliance - wheelchair access', true, NULL, '{}'),
('SMOKING_POLICY', 'HARD', 'Smoking Policy Match', 'Smokers need smoking rooms', true, NULL, '{}'),
('PET_POLICY', 'HARD', 'Pet Policy Match', 'Pets need pet-friendly rooms', true, NULL, '{}'),

('VIP_OCEAN_VIEW', 'SOFT', 'VIP Ocean View Priority', 'VIP guests get priority for ocean views', true, 100, '{"minLoyaltyTier": 3}'),
('VIEW_PREFERENCE', 'SOFT', 'View Preference Match', 'Match guest preferred view', true, 50, '{}'),
('FLOOR_PREFERENCE', 'SOFT', 'Floor Preference Match', 'Match guest floor preference', true, 30, '{}'),
('BALCONY_PREFERENCE', 'SOFT', 'Balcony Preference', 'Give balconies to guests who want them', true, 40, '{}'),
('KITCHENETTE_PREFERENCE', 'SOFT', 'Kitchenette Preference', 'Extended stay amenity', true, 35, '{}'),
('QUIET_LOCATION', 'SOFT', 'Quiet Location Preference', 'Avoid noisy areas (lobby, elevators)', true, 25, '{"quietFloorMin": 3}'),
('BUDGET_CONSTRAINT', 'SOFT', 'Budget Constraint', 'Avoid exceeding guest budget', true, -60, '{"budgetBufferPercent": 10}'),
('LOYALTY_UPGRADE', 'SOFT', 'Loyalty Tier Upgrade', 'Reward loyal guests with upgrades', true, 80, '{"tierWeights": {"silver": 70, "gold": 80, "platinum": 90}}'),
('MINIMIZE_ROOM_CHANGES', 'SOFT', 'Minimize Room Changes', 'Keep guest in same room for consecutive stays', true, -80, '{}');
```

### Table 3: `tenant_constraint_configs`
```sql
CREATE TABLE tenant_constraint_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    constraint_template_id UUID REFERENCES constraint_templates(id),
    enabled BOOLEAN DEFAULT true,
    weight INTEGER,  -- Tenant-specific weight (overrides default)
    parameters JSONB,  -- Tenant-specific parameter overrides
    notes TEXT,  -- Why this configuration was chosen
    configured_by UUID,  -- User who configured this
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, constraint_template_id)
);

CREATE INDEX idx_tenant_constraints ON tenant_constraint_configs(tenant_id);
```

### Table 4: `constraint_config_history`
```sql
CREATE TABLE constraint_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    constraint_template_id UUID REFERENCES constraint_templates(id),
    change_type VARCHAR(50),  -- 'ENABLED', 'DISABLED', 'WEIGHT_CHANGED', 'PARAMS_CHANGED'
    old_value JSONB,
    new_value JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW()
);
```

---

## Java: Dynamic Constraint Provider

```java
/**
 * Database-driven constraint provider
 * Reads tenant-specific configuration and builds constraints dynamically
 */
public class DynamicHotelConstraintProvider implements ConstraintProvider {

    private final TenantConstraintConfigRepository configRepository;
    private final String tenantId;

    public DynamicHotelConstraintProvider(String tenantId, TenantConstraintConfigRepository repository) {
        this.tenantId = tenantId;
        this.configRepository = repository;
    }

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        // Load tenant-specific configurations from database
        List<TenantConstraintConfig> configs = configRepository.findByTenantId(tenantId);

        // Build constraints based on configuration
        List<Constraint> constraints = new ArrayList<>();

        for (TenantConstraintConfig config : configs) {
            if (!config.isEnabled()) {
                continue;  // Skip disabled constraints
            }

            Constraint constraint = buildConstraint(constraintFactory, config);
            if (constraint != null) {
                constraints.add(constraint);
            }
        }

        return constraints.toArray(new Constraint[0]);
    }

    private Constraint buildConstraint(ConstraintFactory factory, TenantConstraintConfig config) {
        String type = config.getConstraintTemplate().getConstraintType();

        switch (type) {
            case "ROOM_TYPE_MATCH":
                return buildRoomTypeMatchConstraint(factory);

            case "NO_DOUBLE_BOOKING":
                return buildNoDoubleBookingConstraint(factory);

            case "ACCESSIBILITY_REQUIRED":
                return buildAccessibilityConstraint(factory);

            case "SMOKING_POLICY":
                return buildSmokingPolicyConstraint(factory);

            case "PET_POLICY":
                return buildPetPolicyConstraint(factory);

            case "VIP_OCEAN_VIEW":
                return buildVipOceanViewConstraint(factory, config);

            case "VIEW_PREFERENCE":
                return buildViewPreferenceConstraint(factory, config);

            case "FLOOR_PREFERENCE":
                return buildFloorPreferenceConstraint(factory, config);

            case "BALCONY_PREFERENCE":
                return buildBalconyPreferenceConstraint(factory, config);

            case "KITCHENETTE_PREFERENCE":
                return buildKitchenettePreferenceConstraint(factory, config);

            case "QUIET_LOCATION":
                return buildQuietLocationConstraint(factory, config);

            case "BUDGET_CONSTRAINT":
                return buildBudgetConstraint(factory, config);

            case "LOYALTY_UPGRADE":
                return buildLoyaltyUpgradeConstraint(factory, config);

            case "MINIMIZE_ROOM_CHANGES":
                return buildMinimizeRoomChangesConstraint(factory, config);

            default:
                return null;
        }
    }

    // Example: Hard constraint (no weight needed)
    private Constraint buildRoomTypeMatchConstraint(ConstraintFactory factory) {
        return factory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().getType() != booking.getRequestedRoomType())
            .penalize(HardSoftScore.ONE_HARD)
            .asConstraint("Room type must match request");
    }

    // Example: Soft constraint with tenant-specific weight
    private Constraint buildVipOceanViewConstraint(ConstraintFactory factory, TenantConstraintConfig config) {
        int weight = config.getWeight();  // Tenant-specific weight from database

        JsonNode params = config.getParameters();
        int minLoyaltyTier = params.has("minLoyaltyTier")
            ? params.get("minLoyaltyTier").asInt()
            : 3;

        return factory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().isVip() &&
                booking.getGuest().getLoyaltyTier() >= minLoyaltyTier &&
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().getView() == View.OCEAN)
            .reward(HardSoftScore.ofSoft(weight))  // Use tenant-specific weight
            .asConstraint("VIP ocean view priority");
    }

    // Example: Soft constraint with configurable parameters
    private Constraint buildQuietLocationConstraint(ConstraintFactory factory, TenantConstraintConfig config) {
        int weight = config.getWeight();

        JsonNode params = config.getParameters();
        int quietFloorMin = params.has("quietFloorMin")
            ? params.get("quietFloorMin").asInt()
            : 3;

        return factory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().getPreferences().isWantsQuiet() &&
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().getFloor() >= quietFloorMin)
            .reward(HardSoftScore.ofSoft(weight))
            .asConstraint("Quiet location preference");
    }

    // Example: Soft constraint with complex tenant-specific parameters
    private Constraint buildBudgetConstraint(ConstraintFactory factory, TenantConstraintConfig config) {
        int weight = config.getWeight();  // Negative weight (penalty)

        JsonNode params = config.getParameters();
        int budgetBufferPercent = params.has("budgetBufferPercent")
            ? params.get("budgetBufferPercent").asInt()
            : 10;

        return factory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null || booking.getGuest().getBudgetMax() == null) {
                    return false;
                }

                int roomPrice = booking.getAssignedRoom().getBasePrice();
                int maxBudget = booking.getGuest().getBudgetMax();
                int budgetWithBuffer = maxBudget * (100 + budgetBufferPercent) / 100;

                return roomPrice > budgetWithBuffer;  // Over budget even with buffer
            })
            .penalize(HardSoftScore.ofSoft(Math.abs(weight)))  // Penalty
            .asConstraint("Budget exceeded");
    }

    // Example: Loyalty upgrade with tenant-specific tier weights
    private Constraint buildLoyaltyUpgradeConstraint(ConstraintFactory factory, TenantConstraintConfig config) {
        JsonNode params = config.getParameters();
        JsonNode tierWeights = params.get("tierWeights");

        int silverWeight = tierWeights.get("silver").asInt();
        int goldWeight = tierWeights.get("gold").asInt();
        int platinumWeight = tierWeights.get("platinum").asInt();

        return factory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null) {
                    return false;
                }

                int tier = booking.getGuest().getLoyaltyTier();
                RoomType roomType = booking.getAssignedRoom().getType();

                if (tier == 3 && roomType == RoomType.SUITE) return true;
                if (tier == 2 && (roomType == RoomType.DELUXE || roomType == RoomType.SUITE)) return true;
                if (tier == 1 && roomType == RoomType.DELUXE) return true;

                return false;
            })
            .reward(booking -> {
                int tier = booking.getGuest().getLoyaltyTier();

                if (tier == 3) return HardSoftScore.ofSoft(platinumWeight);
                if (tier == 2) return HardSoftScore.ofSoft(goldWeight);
                if (tier == 1) return HardSoftScore.ofSoft(silverWeight);

                return HardSoftScore.ZERO;
            })
            .asConstraint("Loyalty tier upgrade reward");
    }

    // ... other constraint builders omitted for brevity
}
```

---

## REST API for Constraint Management

```java
/**
 * REST API for managing tenant-specific constraints
 */
@Path("/api/tenants/{tenantId}/constraints")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TenantConstraintConfigResource {

    @Inject
    TenantConstraintConfigRepository configRepository;

    @Inject
    ConstraintTemplateRepository templateRepository;

    @Inject
    ConstraintConfigHistoryRepository historyRepository;

    /**
     * Get all constraint configurations for a tenant
     */
    @GET
    public List<TenantConstraintConfigDTO> getTenantConstraints(@PathParam("tenantId") String tenantId) {
        List<TenantConstraintConfig> configs = configRepository.findByTenantId(tenantId);
        return configs.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * Update constraint configuration for a tenant
     */
    @PUT
    @Path("/{constraintId}")
    @Transactional
    public TenantConstraintConfigDTO updateConstraintConfig(
        @PathParam("tenantId") String tenantId,
        @PathParam("constraintId") String constraintId,
        TenantConstraintConfigUpdateDTO updateDTO
    ) {
        TenantConstraintConfig config = configRepository.findById(constraintId);

        // Record history
        ConstraintConfigHistory history = new ConstraintConfigHistory();
        history.setTenantId(tenantId);
        history.setConstraintTemplateId(config.getConstraintTemplate().getId());
        history.setOldValue(toJson(config));

        // Apply updates
        if (updateDTO.getEnabled() != null) {
            config.setEnabled(updateDTO.getEnabled());
            history.setChangeType(updateDTO.getEnabled() ? "ENABLED" : "DISABLED");
        }

        if (updateDTO.getWeight() != null) {
            config.setWeight(updateDTO.getWeight());
            history.setChangeType("WEIGHT_CHANGED");
        }

        if (updateDTO.getParameters() != null) {
            config.setParameters(updateDTO.getParameters());
            history.setChangeType("PARAMS_CHANGED");
        }

        config.setUpdatedAt(LocalDateTime.now());
        configRepository.persist(config);

        history.setNewValue(toJson(config));
        history.setChangedAt(LocalDateTime.now());
        historyRepository.persist(history);

        // Invalidate solver cache for this tenant
        invalidateSolverCache(tenantId);

        return toDTO(config);
    }

    /**
     * Reset constraint to default template values
     */
    @POST
    @Path("/{constraintId}/reset")
    @Transactional
    public TenantConstraintConfigDTO resetToDefaults(
        @PathParam("tenantId") String tenantId,
        @PathParam("constraintId") String constraintId
    ) {
        TenantConstraintConfig config = configRepository.findById(constraintId);
        ConstraintTemplate template = config.getConstraintTemplate();

        config.setEnabled(template.isDefaultEnabled());
        config.setWeight(template.getDefaultWeight());
        config.setParameters(template.getConfigurableParameters());
        config.setUpdatedAt(LocalDateTime.now());

        configRepository.persist(config);
        invalidateSolverCache(tenantId);

        return toDTO(config);
    }

    /**
     * Get constraint change history
     */
    @GET
    @Path("/history")
    public List<ConstraintConfigHistoryDTO> getChangeHistory(@PathParam("tenantId") String tenantId) {
        return historyRepository.findByTenantId(tenantId).stream()
            .map(this::toHistoryDTO)
            .collect(Collectors.toList());
    }

    private void invalidateSolverCache(String tenantId) {
        // Clear cached solver for this tenant
        // Next solve request will rebuild with new config
        SolverCache.invalidate(tenantId);
    }
}
```

---

## PayloadCMS Collection for Constraint Management

```typescript
// src/payload/collections/TenantConstraintConfigs.ts

import { CollectionConfig } from 'payload/types'

export const TenantConstraintConfigs: CollectionConfig = {
  slug: 'tenant-constraint-configs',
  admin: {
    useAsTitle: 'constraintName',
    defaultColumns: ['tenant', 'constraintName', 'enabled', 'weight'],
    group: 'Settings',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        description: 'Hotel/Tenant this constraint applies to',
      },
    },
    {
      name: 'constraintTemplate',
      type: 'relationship',
      relationTo: 'constraint-templates',
      required: true,
      admin: {
        description: 'Base constraint template',
      },
    },
    {
      name: 'constraintName',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description: 'Auto-populated from template',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Hard Constraint', value: 'HARD' },
        { label: 'Soft Constraint', value: 'SOFT' },
      ],
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Enable/disable this constraint for this tenant',
      },
    },
    {
      name: 'weight',
      type: 'number',
      admin: {
        description: 'Constraint weight (higher = more important). Negative values penalize.',
        condition: (data) => data.category === 'SOFT',
      },
    },
    {
      name: 'parameters',
      type: 'json',
      admin: {
        description: 'Tenant-specific parameter overrides (JSON format)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Why was this configuration chosen?',
      },
    },
  ],
}
```

---

## Next.js UI for Constraint Management

```typescript
// app/(admin)/tenants/[tenantId]/constraints/page.tsx

'use client'

import { useState, useEffect } from 'react'

interface Constraint {
  id: string
  constraintName: string
  category: 'HARD' | 'SOFT'
  enabled: boolean
  weight: number
  parameters: any
  description: string
}

export default function TenantConstraintsPage({ params }: { params: { tenantId: string } }) {
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConstraints()
  }, [params.tenantId])

  async function fetchConstraints() {
    const res = await fetch(`/api/tenants/${params.tenantId}/constraints`)
    const data = await res.json()
    setConstraints(data)
    setLoading(false)
  }

  async function updateConstraint(constraintId: string, updates: Partial<Constraint>) {
    await fetch(`/api/tenants/${params.tenantId}/constraints/${constraintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    fetchConstraints()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Room Allocation Rules</h1>

      {/* Hard Constraints */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Hard Constraints (Cannot Violate)</h2>
        <div className="space-y-4">
          {constraints.filter(c => c.category === 'HARD').map(constraint => (
            <div key={constraint.id} className="border p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{constraint.constraintName}</h3>
                  <p className="text-sm text-gray-600">{constraint.description}</p>
                </div>
                <label className="flex items-center space-x-2">
                  <span className="text-sm">Enabled</span>
                  <input
                    type="checkbox"
                    checked={constraint.enabled}
                    onChange={(e) => updateConstraint(constraint.id, { enabled: e.target.checked })}
                    className="form-checkbox"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Soft Constraints */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Soft Constraints (Preferences)</h2>
        <div className="space-y-4">
          {constraints.filter(c => c.category === 'SOFT').map(constraint => (
            <div key={constraint.id} className="border p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium">{constraint.constraintName}</h3>
                  <p className="text-sm text-gray-600">{constraint.description}</p>
                </div>
                <label className="flex items-center space-x-2">
                  <span className="text-sm">Enabled</span>
                  <input
                    type="checkbox"
                    checked={constraint.enabled}
                    onChange={(e) => updateConstraint(constraint.id, { enabled: e.target.checked })}
                    className="form-checkbox"
                  />
                </label>
              </div>

              {constraint.enabled && (
                <div className="mt-4 flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <span className="text-sm">Weight:</span>
                    <input
                      type="number"
                      value={constraint.weight}
                      onChange={(e) => updateConstraint(constraint.id, { weight: parseInt(e.target.value) })}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    {constraint.weight > 0 ? 'Reward' : 'Penalty'} of {Math.abs(constraint.weight)} points
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

---

## Example: Tenant-Specific Configurations

### Tenant A: Luxury Resort
```json
{
  "tenant_id": "resort-oceanview",
  "constraints": [
    {
      "type": "VIP_OCEAN_VIEW",
      "enabled": true,
      "weight": 150,  // Very important (higher than default 100)
      "parameters": {
        "minLoyaltyTier": 2  // Gold and Platinum get ocean view priority
      }
    },
    {
      "type": "BUDGET_CONSTRAINT",
      "enabled": false  // Luxury resort - ignore budget
    },
    {
      "type": "LOYALTY_UPGRADE",
      "enabled": true,
      "weight": 100,
      "parameters": {
        "tierWeights": {
          "silver": 80,
          "gold": 120,
          "platinum": 150  // Extra generous for platinum
        }
      }
    }
  ]
}
```

### Tenant B: Budget Hotel
```json
{
  "tenant_id": "hotel-budget-inn",
  "constraints": [
    {
      "type": "VIP_OCEAN_VIEW",
      "enabled": false  // No VIP program
    },
    {
      "type": "BUDGET_CONSTRAINT",
      "enabled": true,
      "weight": -100,  // Budget very important (higher penalty)
      "parameters": {
        "budgetBufferPercent": 5  // Only 5% buffer
      }
    },
    {
      "type": "LOYALTY_UPGRADE",
      "enabled": false  // No loyalty program
    }
  ]
}
```

### Tenant C: Business Hotel
```json
{
  "tenant_id": "hotel-business-center",
  "constraints": [
    {
      "type": "QUIET_LOCATION",
      "enabled": true,
      "weight": 80,  // Very important for business travelers
      "parameters": {
        "quietFloorMin": 5  // Floors 5+ only for quiet
      }
    },
    {
      "type": "KITCHENETTE_PREFERENCE",
      "enabled": true,
      "weight": 60,  // Important for extended stays
      "parameters": {}
    }
  ]
}
```

---

## Hot-Reloading Strategy

```java
/**
 * Solver cache with hot-reload capability
 */
@ApplicationScoped
public class MultiTenantSolverCache {

    private final Map<String, SolverManager<HotelAllocation, UUID>> solverManagers = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lastConfigUpdate = new ConcurrentHashMap<>();

    @Inject
    TenantConstraintConfigRepository configRepository;

    public SolverManager<HotelAllocation, UUID> getSolverManager(String tenantId) {
        LocalDateTime tenantLastUpdate = configRepository.getLastUpdateTime(tenantId);
        LocalDateTime cacheLastUpdate = lastConfigUpdate.get(tenantId);

        // Rebuild solver if config changed
        if (cacheLastUpdate == null || tenantLastUpdate.isAfter(cacheLastUpdate)) {
            solverManagers.remove(tenantId);  // Invalidate cache
        }

        return solverManagers.computeIfAbsent(tenantId, this::buildSolverManager);
    }

    private SolverManager<HotelAllocation, UUID> buildSolverManager(String tenantId) {
        SolverConfig solverConfig = new SolverConfig()
            .withSolutionClass(HotelAllocation.class)
            .withEntityClasses(GuestBooking.class)
            .withConstraintProviderClass(DynamicHotelConstraintProvider.class)
            .withTerminationSpentLimit(Duration.ofSeconds(30));

        // Pass tenant ID to constraint provider
        DynamicHotelConstraintProvider constraintProvider =
            new DynamicHotelConstraintProvider(tenantId, configRepository);

        solverConfig.setConstraintProvider(constraintProvider);

        SolverManager<HotelAllocation, UUID> manager = SolverManager.create(solverConfig);
        lastConfigUpdate.put(tenantId, LocalDateTime.now());

        return manager;
    }

    public void invalidate(String tenantId) {
        solverManagers.remove(tenantId);
        lastConfigUpdate.remove(tenantId);
    }
}
```

---

## Migration Path

### Phase 1: Setup Database
```sql
-- Run migration scripts
-- Populate constraint templates
-- Create default tenant configs
```

### Phase 2: Update Timefold Service
```java
// Replace static ConstraintProvider with DynamicHotelConstraintProvider
// Add tenant_id to solve requests
// Implement solver caching
```

### Phase 3: Build Admin UI
```typescript
// PayloadCMS collections
// Next.js constraint management pages
// REST API for constraint CRUD
```

### Phase 4: Testing & Rollout
```
// Test with multiple tenants
// Verify hot-reloading works
// Performance testing
// Gradual rollout
```

---

## Benefits

✅ **No Code Changes**: Hotel managers configure rules via UI
✅ **Multi-Tenant**: Each hotel has unique rule sets
✅ **Hot-Reload**: Changes apply immediately without restart
✅ **Version Control**: Track who changed what and when
✅ **Flexibility**: Enable/disable constraints, adjust weights, configure parameters
✅ **Scalability**: Add new constraint templates without touching tenant configs
✅ **Audit Trail**: Full history of rule changes

---

## Files Referenced

- Java code: `.agent/timefold-samples/hotel-room-allocation-example.java`
- Constraint guide: `.agent/docs/hotel-constraints-guide.md`
- This architecture: `.agent/docs/timefold-multi-tenant-rules-architecture.md`

