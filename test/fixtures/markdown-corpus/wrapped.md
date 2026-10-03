# Wrapped inline code and math

A paragraph with `inline code that
wraps [[hidden-code]] #hidden-code` across lines, then [[after-code]].

Math $x + y
[[hidden-math]] #hidden-math = z$ wraps too, then #after-math.

A `double ``run
[[still-code]]`` stays open` until its own length closes it.

> A quote with `code
> [[hidden-quote]] #hidden-quote` and [[after-quote]].

- An item with `code
  [[hidden-item]]` inside and #after-item.
- A new item `opens
- [[next-item]] in the next item` without closing it.

| a `b | c |
| --- | --- |
| [[cell-link]]` | #cell-tag |
