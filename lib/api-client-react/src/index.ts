export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter, customFetch } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";

import { setAuthTokenGetter as _setAuthTokenGetter } from "./custom-fetch";

export function setToken(token: string | null): void {
  _setAuthTokenGetter(token ? () => token : null);
}
