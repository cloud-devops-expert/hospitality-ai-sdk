# Phase 2: Timefold Java Microservice Implementation

**Status**: 🟡 Ready to Start
**Prerequisites**: ✅ Phase 1 Complete (Database & PayloadCMS)
**Estimated Time**: 3-5 days

## Overview

Build a Quarkus-based Java microservice that reads tenant-specific constraints from PostgreSQL and performs hotel room allocation using Timefold Solver.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js (TypeScript) - Port 3001              │
│  - PayloadCMS Admin UI                         │
│  - Tenant constraint management                │
└─────────────┬───────────────────────────────────┘
              │ HTTP POST /api/allocate
              ▼
┌─────────────────────────────────────────────────┐
│  Timefold Microservice (Java/Quarkus) - 8081   │
│  - DynamicHotelConstraintProvider               │
│  - MultiTenantSolverCache                       │
│  - REST API for solving                         │
└─────────────┬───────────────────────────────────┘
              │ Read constraints
              ▼
┌─────────────────────────────────────────────────┐
│  PostgreSQL - Port 5432                         │
│  - tenants, constraint_templates                │
│  - tenant_constraint_configs                    │
└─────────────────────────────────────────────────┘
```

## Tasks Breakdown

### 1. Project Setup (2-3 hours)

**1.1 Create Quarkus Project**
```bash
cd .agent/timefold-samples/
mvn io.quarkus.platform:quarkus-maven-plugin:3.28.3:create \
    -DprojectGroupId=ai.hospitality \
    -DprojectArtifactId=timefold-hotel-allocation \
    -DprojectVersion=1.0.0-SNAPSHOT \
    -Dextensions="resteasy-reactive-jackson,hibernate-orm-panache,jdbc-postgresql,timefold-solver-quarkus"
```

**1.2 Configure application.properties**
```properties
# Database
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=postgres
quarkus.datasource.password=
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/hospitality_ai_cms

# Hibernate
quarkus.hibernate-orm.database.generation=none
quarkus.hibernate-orm.log.sql=true

# HTTP
quarkus.http.port=8081
quarkus.http.cors=true

# Timefold
quarkus.timefold.solver.termination.spent-limit=30s
```

**Deliverable**: Running Quarkus app on http://localhost:8081

---

### 2. Domain Model (3-4 hours)

**2.1 Create Entity Classes**

File: `src/main/java/ai/hospitality/domain/GuestBooking.java`
```java
@PlanningEntity
public class GuestBooking {
    private UUID id;
    private Guest guest;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private RoomType requestedRoomType;

    @PlanningVariable(valueRangeProviderRefs = "roomRange")
    private Room assignedRoom;  // Timefold assigns this

    // Getters/setters
}
```

File: `src/main/java/ai/hospitality/domain/Room.java`
```java
public class Room {
    private UUID id;
    private String number;
    private RoomType type;
    private int floor;
    private View view;
    private boolean accessible;
    private boolean smokingAllowed;
    private boolean petFriendly;
    private int distanceFromElevator;
}
```

File: `src/main/java/ai/hospitality/domain/HotelAllocation.java`
```java
@PlanningSolution
public class HotelAllocation {
    @ValueRangeProvider(id = "roomRange")
    private List<Room> rooms;

    @PlanningEntityCollectionProperty
    private List<GuestBooking> bookings;

    @PlanningScore
    private HardSoftScore score;
}
```

**Deliverable**: Domain model classes with Timefold annotations

---

### 3. Database Integration (4-5 hours)

**3.1 Create Panache Entities**

File: `src/main/java/ai/hospitality/entity/TenantEntity.java`
```java
@Entity
@Table(name = "tenants")
public class TenantEntity extends PanacheEntityBase {
    @Id
    public UUID id;
    public String name;
    public String slug;

    @Column(name = "hotel_type")
    public String hotelType;

    @Column(name = "total_rooms")
    public Integer totalRooms;
}
```

File: `src/main/java/ai/hospitality/entity/ConstraintTemplateEntity.java`
```java
@Entity
@Table(name = "constraint_templates")
public class ConstraintTemplateEntity extends PanacheEntityBase {
    @Id
    public UUID id;
    public String code;
    public String name;

    @Column(name = "constraint_type")
    public String constraintType;

    @Column(name = "default_weight")
    public Integer defaultWeight;

    @Column(name = "parameter_schema", columnDefinition = "jsonb")
    public String parameterSchema;
}
```

File: `src/main/java/ai/hospitality/entity/TenantConstraintConfigEntity.java`
```java
@Entity
@Table(name = "tenant_constraint_configs")
public class TenantConstraintConfigEntity extends PanacheEntityBase {
    @Id
    public UUID id;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    public TenantEntity tenant;

    @ManyToOne
    @JoinColumn(name = "constraint_template_id")
    public ConstraintTemplateEntity template;

    public Boolean enabled;
    public Integer weight;

    @Column(columnDefinition = "jsonb")
    public String parameters;
}
```

**3.2 Create Repository**

File: `src/main/java/ai/hospitality/repository/ConstraintConfigRepository.java`
```java
@ApplicationScoped
public class ConstraintConfigRepository {

    public List<TenantConstraintConfigEntity> findActiveByTenantId(UUID tenantId) {
        return TenantConstraintConfigEntity.find(
            "tenant.id = ?1 AND enabled = true AND upper(validPeriod) IS NULL",
            tenantId
        ).list();
    }

    public LocalDateTime getLastUpdateTime(UUID tenantId) {
        return TenantConstraintConfigEntity.find(
            "tenant.id = ?1 ORDER BY updatedAt DESC",
            tenantId
        ).firstResult()
         .map(c -> c.updatedAt)
         .orElse(LocalDateTime.MIN);
    }
}
```

**Deliverable**: Database entities and repository

---

### 4. Dynamic Constraint Provider (6-8 hours)

**4.1 Create Constraint Builder**

File: `src/main/java/ai/hospitality/solver/DynamicHotelConstraintProvider.java`
```java
@ApplicationScoped
public class DynamicHotelConstraintProvider implements ConstraintProvider {

    @Inject
    ConstraintConfigRepository configRepository;

    private UUID tenantId;

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        List<TenantConstraintConfigEntity> configs =
            configRepository.findActiveByTenantId(tenantId);

        List<Constraint> constraints = new ArrayList<>();

        for (TenantConstraintConfigEntity config : configs) {
            Constraint constraint = buildConstraint(factory, config);
            if (constraint != null) {
                constraints.add(constraint);
            }
        }

        return constraints.toArray(new Constraint[0]);
    }

    private Constraint buildConstraint(
        ConstraintFactory factory,
        TenantConstraintConfigEntity config
    ) {
        String code = config.template.code;

        return switch (code) {
            case "ROOM_TYPE_MATCH" -> buildRoomTypeMatch(factory, config);
            case "NO_DOUBLE_BOOKING" -> buildNoDoubleBooking(factory, config);
            case "VIP_OCEAN_VIEW" -> buildVipOceanView(factory, config);
            // ... other constraints
            default -> null;
        };
    }

    private Constraint buildVipOceanView(
        ConstraintFactory factory,
        TenantConstraintConfigEntity config
    ) {
        int weight = config.weight;
        JsonNode params = parseJson(config.parameters);
        int minLoyaltyTier = params.get("minLoyaltyTier").asInt();

        return factory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().isVip() &&
                booking.getGuest().getLoyaltyTier() >= minLoyaltyTier &&
                booking.getAssignedRoom().getView() == View.OCEAN)
            .reward(HardSoftScore.ofSoft(weight))
            .asConstraint("VIP ocean view priority");
    }

    // Implement all 14 constraint builders...
}
```

**Deliverable**: Dynamic constraint provider with all 14 constraints

---

### 5. Multi-Tenant Solver Cache (4-5 hours)

**5.1 Implement Cache**

File: `src/main/java/ai/hospitality/solver/MultiTenantSolverCache.java`
```java
@ApplicationScoped
public class MultiTenantSolverCache {

    @Inject
    ConstraintConfigRepository configRepository;

    private final Map<UUID, SolverManager<HotelAllocation, UUID>> solvers =
        new ConcurrentHashMap<>();

    private final Map<UUID, LocalDateTime> lastConfigUpdate =
        new ConcurrentHashMap<>();

    public SolverManager<HotelAllocation, UUID> getSolverManager(UUID tenantId) {
        LocalDateTime tenantLastUpdate =
            configRepository.getLastUpdateTime(tenantId);
        LocalDateTime cacheLastUpdate = lastConfigUpdate.get(tenantId);

        // Rebuild solver if config changed
        if (cacheLastUpdate == null ||
            tenantLastUpdate.isAfter(cacheLastUpdate)) {

            Log.info("Rebuilding solver for tenant: " + tenantId);
            solvers.remove(tenantId);
            lastConfigUpdate.put(tenantId, tenantLastUpdate);
        }

        return solvers.computeIfAbsent(tenantId, this::buildSolverManager);
    }

    private SolverManager<HotelAllocation, UUID> buildSolverManager(UUID tenantId) {
        // Create tenant-specific constraint provider
        DynamicHotelConstraintProvider provider =
            new DynamicHotelConstraintProvider();
        provider.setTenantId(tenantId);

        SolverConfig solverConfig = new SolverConfig()
            .withSolutionClass(HotelAllocation.class)
            .withEntityClasses(GuestBooking.class)
            .withConstraintProviderClass(provider.getClass())
            .withTerminationSpentLimit(Duration.ofSeconds(30));

        return SolverManager.create(solverConfig);
    }

    public void invalidateCache(UUID tenantId) {
        solvers.remove(tenantId);
        lastConfigUpdate.remove(tenantId);
    }
}
```

**Deliverable**: Hot-reloadable solver cache

---

### 6. REST API (3-4 hours)

**6.1 Create API Endpoints**

File: `src/main/java/ai/hospitality/rest/AllocationResource.java`
```java
@Path("/api/allocation")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AllocationResource {

    @Inject
    MultiTenantSolverCache solverCache;

    @POST
    @Path("/solve")
    public Uni<AllocationSolution> solve(AllocationRequest request) {
        UUID tenantId = request.getTenantId();

        SolverManager<HotelAllocation, UUID> solverManager =
            solverCache.getSolverManager(tenantId);

        HotelAllocation problem = buildProblem(request);
        UUID problemId = UUID.randomUUID();

        return Uni.createFrom().completionStage(
            solverManager.solve(problemId, problem)
        ).map(solution -> {
            return new AllocationSolution(
                solution.getBookings(),
                solution.getScore()
            );
        });
    }

    @POST
    @Path("/invalidate-cache/{tenantId}")
    public Response invalidateCache(@PathParam("tenantId") UUID tenantId) {
        solverCache.invalidateCache(tenantId);
        return Response.ok().build();
    }
}
```

**6.2 Create DTOs**

```java
public record AllocationRequest(
    UUID tenantId,
    List<GuestBookingDTO> bookings,
    List<RoomDTO> rooms
) {}

public record AllocationSolution(
    List<GuestBookingDTO> assignments,
    HardSoftScore score
) {}
```

**Deliverable**: REST API endpoints

---

### 7. Testing (4-6 hours)

**7.1 Integration Tests**

File: `src/test/java/ai/hospitality/AllocationResourceTest.java`
```java
@QuarkusTest
public class AllocationResourceTest {

    @Test
    public void testLuxuryResortAllocation() {
        AllocationRequest request = createLuxuryRequest();

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/allocation/solve")
        .then()
            .statusCode(200)
            .body("score.hardScore", equalTo(0))
            .body("score.softScore", greaterThan(0));
    }

    @Test
    public void testBudgetInnAllocation() {
        // VIP constraints should be ignored
        AllocationRequest request = createBudgetRequest();
        // ... test budget-specific behavior
    }
}
```

**Deliverable**: Integration tests for all 3 tenant types

---

### 8. Docker Deployment (2-3 hours)

**8.1 Create Dockerfile**

File: `Dockerfile`
```dockerfile
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:latest
COPY --from=build /app/target/quarkus-app/ /deployments/
EXPOSE 8081
CMD ["java", "-jar", "/deployments/quarkus-run.jar"]
```

**8.2 Create docker-compose.yml**

```yaml
version: '3.8'
services:
  timefold-service:
    build: .
    ports:
      - "8081:8081"
    environment:
      QUARKUS_DATASOURCE_JDBC_URL: jdbc:postgresql://postgres:5432/hospitality_ai_cms
    depends_on:
      - postgres

  postgres:
    image: postgres:18
    environment:
      POSTGRES_DB: hospitality_ai_cms
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

**Deliverable**: Dockerized Timefold microservice

---

## Success Criteria

✅ Quarkus app runs on port 8081
✅ Reads constraints from PostgreSQL
✅ Supports all 14 constraint types
✅ Hot-reloads when constraints change
✅ REST API accepts allocation requests
✅ Returns optimized room assignments
✅ Different results for luxury vs budget tenants
✅ Tests pass for all tenant types
✅ Docker image builds successfully

## Next Phase

**Phase 3**: Next.js Integration & UI
- Create TypeScript client for Timefold API
- Build admin dashboard for monitoring
- Add real-time solver status
- Create constraint impact visualizations

## Estimated Timeline

| Task | Time | Dependencies |
|------|------|-------------|
| Project Setup | 2-3h | None |
| Domain Model | 3-4h | Setup |
| Database Integration | 4-5h | Domain Model |
| Constraint Provider | 6-8h | Database |
| Solver Cache | 4-5h | Constraint Provider |
| REST API | 3-4h | Solver Cache |
| Testing | 4-6h | REST API |
| Docker | 2-3h | Testing |
| **TOTAL** | **28-38h** | **3-5 days** |

---

**Status**: Ready to begin Phase 2
**Blocked By**: None
**Next Action**: Create Quarkus project structure
