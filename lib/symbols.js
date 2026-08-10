/**
 * A special symbol that can be returned from (or passed to `reply()` in) a call handler to
 * suppress sending any response to the caller. It then becomes the handler's responsibility
 * to send the response by some other means (e.g. via `sendRaw()`).
 *
 * @const
 * @group Symbols
 */
export const NOREPLY = Symbol("NOREPLY");
