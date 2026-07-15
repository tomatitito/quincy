import { loadHomePage } from "$lib/infrastructure/inbound/pages/loadHomePage";
import { projectSelectionCookieName } from "$lib/infrastructure/inbound/http/projectSelectionCookie";

export const load = ({ cookies, url }) => loadHomePage(url.searchParams.get("projectPath") ?? cookies.get(projectSelectionCookieName));
