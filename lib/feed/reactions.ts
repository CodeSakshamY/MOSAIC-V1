export const reactionChoices = ["like", "upvote", "downvote", "interesting", "inspired"] as const;

export type ReactionChoice = (typeof reactionChoices)[number];

export function isReactionType(value: string): value is ReactionChoice {
  return value === "like" || value === "upvote" || value === "downvote" || value === "interesting" || value === "inspired";
}
