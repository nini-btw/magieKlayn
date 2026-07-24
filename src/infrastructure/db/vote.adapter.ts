/**
 * Vote repository adapter
 * @module infrastructure/db/vote-adapter
 */

import { eq, desc, and } from "drizzle-orm";
import type { VoteCandidate } from "@/domain/entities/vote";
import type { IVoteRepository } from "@/domain/ports/repositories";
import { db, mockVoteCandidates } from "./client";
import { voteCandidates, voteLogs } from "./schema";

// Check if we're in mock mode
const isMockMode = !db;

/**
 * Vote repository implementation using Drizzle ORM
 */
export class VoteRepository implements IVoteRepository {
  async getAllActive(): Promise<VoteCandidate[]> {
    if (isMockMode) {
      return mockVoteCandidates
        .filter((c) => c.isActive)
        .sort((a, b) => b.voteCount - a.voteCount);
    }

    const result = await db
      .select()
      .from(voteCandidates)
      .where(eq(voteCandidates.isActive, true))
      .orderBy(desc(voteCandidates.voteCount));

    return result.map(this.mapToEntity);
  }

  async getById(id: string): Promise<VoteCandidate | null> {
    if (isMockMode) {
      return mockVoteCandidates.find((c) => c.id === id) || null;
    }

    const result = await db
      .select()
      .from(voteCandidates)
      .where(eq(voteCandidates.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async hasVoted(candidateId: string, voterFingerprint: string): Promise<boolean> {
    if (isMockMode) return false;

    const result = await db
      .select()
      .from(voteLogs)
      .where(
        and(
          eq(voteLogs.candidateId, candidateId),
          eq(voteLogs.voterFingerprint, voterFingerprint)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async vote(candidateId: string, voterFingerprint?: string): Promise<void> {
    const candidate = await this.getById(candidateId);
    if (!candidate) throw new Error("Candidate not found");

    if (isMockMode) return;

    // Record the vote log if fingerprint is provided
    if (voterFingerprint) {
      await db.insert(voteLogs).values({
        candidateId,
        voterFingerprint,
      });
    }

    await db
      .update(voteCandidates)
      .set({ voteCount: candidate.voteCount + 1 })
      .where(eq(voteCandidates.id, candidateId));
  }

  async create(
    candidate: Omit<VoteCandidate, "id" | "voteCount" | "createdAt">
  ): Promise<VoteCandidate> {
    if (isMockMode) {
      return {
        ...candidate,
        id: `vote-${Date.now()}`,
        voteCount: 0,
        createdAt: new Date(),
      };
    }

    const result = await db
      .insert(voteCandidates)
      .values({
        cookieName: candidate.cookieName,
        description: candidate.description,
        imageUrl: candidate.imageUrl,
        isActive: candidate.isActive,
        voteCount: 0,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    if (isMockMode) return;

    await db.delete(voteCandidates).where(eq(voteCandidates.id, id));
  }

  async resetAll(): Promise<void> {
    if (isMockMode) return;

    await db.update(voteCandidates).set({ voteCount: 0 });
  }

  async toggleActive(id: string): Promise<void> {
    const candidate = await this.getById(id);
    if (!candidate) return;

    if (isMockMode) return;

    await db
      .update(voteCandidates)
      .set({ isActive: !candidate.isActive })
      .where(eq(voteCandidates.id, id));
  }

  /**
   * Map database record to domain entity
   */
  private mapToEntity(row: typeof voteCandidates.$inferSelect): VoteCandidate {
    return {
      id: row.id,
      cookieName: row.cookieName,
      description: row.description,
      imageUrl: row.imageUrl,
      voteCount: row.voteCount,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
    };
  }
}

/**
 * Singleton instance
 */
export const voteRepository = new VoteRepository();
