import emitter from "@/lib/eventBus";

export function notifyUserUpdated() {
  emitter.emit("userUpdated");
}
