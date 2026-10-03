type Chars<S extends string> = S extends `${infer C}${infer Rest}`
  ? C | Chars<Rest>
  : never;
type Digit = Chars<"0123456789">;
type Letter = Chars<"abcdefghijklmnopqrstuvwxyz">;

/** Unnamed, numbered, named, system clipboard, and small-delete registers. */
export type RegisterName = '"' | Digit | Letter | "+" | "-";

/** Register content as Neovim's `getreg()` returns it (linewise text ends in "\n"). */
export type Register = { text: string; linewise: boolean };

/** Immutable register file with Neovim's yank and delete rules. */
export class Registers {
  constructor(
    private readonly regs: Readonly<
      Partial<Record<RegisterName, Register>>
    > = {},
  ) {}

  static isName(name: string): name is RegisterName {
    return /^["0-9a-z+-]$/.test(name);
  }

  get(name: RegisterName): Register | undefined {
    return this.regs[name];
  }

  /** Every non-empty register. */
  entries(): [RegisterName, Register][] {
    return Object.entries(this.regs) as [RegisterName, Register][];
  }

  /** Yank: into `name`, or into "0 when no register is given. */
  yank(name: RegisterName | undefined, value: Register): Registers {
    return new Registers({
      ...this.regs,
      [name === undefined || name === '"' ? "0" : name]: value,
      '"': value,
    });
  }

  /**
   * Delete or change: into `name` when given; multi-line, linewise, or
   * `numbered` deletes also shift "1–"9; small deletes without a name go to "-.
   */
  delete(
    name: RegisterName | undefined,
    value: Register,
    numbered = false,
  ): Registers {
    const target = name === '"' ? undefined : name;
    const small = !value.linewise && !value.text.includes("\n");
    const next: Partial<Record<RegisterName, Register>> = { ...this.regs };
    if (target !== undefined) next[target] = value;
    if (!small || numbered) {
      for (let i = 9; i > 1; i--) {
        const from = this.regs[`${i - 1}` as Digit];
        if (from === undefined) delete next[`${i}` as Digit];
        else next[`${i}` as Digit] = from;
      }
      next["1"] = value;
    }
    if (target === undefined && small) next["-"] = value;
    next['"'] = value;
    return new Registers(next);
  }
}
