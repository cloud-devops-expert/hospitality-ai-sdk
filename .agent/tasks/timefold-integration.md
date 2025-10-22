# Timefold Integration Task Plan

**Status**: Planning
**Priority**: Medium
**Created**: 2025-10-22
**Related Docs**: `.agent/docs/constraint-solving-research.md`

---

## Overview

Implement a hybrid room allocation system using traditional JavaScript algorithms (Phase 1) with optional Timefold constraint solver escalation (Phase 2).

**Goal**: Achieve 85%+ satisfaction with zero cost (traditional), escalating to Timefold for 95%+ satisfaction in complex scenarios.

---

## Phase 1: Traditional JavaScript Implementation (MVP)

### Tasks

- [ ] **Create traditional allocation algorithm**
  - File: `lib/allocation/traditional.ts`
  - Implement rule-based constraint satisfaction
  - Weighted preference scoring (floor, view, accessibility)
  - Performance target: <20ms for 100 rooms
  - Satisfaction target: 85%+

- [ ] **Define TypeScript interfaces**
  - File: `lib/allocation/types.ts`
  - GuestStay, Room, AllocationResult, Preferences
  - Hard vs. soft constraints

- [ ] **Create demo page**
  - File: `app/allocation-demo/page.tsx`
  - Interactive room allocation UI
  - Visual constraint feedback
  - Performance metrics display

- [ ] **Write tests**
  - File: `lib/allocation/__tests__/traditional.test.ts`
  - Test hard constraints (no double booking, capacity)
  - Test soft constraints (preferences)
  - Edge cases (no available rooms, conflicts)

- [ ] **Document in experiments**
  - File: `.agent/experiments/allocation-traditional.md`
  - Performance benchmarks
  - Cost analysis ($0)
  - Satisfaction rate measurements
  - Comparison to manual allocation

- [ ] **Update use cases documentation**
  - Add room allocation to `.agent/docs/use-cases.md`
  - Include examples and screenshots

---

## Phase 2: Timefold Microservice Integration

### Prerequisites

- [ ] Install Java 17+ locally
- [ ] Install Maven 3.9+
- [ ] Clone Timefold quickstarts: `git clone https://github.com/TimefoldAI/timefold-quickstarts.git`
- [ ] Run Meeting Scheduling example to understand Timefold

### Tasks

- [ ] **Study Timefold examples**
  - Run Meeting Scheduling quickstart
  - Run Bed Allocation quickstart
  - Understand domain modeling (@PlanningEntity, @PlanningSolution)
  - Study Constraint Streams API

- [ ] **Design hotel allocation domain model**
  - Define GuestStay entity (Java)
  - Define Room entity (Java)
  - Define HotelAllocation solution (Java)
  - Map preferences to constraints

- [ ] **Implement Timefold solver**
  - File: `timefold-service/src/main/java/ai/hospitality/allocation/`
  - GuestStay.java (planning entity)
  - Room.java (problem fact)
  - HotelAllocation.java (planning solution)
  - HotelConstraintProvider.java (constraints)
  - Application properties (Quarkus config)

- [ ] **Define constraints**
  - Hard: Room conflict (no double booking)
  - Hard: Room capacity match
  - Hard: Accessibility requirements
  - Soft: Floor preference (weighted)
  - Soft: View preference (weighted)
  - Soft: Room type preference
  - Soft: Consecutive nights same room

- [ ] **Create REST API**
  - POST /api/allocate (solve allocation)
  - GET /api/status/{problemId} (solver status)
  - POST /api/stop/{problemId} (cancel solving)

- [ ] **Test locally**
  - Run with `mvn quarkus:dev`
  - Test API with curl/Postman
  - Validate constraint satisfaction

- [ ] **Compile to GraalVM native image**
  - Configure native build profile
  - Test native compilation: `mvn package -Pnative`
  - Benchmark startup time (target: <100ms)
  - Benchmark solve performance

- [ ] **Dockerize Timefold service**
  - Create Dockerfile.native
  - Build Docker image
  - Test container locally
  - Optimize image size

---

## Phase 3: Hybrid Integration

### Tasks

- [ ] **Create Timefold client**
  - File: `lib/allocation/timefold-client.ts`
  - TypeScript client for REST API
  - Type-safe request/response
  - Error handling

- [ ] **Implement hybrid logic**
  - File: `lib/allocation/hybrid.ts`
  - Decision tree: traditional → Timefold
  - Thresholds: complexity, constraint count
  - Feature flag: `ENABLE_TIMEFOLD_ALLOCATION`
  - Cost tracking

- [ ] **Add configuration**
  - Environment variable: `TIMEFOLD_SERVICE_URL`
  - Environment variable: `ENABLE_TIMEFOLD_ALLOCATION` (default: false)
  - Document in `.env.example`

- [ ] **Create deployment configs**
  - Docker Compose file (Next.js + Timefold)
  - Kubernetes manifests (optional)
  - Cloud Run deployment script (optional)

- [ ] **Test hybrid system**
  - Verify traditional path (Timefold disabled)
  - Verify escalation path (Timefold enabled)
  - Measure blended cost and satisfaction

- [ ] **Add monitoring**
  - Track allocation method used (traditional vs. Timefold)
  - Track satisfaction rates
  - Track solve times
  - Cost tracking (Timefold API calls)

---

## Phase 4: Documentation & Polish

### Tasks

- [ ] **Write integration guide**
  - File: `.agent/docs/timefold-integration-guide.md`
  - How to deploy Timefold service
  - How to enable/disable in Next.js
  - Environment variables
  - Cost implications

- [ ] **Create architecture diagram**
  - Hybrid decision flow
  - System architecture (Next.js ↔ Timefold)
  - Deployment options

- [ ] **Update README**
  - Add allocation feature description
  - Link to Timefold documentation
  - Note optional deployment

- [ ] **Create demo video/screenshots**
  - Screen recording of allocation demo
  - Traditional vs. Timefold comparison
  - Add to documentation

- [ ] **Write blog post** (optional)
  - "Building Cost-Effective Room Allocation with Timefold"
  - Hybrid approach explanation
  - Performance benchmarks
  - Share on Timefold community

---

## Success Criteria

### Phase 1

✅ Traditional algorithm achieves 85%+ satisfaction
✅ Performance <20ms for typical scenarios
✅ Demo page functional
✅ Zero infrastructure cost

### Phase 2

✅ Timefold microservice solves allocations correctly
✅ All constraints satisfied (hard) or optimized (soft)
✅ GraalVM native image builds successfully
✅ Docker container runs and is <100MB

### Phase 3

✅ Hybrid logic works seamlessly
✅ Traditional handles 80%+ of cases
✅ Timefold escalation improves satisfaction to 95%+
✅ Cost tracking implemented

### Phase 4

✅ Documentation complete
✅ Deployment guide clear
✅ Community feedback positive

---

## Resources

### Learning

- Timefold Docs: https://docs.timefold.ai/
- Quickstarts: https://github.com/TimefoldAI/timefold-quickstarts
- Research: `.agent/docs/constraint-solving-research.md`

### Examples

- Meeting Scheduling: `timefold-quickstarts/technology/java-quarkus/meeting-scheduling/`
- Bed Allocation: `timefold-quickstarts/use-cases/bed-allocation/`
- Employee Scheduling: `timefold-quickstarts/use-cases/employee-scheduling/`

### Community

- GitHub Discussions: https://github.com/TimefoldAI/timefold-solver/discussions
- Stack Overflow: Tag `timefold`

---

## Timeline Estimate

- **Phase 1**: 1 week (traditional implementation)
- **Phase 2**: 2 weeks (Timefold learning + implementation)
- **Phase 3**: 1 week (hybrid integration)
- **Phase 4**: 3 days (documentation)

**Total**: ~4-5 weeks for complete implementation

---

## Notes

- Start with Phase 1 to ship value immediately (zero cost, pragmatic)
- Phase 2 can be developed in parallel by someone learning Timefold
- Phase 3 ties it together
- Keep Timefold optional (feature flag) to maintain cost-effectiveness philosophy
- Consider Timefold Enterprise if multi-threaded solving becomes necessary (not for MVP)

---

## Next Immediate Steps

1. Read full research document: `.agent/docs/constraint-solving-research.md`
2. Clone Timefold quickstarts: `git clone https://github.com/TimefoldAI/timefold-quickstarts.git`
3. Run Meeting Scheduling example: `cd technology/java-quarkus/meeting-scheduling && mvn quarkus:dev`
4. Sketch out traditional algorithm logic (pseudocode)
5. Create `lib/allocation/` directory structure
6. Begin Phase 1 implementation
