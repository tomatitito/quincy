import type { RequestHandler } from "@sveltejs/kit";
import { handleApiRequest } from "$lib/infrastructure/inbound/http/apiRouter";

export const GET: RequestHandler = ({ request }) => handleApiRequest(request);
export const POST: RequestHandler = ({ request }) => handleApiRequest(request);
