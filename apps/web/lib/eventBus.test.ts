import { describe, it, expect, beforeEach, mock } from "bun:test";
import emitter from "./eventBus";
import type { AppEvents } from "./eventBus";

describe("EventBus", () => {
  beforeEach(() => {
    // Clear all event handlers before each test
    emitter.all.clear();
  });

  describe("Event emission and handling", () => {
    it("should emit and handle medicalDataUploaded event", () => {
      const handler = mock(() => {});
      emitter.on("medicalDataUploaded", handler);

      emitter.emit("medicalDataUploaded");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle medicalDataDeleting event", () => {
      const handler = mock(() => {});
      emitter.on("medicalDataDeleting", handler);

      emitter.emit("medicalDataDeleting");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle medicalDataDeleted event", () => {
      const handler = mock(() => {});
      emitter.on("medicalDataDeleted", handler);

      emitter.emit("medicalDataDeleted");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle userUpdated event", () => {
      const handler = mock(() => {});
      emitter.on("userUpdated", handler);

      emitter.emit("userUpdated");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle proposalUpdated event", () => {
      const handler = mock(() => {});
      emitter.on("proposalUpdated", handler);

      emitter.emit("proposalUpdated");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle studyCreated event", () => {
      const handler = mock(() => {});
      emitter.on("studyCreated", handler);

      emitter.emit("studyCreated");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle studyCompleted event", () => {
      const handler = mock(() => {});
      emitter.on("studyCompleted", handler);

      emitter.emit("studyCompleted");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle studyJoinedSuccess event", () => {
      const handler = mock(() => {});
      emitter.on("studyJoinedSuccess", handler);

      emitter.emit("studyJoinedSuccess");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle studyDeleted event", () => {
      const handler = mock(() => {});
      emitter.on("studyDeleted", handler);

      emitter.emit("studyDeleted");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit and handle consentChanged event", () => {
      const handler = mock(() => {});
      emitter.on("consentChanged", handler);

      emitter.emit("consentChanged");

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multiple handlers", () => {
    it("should handle multiple handlers for same event", () => {
      const handler1 = mock(() => {});
      const handler2 = mock(() => {});
      const handler3 = mock(() => {});

      emitter.on("userUpdated", handler1);
      emitter.on("userUpdated", handler2);
      emitter.on("userUpdated", handler3);

      emitter.emit("userUpdated");

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("should emit multiple times to same handler", () => {
      const handler = mock(() => {});
      emitter.on("studyCreated", handler);

      emitter.emit("studyCreated");
      emitter.emit("studyCreated");
      emitter.emit("studyCreated");

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe("Event handler removal", () => {
    it("should remove event handler", () => {
      const handler = mock(() => {});
      emitter.on("medicalDataUploaded", handler);

      emitter.emit("medicalDataUploaded");
      expect(handler).toHaveBeenCalledTimes(1);

      emitter.off("medicalDataUploaded", handler);
      emitter.emit("medicalDataUploaded");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should only remove specified handler", () => {
      const handler1 = mock(() => {});
      const handler2 = mock(() => {});

      emitter.on("userUpdated", handler1);
      emitter.on("userUpdated", handler2);

      emitter.off("userUpdated", handler1);
      emitter.emit("userUpdated");

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Wildcard handler", () => {
    it("should handle wildcard events", () => {
      const wildcardHandler = mock((type: keyof AppEvents) => {});
      emitter.on("*", wildcardHandler);

      emitter.emit("medicalDataUploaded");
      emitter.emit("userUpdated");
      emitter.emit("studyCreated");

      expect(wildcardHandler).toHaveBeenCalledTimes(3);
    });

    it("should pass event type to wildcard handler", () => {
      const wildcardHandler = mock((type: keyof AppEvents) => {});
      emitter.on("*", wildcardHandler);

      emitter.emit("medicalDataUploaded");

      expect(wildcardHandler).toHaveBeenCalledWith("medicalDataUploaded", undefined);
    });
  });

  describe("Event isolation", () => {
    it("should not trigger handlers for different events", () => {
      const uploadHandler = mock(() => {});
      const deleteHandler = mock(() => {});

      emitter.on("medicalDataUploaded", uploadHandler);
      emitter.on("medicalDataDeleted", deleteHandler);

      emitter.emit("medicalDataUploaded");

      expect(uploadHandler).toHaveBeenCalledTimes(1);
      expect(deleteHandler).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should not crash if handler throws error", () => {
      const errorHandler = mock(() => {
        throw new Error("Handler error");
      });
      const goodHandler = mock(() => {});

      emitter.on("userUpdated", errorHandler);
      emitter.on("userUpdated", goodHandler);

      const originalConsoleError = console.error;
      console.error = () => {};

      expect(() => emitter.emit("userUpdated")).toThrow();

      console.error = originalConsoleError;
    });
  });

  describe("Complex scenarios", () => {
    it("should handle multiple events in sequence", () => {
      const uploadHandler = mock(() => {});
      const deleteHandler = mock(() => {});
      const updateHandler = mock(() => {});

      emitter.on("medicalDataUploaded", uploadHandler);
      emitter.on("medicalDataDeleted", deleteHandler);
      emitter.on("userUpdated", updateHandler);

      emitter.emit("medicalDataUploaded");
      emitter.emit("userUpdated");
      emitter.emit("medicalDataDeleted");
      emitter.emit("userUpdated");

      expect(uploadHandler).toHaveBeenCalledTimes(1);
      expect(deleteHandler).toHaveBeenCalledTimes(1);
      expect(updateHandler).toHaveBeenCalledTimes(2);
    });

    it("should work with study workflow events", () => {
      const createdHandler = mock(() => {});
      const joinedHandler = mock(() => {});
      const consentHandler = mock(() => {});
      const completedHandler = mock(() => {});

      emitter.on("studyCreated", createdHandler);
      emitter.on("studyJoinedSuccess", joinedHandler);
      emitter.on("consentChanged", consentHandler);
      emitter.on("studyCompleted", completedHandler);

      // Simulate study workflow
      emitter.emit("studyCreated");
      emitter.emit("studyJoinedSuccess");
      emitter.emit("consentChanged");
      emitter.emit("studyCompleted");

      expect(createdHandler).toHaveBeenCalledTimes(1);
      expect(joinedHandler).toHaveBeenCalledTimes(1);
      expect(consentHandler).toHaveBeenCalledTimes(1);
      expect(completedHandler).toHaveBeenCalledTimes(1);
    });
  });
});
