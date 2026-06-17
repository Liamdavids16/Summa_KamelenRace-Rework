const ClientInstanceId = crypto.randomUUID();

export function getClientInstanceId(): string {
  return ClientInstanceId;
}
