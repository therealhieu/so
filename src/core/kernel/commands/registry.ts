/**
 * A named action. Generic over context and result so the kernel never
 * imports the application state that instantiates it.
 */
export type Command<Ctx = unknown, R = unknown> = {
  id: string;
  title: string;
  group?: string;
  /** Omitted = every file type. */
  filetypes?: readonly string[];
  run: (ctx: Ctx, args?: string) => R;
};

export class CommandRegistry<Ctx, R> {
  private readonly commands = new Map<string, Command<Ctx, R>>();

  register(cmd: Command<Ctx, R>): void {
    if (this.commands.has(cmd.id))
      throw new Error(`duplicate command id: ${cmd.id}`);
    this.commands.set(cmd.id, cmd);
  }

  get(id: string): Command<Ctx, R> | undefined {
    return this.commands.get(id);
  }

  /** Commands available for `filetype` (all commands when omitted). */
  list(filetype?: string): Command<Ctx, R>[] {
    return [...this.commands.values()].filter(
      (c) =>
        filetype === undefined ||
        c.filetypes === undefined ||
        c.filetypes.includes(filetype),
    );
  }
}
