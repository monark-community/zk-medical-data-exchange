import emitter from "@/lib/eventBus";

/**
 * Notify all components using useUser hook that user data has been updated.
 * Call this function if user data been change.
 */
export function notifyUserUpdated() {
  emitter.emit("userUpdated");
}
