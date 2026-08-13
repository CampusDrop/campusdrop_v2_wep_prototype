/**
 * Server-owned contract for the operations game and event authoring screens.
 *
 * This is deliberately type-only: no browser storage or client-side fallback
 * may be used to infer the current operator, a game, or an event.
 */
export type KstDateTime = string;

export type ParticipantRange = {
  minPlayers: number;
  maxPlayers: number;
};

export type EventRewardPolicy = {
  /** A finite coupon tied directly to the event. */
  limitedCouponId: string;
  /** First completion receives the limited coupon while issuance remains. */
  firstCompletionReward: "LIMITED_COUPON";
  /** A second completion by the same player always uses the shared reward pool. */
  repeatCompletionReward: "UNLIMITED_INTEREST_MATCHED_COUPON";
  /** All completions use the shared reward pool once the limited allocation ends. */
  exhaustedReward: "UNLIMITED_INTEREST_MATCHED_COUPON";
};

export type GameAuthoringDraft = {
  title: string;
  participantRange: ParticipantRange;
  missionDraftId?: string;
};

export type EventAuthoringDraft = {
  title: string;
  gameId: string;
  startsAtKst: KstDateTime;
  endsAtKst: KstDateTime;
  reward: EventRewardPolicy;
};

/**
 * Planned server methods. They must authenticate with the HttpOnly session
 * and enforce SUPER | USER_SERVICE_MANAGER on every request.
 */
export interface GameEventAuthoringApi {
  listGames(): Promise<ReadonlyArray<GameAuthoringDraft>>;
  listEvents(): Promise<ReadonlyArray<EventAuthoringDraft>>;
  createGame(draft: GameAuthoringDraft): Promise<GameAuthoringDraft>;
  createEvent(draft: EventAuthoringDraft): Promise<EventAuthoringDraft>;
  publishGame(gameId: string): Promise<void>;
  publishEvent(eventId: string): Promise<void>;
}
