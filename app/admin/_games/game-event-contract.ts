/**
 * Server-owned contract for the operations game and event authoring screens.
 *
 * Inputs intentionally have no IDs. IDs below are opaque server-issued values,
 * so a publish target can only originate from a create/list response in normal
 * typed use. Browser storage and client-side fallback are never authorities.
 */
declare const serverIssuedId: unique symbol;

type ServerIssuedId<Kind extends string> = string & {
  readonly [serverIssuedId]: Kind;
};

export type GameId = ServerIssuedId<"game">;
export type EventId = ServerIssuedId<"event">;
export type LimitedCouponId = ServerIssuedId<"limited-coupon">;
export type KstDateTime = string;

export type ParticipantRangeInput = {
  minPlayers: number;
  maxPlayers: number;
};

/** Input DTO: supplied by the authoring form; it is never a server record. */
export type CreateGameInput = {
  title: string;
  participantRange: ParticipantRangeInput;
  missionDraftId?: string;
};

export type EventRewardPolicyInput = {
  /** A finite coupon selected from the server-authorized event coupon list. */
  limitedCouponId: LimitedCouponId;
  firstCompletionReward: "LIMITED_COUPON";
  repeatCompletionReward: "UNLIMITED_INTEREST_MATCHED_COUPON";
  exhaustedReward: "UNLIMITED_INTEREST_MATCHED_COUPON";
};

/** Input DTO: `gameId` must be the opaque ID returned by game create/list. */
export type CreateEventInput = {
  title: string;
  gameId: GameId;
  startsAtKst: KstDateTime;
  endsAtKst: KstDateTime;
  reward: EventRewardPolicyInput;
};

export type GamePublicationStatus = "DRAFT" | "PUBLISHED";
export type EventPublicationStatus = "DRAFT" | "PUBLISHED" | "ENDED";

type ServerAuditFields = {
  /** Stable server identifier. Never synthesize this from form input. */
  id: string;
  createdAtKst: KstDateTime;
  updatedAtKst: KstDateTime;
};

export type DraftGame = Readonly<CreateGameInput & ServerAuditFields & {
  id: GameId;
  publicationStatus: "DRAFT";
}>;

export type PublishedGame = Readonly<CreateGameInput & ServerAuditFields & {
  id: GameId;
  publicationStatus: "PUBLISHED";
}>;

export type GameRecord = DraftGame | PublishedGame;

export type DraftEvent = Readonly<CreateEventInput & ServerAuditFields & {
  id: EventId;
  publicationStatus: "DRAFT";
}>;

export type PublishedEvent = Readonly<CreateEventInput & ServerAuditFields & {
  id: EventId;
  publicationStatus: "PUBLISHED";
}>;

export type EndedEvent = Readonly<CreateEventInput & ServerAuditFields & {
  id: EventId;
  publicationStatus: "ENDED";
}>;

export type EventRecord = DraftEvent | PublishedEvent | EndedEvent;

/**
 * Planned server methods. Every request authenticates with the HttpOnly
 * session and enforces SUPER | USER_SERVICE_MANAGER on the server.
 *
 * `publish*` only accepts a draft record returned by `create*` or `list*`.
 * This keeps raw strings and unsaved form DTOs out of publish requests.
 */
export interface GameEventAuthoringApi {
  listGames(): Promise<ReadonlyArray<GameRecord>>;
  listEvents(): Promise<ReadonlyArray<EventRecord>>;
  createGame(input: CreateGameInput): Promise<DraftGame>;
  createEvent(input: CreateEventInput): Promise<DraftEvent>;
  publishGame(target: DraftGame): Promise<PublishedGame>;
  publishEvent(target: DraftEvent): Promise<PublishedEvent>;
}
