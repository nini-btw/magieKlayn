/**
 * Vote entity definitions
 * @module domain/entities/vote
 */

/**
 * Vote candidate - retired flavour customers can vote to bring back
 */
export interface VoteCandidate {
  id: string;
  cookieName: string;
  description: string;
  imageUrl: string;
  voteCount: number;
  isActive: boolean;
  createdAt: Date;
}

/**
 * User vote record (stored in localStorage or DB)
 */
export interface UserVote {
  candidateId: string;
  votedAt: Date;
}

/**
 * Vote result with percentage for display
 */
export interface VoteResult extends VoteCandidate {
  percentage: number;
  userHasVoted: boolean;
}
