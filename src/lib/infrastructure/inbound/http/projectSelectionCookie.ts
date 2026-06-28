import type { ProjectPath } from "$lib/domain/ports";

export const projectSelectionCookieName = "quincy.project";

export function readSelectedProjectFromRequest(request: Request): ProjectPath | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${projectSelectionCookieName}=`;
  const selectedCookie = cookies.find((cookie) => cookie.startsWith(prefix));
  if (selectedCookie === undefined) return undefined;
  const value = selectedCookie.slice(prefix.length);
  return value ? decodeURIComponent(value) : undefined;
}

export function createSelectedProjectCookie(projectPath: ProjectPath): string {
  return `${projectSelectionCookieName}=${encodeURIComponent(projectPath)}; Path=/; SameSite=Lax`;
}
