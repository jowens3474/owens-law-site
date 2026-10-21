// DeepSeek rejects a request body that holds a lone UTF-16 surrogate (400,
// "unexpected end of hex escape"): JSON.stringify writes one as a bare \udXXX
// escape its parser cannot read. A slice can make one by cutting an emoji in
// half.
//
// Returns a copy of a messages array in which every string, at any depth
// (message content, content parts, tool call arguments), has been through
// String.prototype.toWellFormed(), which swaps each lone surrogate for U+FFFD.
// Every other value passes through unchanged, and the input is not mutated.
// Call it once, on the array handed to chat.completions.create().

// Only arrays and plain objects are copied. Anything else (null, numbers,
// booleans, class instances) comes back as it went in.
function wellFormed(value) {
  if (typeof value === "string") return value.toWellFormed();
  if (Array.isArray(value)) return value.map((item) => wellFormed(item));
  if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, wellFormed(item)]),
      );
    }
  }
  return value;
}

export function wellFormedMessages(messages) {
  return wellFormed(messages);
}
