export abstract class Resource {
  public constructor(
    public readonly id: string,
    public readonly source: string,
  ) {}
}
