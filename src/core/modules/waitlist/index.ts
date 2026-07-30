/**
 * Módulo waitlist — API pública.
 */
export {
  subscribeToWaitlist,
  unsubscribeFromWaitlist,
  type SubscribeResult,
  type UnsubscribeResult,
} from "./waitlist.actions";

export {
  notifyVariantReplenished,
  notifyVariantsReplenished,
} from "./waitlist.use-cases";

export type {
  WaitlistEntry,
  WaitlistNotificationContext,
} from "./waitlist.types";
