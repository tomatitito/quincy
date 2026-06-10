import type { RequestHandler } from "@sveltejs/kit";
import { handleAppEventStreamRequest } from "$lib/infrastructure/inbound/http/appEventStream";

export const GET: RequestHandler = ({ request }) => handleAppEventStreamRequest(request);
