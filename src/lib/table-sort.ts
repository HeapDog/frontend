/**
 * Allowed sort fields for problem/version lists (must match backend ALLOWED_PROBLEM_VERSION_SORT_FIELDS).
 * Syntax for API: ?sort=<field>,<order> (e.g. sort=title,asc).
 */
export const PROBLEM_VERSION_SORT_FIELDS = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "title", label: "Title" },
  { value: "difficulty", label: "Difficulty" },
  { value: "problem.slug", label: "Slug" },
  { value: "version", label: "Version" },
  { value: "status", label: "Status" },
  { value: "problem.publishedVersion", label: "Published version" },
] as const

export type SortOrder = "asc" | "desc"

/** Parse ?sort=field,order from searchParams. Returns null if invalid. */
export function parseSortParam(
  sortParam: string | null,
  allowedFields: Set<string>
): { field: string; order: SortOrder } | null {
  if (!sortParam || !sortParam.includes(",")) return null
  const [field, order] = sortParam.split(",").map((s) => s.trim())
  if (!field || !allowedFields.has(field)) return null
  if (order !== "asc" && order !== "desc") return null
  return { field, order: order as SortOrder }
}

/** Build sort string for backend: field,order */
export function buildSortString(field: string, order: SortOrder): string {
  return `${field},${order}`
}
