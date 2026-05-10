declare module "mapshaper" {
  interface MapshaperFiles {
    [filename: string]: string | Buffer;
  }

  function applyCommands(commands: string, files: MapshaperFiles): Promise<Record<string, Buffer>>;

  function runCommands(commands: string, callback: (err: Error | null) => void): void;

  export { applyCommands, runCommands };
}
