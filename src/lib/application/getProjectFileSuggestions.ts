import type { ProjectFileRepository } from "$lib/domain/ports";

export interface GetProjectFileSuggestionsQuery {
  query?: string;
}

export function getProjectFileSuggestions(repository: ProjectFileRepository, query: GetProjectFileSuggestionsQuery) {
  return repository({ query: query.query ?? "", limit: 20 });
}
