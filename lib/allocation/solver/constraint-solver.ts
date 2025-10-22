/**
 * Database-Driven Constraint Solver
 * Reads tenant-specific constraints and performs room allocation
 */

import type {
  HotelAllocation,
  GuestBooking,
  Room,
  HardSoftScore,
  ConstraintMatch,
  TenantConstraintConfig,
} from '../types/timefold';
import { getConstraintConfigClient } from '../db/constraint-config-client';
import { CONSTRAINT_EVALUATORS } from '../constraints/evaluators';

export class ConstraintSolver {
  /**
   * Solve hotel room allocation with tenant-specific constraints
   */
  async solve(allocation: HotelAllocation, timeLimit: number = 30): Promise<HotelAllocation> {
    const startTime = Date.now();

    // 1. Load tenant constraints from database
    const client = getConstraintConfigClient();
    const constraints = await client.getTenantConstraints(allocation.tenantId);

    console.log(`[Solver] Loaded ${constraints.length} constraints for tenant ${allocation.tenantId}`);

    // 2. Generate initial solution (greedy assignment)
    const solution = this.generateInitialSolution(allocation);

    // 3. Evaluate and improve solution
    const optimized = this.optimizeSolution(solution, constraints, timeLimit);

    // 4. Calculate final score and matches
    const { score, matches } = this.evaluateFullSolution(optimized, constraints);

    const solveTime = Date.now() - startTime;

    return {
      ...optimized,
      score,
      constraintMatches: matches,
      solveTime,
    };
  }

  /**
   * Generate initial solution using greedy algorithm
   */
  private generateInitialSolution(allocation: HotelAllocation): HotelAllocation {
    const availableRooms = [...allocation.rooms];
    const bookings = allocation.bookings.map(booking => ({ ...booking }));

    // Sort bookings: VIPs first, then by check-in date
    bookings.sort((a, b) => {
      if (a.guest.vip !== b.guest.vip) return a.guest.vip ? -1 : 1;
      return a.checkIn.getTime() - b.checkIn.getTime();
    });

    // Assign rooms greedily
    for (const booking of bookings) {
      const candidates = availableRooms.filter(
        room => room.type === booking.requestedRoomType
      );

      if (candidates.length > 0) {
        // Pick first matching room (can be improved with scoring)
        booking.assignedRoom = candidates[0];
        availableRooms.splice(availableRooms.indexOf(candidates[0]), 1);
      }
    }

    return { ...allocation, bookings };
  }

  /**
   * Optimize solution using local search
   * Simplified version - full Timefold uses Tabu Search, Simulated Annealing, etc.
   */
  private optimizeSolution(
    solution: HotelAllocation,
    constraints: TenantConstraintConfig[],
    timeLimit: number
  ): HotelAllocation {
    const deadline = Date.now() + timeLimit * 1000;
    let best = { ...solution };
    let bestScore = this.calculateScore(best, constraints);

    let iterations = 0;
    const maxIterations = 1000;

    while (Date.now() < deadline && iterations < maxIterations) {
      // Try swapping room assignments
      const candidate = this.generateNeighbor(best);
      const candidateScore = this.calculateScore(candidate, constraints);

      if (this.isBetter(candidateScore, bestScore)) {
        best = candidate;
        bestScore = candidateScore;
      }

      iterations++;
    }

    console.log(`[Solver] Completed ${iterations} iterations, score: ${bestScore.hardScore}hard/${bestScore.softScore}soft`);

    return best;
  }

  /**
   * Generate neighbor solution by swapping assignments
   */
  private generateNeighbor(solution: HotelAllocation): HotelAllocation {
    const bookings = solution.bookings.map(b => ({ ...b }));

    // Pick two random bookings
    const i = Math.floor(Math.random() * bookings.length);
    const j = Math.floor(Math.random() * bookings.length);

    if (i !== j && bookings[i].assignedRoom && bookings[j].assignedRoom) {
      // Swap their room assignments
      const temp = bookings[i].assignedRoom;
      bookings[i].assignedRoom = bookings[j].assignedRoom;
      bookings[j].assignedRoom = temp;
    }

    return { ...solution, bookings };
  }

  /**
   * Calculate total score for a solution
   */
  private calculateScore(
    solution: HotelAllocation,
    constraints: TenantConstraintConfig[]
  ): HardSoftScore {
    const { score } = this.evaluateFullSolution(solution, constraints);
    return score;
  }

  /**
   * Evaluate all constraints on solution
   */
  private evaluateFullSolution(
    solution: HotelAllocation,
    constraints: TenantConstraintConfig[]
  ): { score: HardSoftScore; matches: ConstraintMatch[] } {
    let hardScore = 0;
    let softScore = 0;
    const matches: ConstraintMatch[] = [];

    for (const config of constraints) {
      const evaluator = CONSTRAINT_EVALUATORS[config.template.code];
      if (!evaluator) continue;

      for (const booking of solution.bookings) {
        const match = evaluator.evaluator(
          booking,
          solution.bookings,
          solution.rooms,
          { ...config.parameters, weight: config.weight }
        );

        if (match) {
          hardScore += match.score.hardScore;
          softScore += match.score.softScore;
          matches.push(match);
        }
      }
    }

    return {
      score: { hardScore, softScore },
      matches,
    };
  }

  /**
   * Compare scores (hard score must be 0, then maximize soft score)
   */
  private isBetter(score1: HardSoftScore, score2: HardSoftScore): boolean {
    if (score1.hardScore !== score2.hardScore) {
      return score1.hardScore > score2.hardScore;
    }
    return score1.softScore > score2.softScore;
  }
}
