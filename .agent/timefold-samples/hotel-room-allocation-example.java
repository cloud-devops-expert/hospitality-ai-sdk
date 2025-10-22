/**
 * Hotel Room Allocation - Timefold Solver Example
 *
 * This example shows how to create hard and soft constraints for a hotel
 * with 20 rooms, VIP guests, preferences, and amenities.
 *
 * Based on Timefold Solver 1.27.0
 */

package org.acme.hotelallocation;

import java.time.LocalDate;
import java.util.List;
import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;

// ============================================================================
// DOMAIN MODEL
// ============================================================================

/**
 * Represents a hotel room with amenities and characteristics
 */
class Room {
    private String id;
    private String roomNumber;
    private RoomType type;  // STANDARD, DELUXE, SUITE
    private int floor;
    private View view;  // OCEAN, CITY, GARDEN, COURTYARD
    private boolean accessible;  // Wheelchair accessible
    private boolean smokingAllowed;
    private boolean hasBalcony;
    private boolean hasKitchenette;
    private boolean petFriendly;
    private int basePrice;

    // Constructors, getters, setters omitted for brevity
}

enum RoomType {
    STANDARD,  // Basic room
    DELUXE,    // Upgraded room with better amenities
    SUITE      // Large room with separate living area
}

enum View {
    OCEAN,      // Premium ocean view
    CITY,       // City skyline
    GARDEN,     // Garden/pool view
    COURTYARD   // Interior courtyard
}

/**
 * Represents a guest booking/reservation
 * This is the Planning Entity - Timefold will assign a room to each booking
 */
@PlanningEntity
class GuestBooking {
    private String id;
    private Guest guest;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private RoomType requestedRoomType;

    @PlanningVariable(valueRangeProviderRefs = "roomRange")
    private Room assignedRoom;  // Timefold will set this

    // Getters and setters
    public Room getAssignedRoom() {
        return assignedRoom;
    }

    public void setAssignedRoom(Room assignedRoom) {
        this.assignedRoom = assignedRoom;
    }

    public Guest getGuest() {
        return guest;
    }

    public LocalDate getCheckIn() {
        return checkIn;
    }

    public LocalDate getCheckOut() {
        return checkOut;
    }

    public RoomType getRequestedRoomType() {
        return requestedRoomType;
    }
}

/**
 * Represents a guest with preferences and VIP status
 */
class Guest {
    private String id;
    private String name;
    private boolean vipStatus;  // VIP gets priority
    private int loyaltyTier;    // 0=none, 1=silver, 2=gold, 3=platinum
    private GuestPreferences preferences;
    private Integer budgetMax;  // Maximum willing to pay per night

    // Getters
    public boolean isVip() {
        return vipStatus;
    }

    public int getLoyaltyTier() {
        return loyaltyTier;
    }

    public GuestPreferences getPreferences() {
        return preferences;
    }

    public Integer getBudgetMax() {
        return budgetMax;
    }
}

/**
 * Guest preferences for room allocation
 */
class GuestPreferences {
    private FloorPreference floor;  // LOW, MEDIUM, HIGH
    private View preferredView;
    private boolean needsAccessible;  // Accessibility requirement
    private boolean prefersSmoking;
    private boolean wantsBalcony;
    private boolean wantsKitchenette;
    private boolean wantsQuiet;  // Prefer away from elevators/lobby
    private boolean hasPet;

    // Getters
    public FloorPreference getFloor() {
        return floor;
    }

    public View getPreferredView() {
        return preferredView;
    }

    public boolean isNeedsAccessible() {
        return needsAccessible;
    }

    public boolean isPrefersSmoking() {
        return prefersSmoking;
    }

    public boolean isWantsBalcony() {
        return wantsBalcony;
    }

    public boolean isWantsKitchenette() {
        return wantsKitchenette;
    }

    public boolean isWantsQuiet() {
        return wantsQuiet;
    }

    public boolean isHasPet() {
        return hasPet;
    }
}

enum FloorPreference {
    LOW,     // Floors 1-3
    MEDIUM,  // Floors 4-8
    HIGH     // Floors 9+
}

/**
 * The complete solution with all bookings and rooms
 * This is what Timefold optimizes
 */
@PlanningSolution
class HotelAllocation {

    @ValueRangeProvider(id = "roomRange")
    private List<Room> rooms;  // All 20 rooms

    private List<GuestBooking> bookings;  // All guest bookings

    @PlanningScore
    private HardSoftScore score;  // Timefold calculates this

    // Constructors, getters, setters
    public List<Room> getRooms() {
        return rooms;
    }

    public List<GuestBooking> getBookings() {
        return bookings;
    }

    public HardSoftScore getScore() {
        return score;
    }

    public void setScore(HardSoftScore score) {
        this.score = score;
    }
}

// ============================================================================
// CONSTRAINTS
// ============================================================================

/**
 * Defines all hard and soft constraints for hotel room allocation
 */
class HotelAllocationConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[] {
            // HARD CONSTRAINTS (must not be violated)
            roomTypeMatch(constraintFactory),
            noDoubleBooking(constraintFactory),
            accessibilityRequired(constraintFactory),
            smokingPolicyMatch(constraintFactory),
            petPolicyMatch(constraintFactory),

            // SOFT CONSTRAINTS (preferences to optimize)
            vipOceanViewPriority(constraintFactory),
            viewPreference(constraintFactory),
            floorPreference(constraintFactory),
            balconyPreference(constraintFactory),
            kitchenettePreference(constraintFactory),
            quietLocationPreference(constraintFactory),
            budgetConstraint(constraintFactory),
            loyaltyTierUpgrade(constraintFactory),
            minimizeRoomChanges(constraintFactory)
        };
    }

    // ========================================================================
    // HARD CONSTRAINTS
    // ========================================================================

    /**
     * HARD: Guest must get the room type they requested
     * Weight: Cannot be violated
     */
    Constraint roomTypeMatch(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().getType() != booking.getRequestedRoomType())
            .penalize(HardSoftScore.ONE_HARD)
            .asConstraint("Room type must match request");
    }

    /**
     * HARD: No two bookings can share the same room on overlapping dates
     * Weight: Cannot be violated
     */
    Constraint noDoubleBooking(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEachUniquePair(GuestBooking.class,
                // Only check bookings assigned to the same room
                Joiners.equal(GuestBooking::getAssignedRoom))
            .filter((booking1, booking2) -> {
                // Check if date ranges overlap
                if (booking1.getAssignedRoom() == null) {
                    return false;
                }
                return datesOverlap(
                    booking1.getCheckIn(), booking1.getCheckOut(),
                    booking2.getCheckIn(), booking2.getCheckOut()
                );
            })
            .penalize(HardSoftScore.ONE_HARD)
            .asConstraint("No double booking");
    }

    /**
     * HARD: Guests requiring accessible rooms MUST get accessible rooms
     * Weight: Cannot be violated (ADA compliance)
     */
    Constraint accessibilityRequired(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().getPreferences().isNeedsAccessible() &&
                booking.getAssignedRoom() != null &&
                !booking.getAssignedRoom().isAccessible())
            .penalize(HardSoftScore.ONE_HARD)
            .asConstraint("Accessibility requirement must be met");
    }

    /**
     * HARD: Smoking preference must match room policy
     * Weight: Cannot be violated (hotel policy/law)
     */
    Constraint smokingPolicyMatch(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null) {
                    return false;
                }
                boolean guestSmokes = booking.getGuest().getPreferences().isPrefersSmoking();
                boolean roomAllowsSmoking = booking.getAssignedRoom().isSmokingAllowed();

                // Violation if guest smokes but room doesn't allow it
                // (Guest who doesn't smoke CAN be in smoking room, just not preferred)
                return guestSmokes && !roomAllowsSmoking;
            })
            .penalize(HardSoftScore.ONE_HARD)
            .asConstraint("Smoking policy must be satisfied");
    }

    /**
     * HARD: Guests with pets must get pet-friendly rooms
     * Weight: Cannot be violated (hotel policy)
     */
    Constraint petPolicyMatch(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().getPreferences().isHasPet() &&
                booking.getAssignedRoom() != null &&
                !booking.getAssignedRoom().isPetFriendly())
            .penalize(HardSoftScore.ONE_HARD)
            .asConstraint("Pet policy must be satisfied");
    }

    // ========================================================================
    // SOFT CONSTRAINTS (Preferences)
    // ========================================================================

    /**
     * SOFT: VIP guests get priority for ocean view rooms
     * Weight: 100 points (very important)
     */
    Constraint vipOceanViewPriority(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().isVip() &&
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().getView() == View.OCEAN)
            .reward(HardSoftScore.ofSoft(100))
            .asConstraint("VIP ocean view priority");
    }

    /**
     * SOFT: Match guest's preferred view
     * Weight: 50 points (important)
     */
    Constraint viewPreference(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null ||
                    booking.getGuest().getPreferences().getPreferredView() == null) {
                    return false;
                }
                return booking.getAssignedRoom().getView() ==
                       booking.getGuest().getPreferences().getPreferredView();
            })
            .reward(HardSoftScore.ofSoft(50))
            .asConstraint("View preference matched");
    }

    /**
     * SOFT: Match guest's floor preference
     * Weight: 30 points (nice to have)
     */
    Constraint floorPreference(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null ||
                    booking.getGuest().getPreferences().getFloor() == null) {
                    return false;
                }

                int floor = booking.getAssignedRoom().getFloor();
                FloorPreference pref = booking.getGuest().getPreferences().getFloor();

                return matchesFloorPreference(floor, pref);
            })
            .reward(HardSoftScore.ofSoft(30))
            .asConstraint("Floor preference matched");
    }

    /**
     * SOFT: Guest wants balcony
     * Weight: 40 points
     */
    Constraint balconyPreference(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().getPreferences().isWantsBalcony() &&
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().isHasBalcony())
            .reward(HardSoftScore.ofSoft(40))
            .asConstraint("Balcony preference matched");
    }

    /**
     * SOFT: Guest wants kitchenette
     * Weight: 35 points
     */
    Constraint kitchenettePreference(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking ->
                booking.getGuest().getPreferences().isWantsKitchenette() &&
                booking.getAssignedRoom() != null &&
                booking.getAssignedRoom().isHasKitchenette())
            .reward(HardSoftScore.ofSoft(35))
            .asConstraint("Kitchenette preference matched");
    }

    /**
     * SOFT: Guest wants quiet location (avoid low floors near lobby)
     * Weight: 25 points
     */
    Constraint quietLocationPreference(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (!booking.getGuest().getPreferences().isWantsQuiet() ||
                    booking.getAssignedRoom() == null) {
                    return false;
                }

                // Low floors (1-2) are near lobby, elevators, pool - noisy
                return booking.getAssignedRoom().getFloor() >= 3;
            })
            .reward(HardSoftScore.ofSoft(25))
            .asConstraint("Quiet location preference");
    }

    /**
     * SOFT: Stay within guest's budget
     * Weight: 60 points (important, but preferences can override)
     */
    Constraint budgetConstraint(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null ||
                    booking.getGuest().getBudgetMax() == null) {
                    return false;
                }

                int roomPrice = booking.getAssignedRoom().getBasePrice();
                int maxBudget = booking.getGuest().getBudgetMax();

                // Penalize if over budget
                return roomPrice > maxBudget;
            })
            .penalize(HardSoftScore.ofSoft(60))
            .asConstraint("Budget exceeded");
    }

    /**
     * SOFT: Loyalty tier upgrades
     * Weight: 70-90 points based on tier
     */
    Constraint loyaltyTierUpgrade(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEach(GuestBooking.class)
            .filter(booking -> {
                if (booking.getAssignedRoom() == null) {
                    return false;
                }

                int tier = booking.getGuest().getLoyaltyTier();
                RoomType roomType = booking.getAssignedRoom().getType();

                // Platinum (tier 3): Reward if got suite
                if (tier == 3 && roomType == RoomType.SUITE) {
                    return true;
                }

                // Gold (tier 2): Reward if got deluxe or suite
                if (tier == 2 && (roomType == RoomType.DELUXE || roomType == RoomType.SUITE)) {
                    return true;
                }

                // Silver (tier 1): Reward if got deluxe
                if (tier == 1 && roomType == RoomType.DELUXE) {
                    return true;
                }

                return false;
            })
            .reward(booking -> {
                int tier = booking.getGuest().getLoyaltyTier();
                // Platinum: 90 points, Gold: 80 points, Silver: 70 points
                return HardSoftScore.ofSoft(60 + (tier * 10));
            })
            .asConstraint("Loyalty tier upgrade reward");
    }

    /**
     * SOFT: Minimize room changes for multi-night stays
     * Weight: 80 points (high - guests hate changing rooms)
     */
    Constraint minimizeRoomChanges(ConstraintFactory constraintFactory) {
        return constraintFactory
            .forEachUniquePair(GuestBooking.class,
                // Same guest
                Joiners.equal(booking -> booking.getGuest().getId()))
            .filter((booking1, booking2) -> {
                // Check if these are consecutive bookings (back-to-back stays)
                if (booking1.getAssignedRoom() == null ||
                    booking2.getAssignedRoom() == null) {
                    return false;
                }

                boolean consecutive =
                    booking1.getCheckOut().equals(booking2.getCheckIn()) ||
                    booking2.getCheckOut().equals(booking1.getCheckIn());

                if (!consecutive) {
                    return false;
                }

                // Penalize if different rooms for consecutive stays
                return !booking1.getAssignedRoom().getId()
                    .equals(booking2.getAssignedRoom().getId());
            })
            .penalize(HardSoftScore.ofSoft(80))
            .asConstraint("Minimize room changes");
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    private boolean datesOverlap(LocalDate start1, LocalDate end1,
                                  LocalDate start2, LocalDate end2) {
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }

    private boolean matchesFloorPreference(int floor, FloorPreference pref) {
        switch (pref) {
            case LOW:
                return floor >= 1 && floor <= 3;
            case MEDIUM:
                return floor >= 4 && floor <= 8;
            case HIGH:
                return floor >= 9;
            default:
                return false;
        }
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example of how to use this in your application
 */
class HotelAllocationExample {

    public static void main(String[] args) {
        // Create solver configuration
        SolverFactory<HotelAllocation> solverFactory = SolverFactory.create(
            new SolverConfig()
                .withSolutionClass(HotelAllocation.class)
                .withEntityClasses(GuestBooking.class)
                .withConstraintProviderClass(HotelAllocationConstraintProvider.class)
                .withTerminationSpentLimit(Duration.ofSeconds(30))
        );

        Solver<HotelAllocation> solver = solverFactory.buildSolver();

        // Create problem
        HotelAllocation problem = createSampleProblem();

        // Solve
        HotelAllocation solution = solver.solve(problem);

        // Print results
        System.out.println("Score: " + solution.getScore());
        for (GuestBooking booking : solution.getBookings()) {
            System.out.println(
                booking.getGuest().getName() +
                " → Room " + booking.getAssignedRoom().getRoomNumber() +
                " (" + booking.getAssignedRoom().getType() + ")"
            );
        }
    }

    private static HotelAllocation createSampleProblem() {
        // Create 20 rooms
        List<Room> rooms = List.of(
            // Ocean view suites (2 rooms)
            createRoom("R101", RoomType.SUITE, 10, View.OCEAN, true, false, true, true, false, 500),
            createRoom("R102", RoomType.SUITE, 10, View.OCEAN, false, false, true, true, false, 450),

            // Ocean view deluxe (4 rooms)
            createRoom("R201", RoomType.DELUXE, 9, View.OCEAN, true, false, true, false, false, 350),
            createRoom("R202", RoomType.DELUXE, 9, View.OCEAN, false, false, true, false, false, 300),
            createRoom("R203", RoomType.DELUXE, 8, View.OCEAN, false, false, true, false, false, 300),
            createRoom("R204", RoomType.DELUXE, 8, View.OCEAN, false, false, false, false, false, 280),

            // City view deluxe (4 rooms)
            createRoom("R301", RoomType.DELUXE, 7, View.CITY, true, false, true, false, false, 280),
            createRoom("R302", RoomType.DELUXE, 7, View.CITY, false, false, true, false, true, 280),
            createRoom("R303", RoomType.DELUXE, 6, View.CITY, false, false, false, true, false, 250),
            createRoom("R304", RoomType.DELUXE, 6, View.CITY, false, false, false, false, false, 250),

            // Garden view standard (6 rooms)
            createRoom("R401", RoomType.STANDARD, 5, View.GARDEN, true, false, false, false, false, 200),
            createRoom("R402", RoomType.STANDARD, 5, View.GARDEN, false, false, false, false, true, 200),
            createRoom("R403", RoomType.STANDARD, 4, View.GARDEN, false, false, false, false, false, 180),
            createRoom("R404", RoomType.STANDARD, 4, View.GARDEN, false, true, false, false, false, 180),
            createRoom("R405", RoomType.STANDARD, 3, View.GARDEN, false, false, false, false, false, 180),
            createRoom("R406", RoomType.STANDARD, 3, View.GARDEN, false, false, false, false, false, 180),

            // Courtyard view standard (4 rooms)
            createRoom("R501", RoomType.STANDARD, 2, View.COURTYARD, true, false, false, false, false, 150),
            createRoom("R502", RoomType.STANDARD, 2, View.COURTYARD, false, false, false, false, false, 150),
            createRoom("R503", RoomType.STANDARD, 1, View.COURTYARD, false, true, false, false, false, 150),
            createRoom("R504", RoomType.STANDARD, 1, View.COURTYARD, false, false, false, false, false, 150)
        );

        // Create sample bookings
        List<GuestBooking> bookings = List.of(
            // VIP guest - expects ocean view suite
            createBooking("B001",
                createGuest("G001", "Alice Johnson", true, 3,
                    createPreferences(FloorPreference.HIGH, View.OCEAN, false, false, true, false, false, false),
                    600),
                "2025-10-25", "2025-10-28", RoomType.SUITE),

            // Platinum loyalty - expects upgrade
            createBooking("B002",
                createGuest("G002", "Bob Smith", false, 3,
                    createPreferences(FloorPreference.MEDIUM, View.CITY, false, false, false, true, true, false),
                    350),
                "2025-10-25", "2025-10-27", RoomType.DELUXE),

            // Accessibility requirement (HARD)
            createBooking("B003",
                createGuest("G003", "Carol Davis", false, 1,
                    createPreferences(FloorPreference.LOW, View.GARDEN, true, false, false, false, false, false),
                    250),
                "2025-10-26", "2025-10-29", RoomType.STANDARD),

            // Pet owner (HARD)
            createBooking("B004",
                createGuest("G004", "David Wilson", false, 0,
                    createPreferences(FloorPreference.LOW, View.GARDEN, false, false, false, false, false, true),
                    220),
                "2025-10-25", "2025-10-27", RoomType.STANDARD),

            // Budget-conscious
            createBooking("B005",
                createGuest("G005", "Eva Martinez", false, 0,
                    createPreferences(null, null, false, false, false, false, false, false),
                    180),
                "2025-10-27", "2025-10-30", RoomType.STANDARD)
        );

        HotelAllocation problem = new HotelAllocation();
        problem.setRooms(rooms);
        problem.setBookings(bookings);

        return problem;
    }

    // Helper methods omitted for brevity
}
