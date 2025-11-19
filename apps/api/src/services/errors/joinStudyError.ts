export class JoinStudyError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "JoinStudyError";
    (this as any).cause = cause;
  }
}