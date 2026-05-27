export interface MyPermissionsResponse {
  isOwner: boolean;
  isAdmin: boolean;
  grants: string[];
  denies: string[];
}

/**
 * Structured permission representation mirroring the backend's AclPermission record.
 * Parsed once from a "resource:action:selector" string.
 */
interface AclPermission {
  resource: string;
  action: string;
  selector: string;
}

/**
 * Parses a permission string into a structured AclPermission.
 * Matches the backend's AclPermission.parse behavior:
 *   - "*" → { resource: "*", action: "*", selector: "*" }
 *   - "library:write" → { resource: "library", action: "write", selector: "*" }
 *   - "library:write:xyz" → { resource: "library", action: "write", selector: "xyz" }
 */
function parse(permissionStr: string): AclPermission {
  if (permissionStr === "*") {
    return { resource: "*", action: "*", selector: "*" };
  }
  const parts = permissionStr.split(":");
  return {
    resource: parts[0],
    action: parts[1],
    selector: parts[2] || "*",
  };
}

/**
 * Grant implication: does this granted permission cover the requested one?
 * Mirrors AclPermission.implies() in the backend.
 *
 * Rules:
 *   - Super-admin "*" implies everything
 *   - Resource must match exactly
 *   - Action: exact match, wildcard, or WRITE implies READ
 *   - Selector: wildcard "*" matches any, otherwise exact match
 */
function implies(granted: AclPermission, requested: AclPermission): boolean {
  if (granted.resource === "*" && granted.action === "*") {
    return true;
  }

  if (granted.resource !== requested.resource) {
    return false;
  }

  if (granted.action !== "*" && granted.action !== requested.action) {
    if (!(granted.action === "write" && requested.action === "read")) {
      return false;
    }
  }

  return granted.selector === "*" || granted.selector === requested.selector;
}

/**
 * Deny implication: does denying this permission also deny the requested one?
 * Mirrors AclPermission.denies() in the backend.
 *
 * Rules:
 *   - Super-admin deny "*" denies everything
 *   - Resource must match exactly
 *   - Action: exact match, wildcard, or denying READ implies denying WRITE (contrapositive)
 *   - Selector: wildcard "*" matches any, otherwise exact match
 */
function denies(denied: AclPermission, requested: AclPermission): boolean {
  if (denied.resource === "*" && denied.action === "*") {
    return true;
  }

  if (denied.resource !== requested.resource) {
    return false;
  }

  if (denied.action !== "*" && denied.action !== requested.action) {
    if (!(denied.action === "read" && requested.action === "write")) {
      return false;
    }
  }

  return denied.selector === "*" || denied.selector === requested.selector;
}

/**
 * High-fidelity authorization evaluator matching ADR-001 and the backend's
 * HeapDogSecurityEvaluator + AclPolicy.permits() behavior.
 *
 * Evaluation order:
 *   1. Explicit Deny Precedence (deny always wins)
 *   2. Owner/Admin bypass
 *   3. Explicit Grant check
 *   4. Default Deny
 *
 * @param permissions - The user's resolved permissions from /acl/my-permissions
 * @param requestedStr - Permission to check, e.g. "library:write"
 * @param selector - Optional scoping selector (e.g. a library UUID).
 *   Mirrors the backend's hasPermission(slug, "library:write", libraryId)
 *   which concatenates to "library:write:<libraryId>" before evaluation.
 */
export function hasPermission(
  permissions: MyPermissionsResponse | null | undefined,
  requestedStr: string,
  selector?: string
): boolean {
  if (!permissions) {
    return false;
  }

  // Build the full requested permission, mirroring the backend's approach:
  //   hasPermission(slug, "library:write", libraryId)
  //     → AclPermission.parse("library:write:" + libraryId)
  const fullRequestedStr = selector ? `${requestedStr}:${selector}` : requestedStr;
  const requested = parse(fullRequestedStr);

  // 1. Explicit Deny Precedence
  for (const denyStr of permissions.denies) {
    if (denies(parse(denyStr), requested)) {
      return false;
    }
  }

  // 2. Owner/Admin bypass (matches backend's autogroup:owner root override)
  if (permissions.isOwner || permissions.isAdmin) {
    return true;
  }

  // 3. Explicit Grant check
  for (const grantStr of permissions.grants) {
    if (implies(parse(grantStr), requested)) {
      return true;
    }
  }

  // 4. Default Deny
  return false;
}
