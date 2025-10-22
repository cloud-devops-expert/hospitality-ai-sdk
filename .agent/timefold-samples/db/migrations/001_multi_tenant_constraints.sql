-- Multi-Tenant Constraint Configuration Schema
-- Purpose: Enable tenant-specific Timefold constraint rules without code changes
-- Date: 2025-10-22

-- ============================================================================
-- UUID Generation (using built-in gen_random_uuid)
-- ============================================================================
-- Note: Using PostgreSQL's built-in gen_random_uuid() for now
-- TODO: Implement proper UUID v7 support in future version

-- ============================================================================
-- System User (for created_by defaults)
-- ============================================================================
-- Note: users table already exists from PayloadCMS with integer IDs
-- Create system user if doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'system@timefold.ai') THEN
    INSERT INTO users (email, name, role)
    VALUES ('system@timefold.ai', 'System User', 'admin');
  END IF;
END $$;

-- Store system user ID for later use
CREATE TEMP TABLE IF NOT EXISTS temp_system_user AS
SELECT id FROM users WHERE email = 'system@timefold.ai';

-- ============================================================================
-- Tenants Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    hotel_type VARCHAR(50) NOT NULL, -- luxury, budget, business, resort
    total_rooms INTEGER NOT NULL DEFAULT 0,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    valid_period TSTZRANGE NOT NULL DEFAULT tstzrange(NOW(), NULL),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_valid_period ON tenants USING GIST(valid_period);

COMMENT ON TABLE tenants IS 'Hotel properties (multi-tenant entities)';
COMMENT ON COLUMN tenants.valid_period IS 'Active period for this tenant record';

-- ============================================================================
-- Constraint Templates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS constraint_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    constraint_type VARCHAR(20) NOT NULL CHECK (constraint_type IN ('HARD', 'SOFT')),
    default_weight INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL, -- vip, accessibility, preference, business
    parameter_schema JSONB, -- JSON Schema for validation
    example_parameters JSONB,
    java_class_name VARCHAR(255), -- e.g., 'VipOceanViewConstraint'
    valid_period TSTZRANGE NOT NULL DEFAULT tstzrange(NOW(), NULL),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_constraint_templates_code ON constraint_templates(code);
CREATE INDEX idx_constraint_templates_type ON constraint_templates(constraint_type);
CREATE INDEX idx_constraint_templates_valid_period ON constraint_templates USING GIST(valid_period);

COMMENT ON TABLE constraint_templates IS 'Reusable constraint definitions available to all tenants';
COMMENT ON COLUMN constraint_templates.default_weight IS 'Default weight/penalty (positive for rewards, negative for penalties)';
COMMENT ON COLUMN constraint_templates.parameter_schema IS 'JSON Schema for validating tenant-specific parameters';

-- ============================================================================
-- Tenant Constraint Configurations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_constraint_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    constraint_template_id UUID NOT NULL REFERENCES constraint_templates(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    weight INTEGER NOT NULL DEFAULT 0,
    parameters JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    valid_period TSTZRANGE NOT NULL DEFAULT tstzrange(NOW(), NULL),
    configured_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, constraint_template_id, valid_period)
);

CREATE INDEX idx_tenant_configs_tenant ON tenant_constraint_configs(tenant_id);
CREATE INDEX idx_tenant_configs_template ON tenant_constraint_configs(constraint_template_id);
CREATE INDEX idx_tenant_configs_enabled ON tenant_constraint_configs(enabled);
CREATE INDEX idx_tenant_configs_valid_period ON tenant_constraint_configs USING GIST(valid_period);

COMMENT ON TABLE tenant_constraint_configs IS 'Tenant-specific constraint configurations (overrides template defaults)';
COMMENT ON COLUMN tenant_constraint_configs.weight IS 'Tenant-specific weight (overrides template default_weight)';
COMMENT ON COLUMN tenant_constraint_configs.parameters IS 'Tenant-specific parameters (validated against template parameter_schema)';

-- ============================================================================
-- Constraint Configuration History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS constraint_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES tenant_constraint_configs(id) ON DELETE CASCADE,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('CREATED', 'UPDATED', 'DISABLED', 'ENABLED')),
    old_values JSONB,
    new_values JSONB NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_history_config ON constraint_config_history(config_id);
CREATE INDEX idx_config_history_changed_by ON constraint_config_history(changed_by);
CREATE INDEX idx_config_history_created_at ON constraint_config_history(created_at DESC);

COMMENT ON TABLE constraint_config_history IS 'Audit trail for constraint configuration changes';

-- ============================================================================
-- Trigger: Update updated_at on tenants
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraint_templates_updated_at
    BEFORE UPDATE ON constraint_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_configs_updated_at
    BEFORE UPDATE ON tenant_constraint_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Trigger: Audit trail on tenant_constraint_configs changes
-- ============================================================================
CREATE OR REPLACE FUNCTION log_constraint_config_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO constraint_config_history (config_id, changed_by, change_type, old_values, new_values)
        VALUES (
            NEW.id,
            NEW.configured_by,
            'CREATED',
            NULL,
            row_to_json(NEW)::JSONB
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO constraint_config_history (config_id, changed_by, change_type, old_values, new_values)
        VALUES (
            NEW.id,
            NEW.configured_by,
            CASE
                WHEN OLD.enabled = false AND NEW.enabled = true THEN 'ENABLED'
                WHEN OLD.enabled = true AND NEW.enabled = false THEN 'DISABLED'
                ELSE 'UPDATED'
            END,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_tenant_config_changes
    AFTER INSERT OR UPDATE ON tenant_constraint_configs
    FOR EACH ROW
    EXECUTE FUNCTION log_constraint_config_change();

-- ============================================================================
-- Initial Data: Constraint Templates
-- ============================================================================

-- HARD CONSTRAINTS (Must never be violated)

INSERT INTO constraint_templates (
    code, name, description, constraint_type, default_weight, category,
    parameter_schema, example_parameters, java_class_name, created_by
) VALUES
(
    'ROOM_TYPE_MATCH',
    'Room Type Match',
    'Guest must be assigned to the requested room type (single, double, suite)',
    'HARD',
    -1,
    'business',
    '{"type": "object", "properties": {}}',
    '{}',
    'RoomTypeMatchConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'NO_DOUBLE_BOOKING',
    'No Double Booking',
    'Prevent assigning same room to multiple guests on overlapping dates',
    'HARD',
    -1,
    'business',
    '{"type": "object", "properties": {}}',
    '{}',
    'NoDoubleBookingConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'ACCESSIBILITY_REQUIRED',
    'Accessibility Required',
    'Guests with accessibility needs must be assigned accessible rooms',
    'HARD',
    -1,
    'accessibility',
    '{"type": "object", "properties": {}}',
    '{}',
    'AccessibilityRequiredConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'SMOKING_POLICY',
    'Smoking Policy',
    'Smokers must be assigned smoking rooms, non-smokers to non-smoking rooms',
    'HARD',
    -1,
    'business',
    '{"type": "object", "properties": {}}',
    '{}',
    'SmokingPolicyConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'PET_POLICY',
    'Pet Policy',
    'Guests with pets must be assigned pet-friendly rooms',
    'HARD',
    -1,
    'business',
    '{"type": "object", "properties": {}}',
    '{}',
    'PetPolicyConstraint',
    (SELECT id FROM temp_system_user)
);

-- SOFT CONSTRAINTS (Preferences to optimize)

INSERT INTO constraint_templates (
    code, name, description, constraint_type, default_weight, category,
    parameter_schema, example_parameters, java_class_name, created_by
) VALUES
(
    'VIP_OCEAN_VIEW',
    'VIP Ocean View Priority',
    'Prioritize assigning ocean view rooms to VIP guests',
    'SOFT',
    100,
    'vip',
    '{
        "type": "object",
        "properties": {
            "minLoyaltyTier": {"type": "integer", "minimum": 1, "maximum": 5, "default": 1},
            "viewTypes": {"type": "array", "items": {"type": "string"}, "default": ["OCEAN", "BEACH"]}
        }
    }',
    '{"minLoyaltyTier": 2, "viewTypes": ["OCEAN", "BEACH"]}',
    'VipOceanViewConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'VIP_HIGH_FLOOR',
    'VIP High Floor Priority',
    'Prioritize assigning high floor rooms to VIP guests',
    'SOFT',
    80,
    'vip',
    '{
        "type": "object",
        "properties": {
            "minFloor": {"type": "integer", "minimum": 1, "default": 5},
            "minLoyaltyTier": {"type": "integer", "minimum": 1, "maximum": 5, "default": 1}
        }
    }',
    '{"minFloor": 8, "minLoyaltyTier": 3}',
    'VipHighFloorConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'VIEW_PREFERENCE',
    'View Preference',
    'Match guest view preferences (ocean, city, garden, courtyard)',
    'SOFT',
    50,
    'preference',
    '{"type": "object", "properties": {}}',
    '{}',
    'ViewPreferenceConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'FLOOR_PREFERENCE',
    'Floor Preference',
    'Match guest floor preferences (high floor, low floor, specific floor)',
    'SOFT',
    40,
    'preference',
    '{
        "type": "object",
        "properties": {
            "highFloorBonus": {"type": "integer", "default": 40},
            "lowFloorBonus": {"type": "integer", "default": 20}
        }
    }',
    '{"highFloorBonus": 40, "lowFloorBonus": 20}',
    'FloorPreferenceConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'QUIET_LOCATION',
    'Quiet Location',
    'Assign rooms away from elevators, ice machines, and high-traffic areas',
    'SOFT',
    60,
    'preference',
    '{
        "type": "object",
        "properties": {
            "minDistanceFromElevator": {"type": "integer", "minimum": 0, "default": 3},
            "avoidEndUnits": {"type": "boolean", "default": false}
        }
    }',
    '{"minDistanceFromElevator": 3, "avoidEndUnits": false}',
    'QuietLocationConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'CONNECTING_ROOMS',
    'Connecting Rooms',
    'Families or groups prefer connecting or adjacent rooms',
    'SOFT',
    70,
    'preference',
    '{
        "type": "object",
        "properties": {
            "maxDistance": {"type": "integer", "minimum": 0, "default": 2},
            "sameFloorRequired": {"type": "boolean", "default": true}
        }
    }',
    '{"maxDistance": 2, "sameFloorRequired": true}',
    'ConnectingRoomsConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'EARLY_CHECKIN',
    'Early Check-in',
    'Guests requesting early check-in should get rooms available earliest',
    'SOFT',
    30,
    'business',
    '{"type": "object", "properties": {}}',
    '{}',
    'EarlyCheckinConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'LATE_CHECKOUT',
    'Late Checkout',
    'Guests requesting late checkout should get rooms needed latest',
    'SOFT',
    30,
    'business',
    '{"type": "object", "properties": {}}',
    '{}',
    'LateCheckoutConstraint',
    (SELECT id FROM temp_system_user)
),
(
    'BUDGET_CONSTRAINT',
    'Budget Constraint',
    'Penalize assigning premium rooms when budget rooms would suffice',
    'SOFT',
    -50,
    'business',
    '{
        "type": "object",
        "properties": {
            "budgetBufferPercent": {"type": "integer", "minimum": 0, "maximum": 50, "default": 10}
        }
    }',
    '{"budgetBufferPercent": 10}',
    'BudgetConstraintConstraint',
    (SELECT id FROM temp_system_user)
);

-- ============================================================================
-- Initial Data: Sample Tenants
-- ============================================================================

INSERT INTO tenants (id, name, slug, hotel_type, total_rooms, timezone, created_by)
VALUES
(
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'Ocean View Luxury Resort',
    'oceanview-resort',
    'luxury',
    150,
    'America/New_York',
    (SELECT id FROM temp_system_user)
),
(
    'a0000000-0000-0000-0000-000000000002'::UUID,
    'Budget Inn Downtown',
    'budget-inn',
    'budget',
    80,
    'America/Chicago',
    (SELECT id FROM temp_system_user)
),
(
    'a0000000-0000-0000-0000-000000000003'::UUID,
    'Business Tower Hotel',
    'business-tower',
    'business',
    200,
    'America/Los_Angeles',
    (SELECT id FROM temp_system_user)
);

-- ============================================================================
-- Initial Data: Luxury Resort Configuration
-- ============================================================================

-- Enable all VIP and preference constraints with high weights
INSERT INTO tenant_constraint_configs (
    tenant_id, constraint_template_id, enabled, weight, parameters, configured_by
)
SELECT
    'a0000000-0000-0000-0000-000000000001'::UUID,
    id,
    CASE code
        WHEN 'BUDGET_CONSTRAINT' THEN false
        ELSE true
    END,
    CASE code
        WHEN 'VIP_OCEAN_VIEW' THEN 150  -- Higher than default
        WHEN 'VIP_HIGH_FLOOR' THEN 120
        WHEN 'QUIET_LOCATION' THEN 80
        WHEN 'VIEW_PREFERENCE' THEN 70
        WHEN 'CONNECTING_ROOMS' THEN 90
        ELSE default_weight
    END,
    CASE code
        WHEN 'VIP_OCEAN_VIEW' THEN '{"minLoyaltyTier": 2, "viewTypes": ["OCEAN", "BEACH"]}'::JSONB
        WHEN 'VIP_HIGH_FLOOR' THEN '{"minFloor": 8, "minLoyaltyTier": 3}'::JSONB
        WHEN 'QUIET_LOCATION' THEN '{"minDistanceFromElevator": 4, "avoidEndUnits": false}'::JSONB
        ELSE example_parameters
    END,
    (SELECT id FROM temp_system_user)
FROM constraint_templates;

-- ============================================================================
-- Initial Data: Budget Inn Configuration
-- ============================================================================

-- Disable VIP preferences, enable budget constraint
INSERT INTO tenant_constraint_configs (
    tenant_id, constraint_template_id, enabled, weight, parameters, configured_by
)
SELECT
    'a0000000-0000-0000-0000-000000000002'::UUID,
    id,
    CASE code
        WHEN 'VIP_OCEAN_VIEW' THEN false
        WHEN 'VIP_HIGH_FLOOR' THEN false
        WHEN 'QUIET_LOCATION' THEN false
        ELSE true
    END,
    CASE code
        WHEN 'BUDGET_CONSTRAINT' THEN -100  -- Strong penalty for premium rooms
        WHEN 'VIEW_PREFERENCE' THEN 20      -- Low priority
        WHEN 'FLOOR_PREFERENCE' THEN 15     -- Low priority
        ELSE default_weight
    END,
    CASE code
        WHEN 'BUDGET_CONSTRAINT' THEN '{"budgetBufferPercent": 5}'::JSONB
        ELSE example_parameters
    END,
    (SELECT id FROM temp_system_user)
FROM constraint_templates;

-- ============================================================================
-- Initial Data: Business Hotel Configuration
-- ============================================================================

-- Balanced configuration with focus on business needs
INSERT INTO tenant_constraint_configs (
    tenant_id, constraint_template_id, enabled, weight, parameters, configured_by
)
SELECT
    'a0000000-0000-0000-0000-000000000003'::UUID,
    id,
    true,
    CASE code
        WHEN 'QUIET_LOCATION' THEN 90       -- Very important for business travelers
        WHEN 'EARLY_CHECKIN' THEN 50        -- Important
        WHEN 'LATE_CHECKOUT' THEN 50        -- Important
        WHEN 'VIP_OCEAN_VIEW' THEN 60       -- Moderate
        WHEN 'CONNECTING_ROOMS' THEN 40     -- Less important
        ELSE default_weight
    END,
    CASE code
        WHEN 'QUIET_LOCATION' THEN '{"minDistanceFromElevator": 5, "avoidEndUnits": true}'::JSONB
        WHEN 'VIP_OCEAN_VIEW' THEN '{"minLoyaltyTier": 3, "viewTypes": ["CITY", "OCEAN"]}'::JSONB
        ELSE example_parameters
    END,
    (SELECT id FROM temp_system_user)
FROM constraint_templates;

-- ============================================================================
-- Summary Query: View all tenant configurations
-- ============================================================================

CREATE OR REPLACE VIEW v_tenant_constraint_summary AS
SELECT
    t.name AS tenant_name,
    t.hotel_type,
    ct.name AS constraint_name,
    ct.constraint_type,
    tcc.enabled,
    tcc.weight,
    ct.default_weight AS template_default,
    tcc.parameters,
    ct.category
FROM tenants t
JOIN tenant_constraint_configs tcc ON t.id = tcc.tenant_id
JOIN constraint_templates ct ON tcc.constraint_template_id = ct.id
WHERE upper(t.valid_period) IS NULL
  AND upper(tcc.valid_period) IS NULL
ORDER BY t.name, ct.constraint_type DESC, tcc.weight DESC;

COMMENT ON VIEW v_tenant_constraint_summary IS 'Summary of all active tenant constraint configurations';

-- ============================================================================
-- Helper Function: Get Active Config for Tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tenant_constraints(p_tenant_id UUID)
RETURNS TABLE (
    constraint_code VARCHAR,
    constraint_name VARCHAR,
    constraint_type VARCHAR,
    enabled BOOLEAN,
    weight INTEGER,
    parameters JSONB,
    java_class_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.code,
        ct.name,
        ct.constraint_type,
        tcc.enabled,
        tcc.weight,
        tcc.parameters,
        ct.java_class_name
    FROM tenant_constraint_configs tcc
    JOIN constraint_templates ct ON tcc.constraint_template_id = ct.id
    WHERE tcc.tenant_id = p_tenant_id
      AND tcc.enabled = true
      AND upper(tcc.valid_period) IS NULL
      AND upper(ct.valid_period) IS NULL
    ORDER BY ct.constraint_type DESC, tcc.weight DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tenant_constraints IS 'Retrieve all active enabled constraints for a specific tenant';
