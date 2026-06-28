import { loadHomePage } from "$lib/infrastructure/inbound/pages/loadHomePage";
import { projectSelectionCookieName } from "$lib/infrastructure/inbound/http/projectSelectionCookie";

export const load = ({ cookies }) => loadHomePage(cookies.get(projectSelectionCookieName));
