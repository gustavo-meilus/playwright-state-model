import { StateValidationErrorDetails } from "./types";

/**
 * Custom error class for state validation failures with rich context.
 * Provides detailed information for debugging state validation issues.
 */
export class StateValidationError extends Error {
  public readonly details: StateValidationErrorDetails;

  constructor(details: StateValidationErrorDetails) {
    const message = `State validation failed for '${details.expectedState}'`;
    super(message);
    this.name = "StateValidationError";
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StateValidationError);
    }
  }

  /**
   * Returns a formatted string representation of the error with all context.
   */
  toString(): string {
    const lines = [
      `State validation failed for '${this.details.expectedState}':`,
      `  Expected state: ${this.details.expectedState}`,
      `  Current state: ${this.details.currentState}`,
      `  Current URL: ${this.details.currentUrl}`,
      `  Validation chain: ${this.details.validationChain.join(" -> ")}`,
    ];

    if (this.details.originalError) {
      lines.push(`  Original error: ${this.details.originalError.message}`);
      if (this.details.originalError.stack) {
        lines.push(`  Stack trace: ${this.details.originalError.stack}`);
      }
    }

    return lines.filter(Boolean).join("\n");
  }
}

