import { BackendClient } from "@/lib/backend-client";
import { InternalClient } from "@/lib/internal-client";
import { Tag, Language, ProblemLibrary, ProblemVersion, ProblemWithLatestVersion, ProblemStatus, ProblemDifficulty, ProblemVersionRevision } from "@/lib/types/problem";
import { InternalUser } from "@/lib/types/organization";
import { PaginatedData, PaginationMeta } from "@/lib/types/api";
import { getValidAccessToken } from "@/lib/token-utils";

export interface ProblemRow {
  id: string;
  versionId?: string;
  slug: string;
  title: string;
  versionNumber: number;
  difficulty?: ProblemDifficulty;
  createdAt: string;
  createdBy: string;
  publishedVersionId: string | null;
  status: ProblemStatus;
  tags: { id: string; name: string; description: string }[];
  languages: { id: string; name: string; version: string }[];
}

type EnrichedProblem = ProblemWithLatestVersion & {
  creator?: InternalUser | null;
};

function formatCreator(creator?: InternalUser | null, fallbackId?: string): string {
  if (!creator) return fallbackId || "Unknown";
  const fullName = [creator.firstName, creator.lastName].filter(Boolean).join(" ").trim();
  if (fullName.length > 0) return fullName;
  if (creator.username) return creator.username;
  if (creator.email) return creator.email;
  return fallbackId || "Unknown";
}

export async function getProblemTags() {
  try {
    const token = await getValidAccessToken();

    if (!token) throw new Error("Authentication required");

    const response = await BackendClient.get<Tag[]>(
      "/public/problems/tags",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return { data: [], error };
  }
}

export async function getProblemLanguages() {
  try {
    const token = await getValidAccessToken();

    if (!token) throw new Error("Authentication required");

    const response = await BackendClient.get<Language[]>(
      "/public/problems/languages",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching languages:", error);
    return { data: [], error };
  }
}

export async function getOrganizationProblemLibraries(slug: string) {
  try {
    const token = await getValidAccessToken();

    if (!token) throw new Error("Authentication required");

    const response = await BackendClient.get<ProblemLibrary[]>(
      `/organizations/${slug}/problem-libraries`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      } as any
    );
    return { data: response.data, error: null };
  } catch (error) {
    console.error(`Error fetching problem libraries for ${slug}:`, error);
    return { data: [], error };
  }
}

export async function createOrganizationProblemLibrary(
  slug: string,
  body: { name: string; description?: string | null },
  token: string
) {
  const response = await BackendClient.post<ProblemLibrary>(
    `/organizations/${slug}/problem-libraries`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response;
}

export async function updateProblemLibrary(
  slug: string,
  libraryId: string,
  body: { name: string; description?: string | null },
  token: string
) {
  const response = await BackendClient.put<ProblemLibrary>(
    `/organizations/${slug}/problem-libraries/${libraryId}`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response
}

export async function deleteProblemLibrary(
  slug: string,
  libraryId: string,
  token: string
) {
  const response = await BackendClient.delete<void>(
    `/organizations/${slug}/problem-libraries/${libraryId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response
}

export async function setDefaultProblemLibrary(
  slug: string,
  libraryId: string,
  token: string
) {
  const response = await BackendClient.put<any>(
    `/organizations/${slug}/problem-libraries/${libraryId}/default`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response
}


export async function getLibraryProblems(
  slug: string,
  libraryId: string,
  options?: { page?: number; size?: number; sort?: string }
): Promise<{ data: ProblemRow[]; meta?: PaginationMeta } | { data: null; error: unknown }> {
  try {
    const token = await getValidAccessToken();
    if (!token) return { data: null, error: new Error("Authentication required") };

    const page = Math.max(1, options?.page ?? 1);
    const size = Math.min(100, Math.max(1, options?.size ?? 20));

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (options?.sort) params.set("sort", options.sort);

    const backendResponse = await BackendClient.get<PaginatedData<ProblemWithLatestVersion>>(
      `/problem-libraries/${libraryId}/problems?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      } as any
    );

    const data = backendResponse.data;
    const contents = data.contents ?? [];

    const creatorIds = Array.from(
      new Set(
        contents
          .map((item) => item.problem.createdBy)
          .filter((id): id is string => Boolean(id))
      )
    );

    let creatorsMap = new Map<string, InternalUser>();
    if (creatorIds.length > 0) {
      try {
        const userIdsParam = creatorIds.map((id) => encodeURIComponent(id)).join(",");
        const creatorsResponse = await InternalClient.get<InternalUser[]>(
          `/internal/users?userIds=${userIdsParam}`
        );
        const creators = creatorsResponse.data ?? [];
        creatorsMap = new Map(creators.map((user) => [user.id, user]));
      } catch (error) {
        console.error("Failed to fetch problem creators via InternalClient:", error);
      }
    }

    const enrichedContents: EnrichedProblem[] = contents.map((item) => ({
      ...item,
      creator: creatorsMap.get(item.problem.createdBy) ?? null,
    }));

    const mapped: ProblemRow[] = enrichedContents.map((item) => ({
      id: item.problem.id,
      versionId: item.version.id,
      slug: item.problem.slug,
      title: item.version.title,
      versionNumber: item.version.number,
      difficulty: item.version.difficulty,
      createdAt: new Date(item.problem.createdAt).toLocaleDateString(),
      createdBy: formatCreator(item.creator, item.problem.createdBy),
      publishedVersionId: item.problem.publishedVersionId,
      status: item.version.status,
      tags: item.version.tags ?? [],
      languages: item.version.languages ?? [],
    }));

    const meta = data.meta
      ? {
        ...data.meta,
        page: Math.min(data.meta.page, Math.max(1, data.meta.totalPages)),
      }
      : undefined;

    return { data: mapped, meta };
  } catch (error) {
    console.error(`Error fetching library problems for ${slug}/${libraryId}:`, error);
    return { data: null, error };
  }
}

export interface ProblemVersionWithDisplay extends ProblemVersion {
  createdByDisplay: string
  lastUpdatedByDisplay: string
}

export async function getProblemVersions(
  slug: string,
  libraryId: string,
  problemId: string,
  options?: { page?: number; size?: number; sort?: string }
): Promise<{ data: ProblemVersionWithDisplay[]; meta?: PaginationMeta } | { data: null; error: unknown }> {
  try {
    const token = await getValidAccessToken();
    if (!token) return { data: null, error: new Error("Authentication required") };

    const page = Math.max(1, options?.page ?? 1);
    const size = Math.min(100, Math.max(1, options?.size ?? 20));

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (options?.sort) params.set("sort", options.sort);

    const response = await BackendClient.get<{ contents: ProblemVersion[]; meta?: PaginationMeta }>(
      `/problem-libraries/${libraryId}/problems/${problemId}/versions?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const contents = response.data?.contents ?? [];
    const rawMeta = response.data?.meta;
    const meta = rawMeta
      ? {
        ...rawMeta,
        page: Math.min(rawMeta.page, Math.max(1, rawMeta.totalPages)),
      }
      : undefined;

    const userIds = Array.from(
      new Set(
        contents.flatMap((v) => [v.createdBy, v.lastUpdatedBy].filter((id): id is string => Boolean(id)))
      )
    );

    let usersMap = new Map<string, InternalUser>();
    if (userIds.length > 0) {
      try {
        const userIdsParam = userIds.map((id) => encodeURIComponent(id)).join(",");
        const usersResponse = await InternalClient.get<InternalUser[]>(
          `/internal/users?userIds=${userIdsParam}`
        );
        const users = usersResponse.data ?? [];
        usersMap = new Map(users.map((u) => [u.id, u]));
      } catch (error) {
        console.error("Failed to fetch version creators/updaters via InternalClient:", error);
      }
    }

    const withDisplay: ProblemVersionWithDisplay[] = contents.map((v) => ({
      ...v,
      createdByDisplay: formatCreator(usersMap.get(v.createdBy ?? ""), v.createdBy),
      lastUpdatedByDisplay: v.lastUpdatedBy == null
        ? "-"
        : formatCreator(usersMap.get(v.lastUpdatedBy), v.lastUpdatedBy),
    }));

    return { data: withDisplay, meta };
  } catch (error) {
    console.error(`Error fetching problem versions for ${problemId}:`, error);
    return { data: null, error };
  }
}

export interface ProblemVersionDetail extends ProblemWithLatestVersion {
  problemCreatedByDisplay: string
  versionCreatedByDisplay: string
  versionLastUpdatedByDisplay: string
}

export async function getProblemVersion(
  slug: string,
  libraryId: string,
  problemId: string,
  versionId: string
): Promise<{ data: ProblemVersionDetail } | { data: null; error: unknown }> {
  try {
    const token = await getValidAccessToken();
    if (!token) return { data: null, error: new Error("Authentication required") };

    const response = await BackendClient.get<ProblemWithLatestVersion>(
      `/problem-libraries/${libraryId}/problems/${problemId}/versions/${versionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const raw = response.data;
    if (!raw) return { data: null, error: new Error("No data") };

    const userIds = Array.from(
      new Set(
        [
          raw.problem.createdBy,
          raw.version.createdBy,
          raw.version.lastUpdatedBy,
        ].filter((id): id is string => Boolean(id))
      )
    );

    let usersMap = new Map<string, InternalUser>();
    if (userIds.length > 0) {
      try {
        const userIdsParam = userIds.map((id) => encodeURIComponent(id)).join(",");
        const usersResponse = await InternalClient.get<InternalUser[]>(
          `/internal/users?userIds=${userIdsParam}`
        );
        const users = usersResponse.data ?? [];
        usersMap = new Map(users.map((u) => [u.id, u]));
      } catch (error) {
        console.error("Failed to fetch creators via InternalClient:", error);
      }
    }

    const enriched: ProblemVersionDetail = {
      ...raw,
      problemCreatedByDisplay: formatCreator(usersMap.get(raw.problem.createdBy), raw.problem.createdBy),
      versionCreatedByDisplay: raw.version.createdBy
        ? formatCreator(usersMap.get(raw.version.createdBy), raw.version.createdBy)
        : "-",
      versionLastUpdatedByDisplay: raw.version.lastUpdatedBy == null
        ? "-"
        : formatCreator(usersMap.get(raw.version.lastUpdatedBy), raw.version.lastUpdatedBy),
    };

    return { data: enriched };
  } catch (error) {
    console.error(`Error fetching problem version ${problemId}/${versionId}:`, error);
    return { data: null, error };
  }
}

export interface ProblemVersionRevisionWithDisplay extends ProblemVersionRevision {
  title: string
  createdByDisplay: string
  createdByProfilePictureUrl?: string | null
}

export async function getProblemVersionRevisions(
  slug: string,
  libraryId: string,
  problemId: string,
  versionId: string,
  options?: { page?: number; size?: number }
): Promise<{ data: ProblemVersionRevisionWithDisplay[]; meta?: PaginationMeta } | { data: null; error: unknown }> {
  try {
    const token = await getValidAccessToken();
    if (!token) return { data: null, error: new Error("Authentication required") };

    const page = Math.max(1, options?.page ?? 1);
    const size = Math.min(100, Math.max(1, options?.size ?? 20));

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));

    const endpoint = `/problem-libraries/${libraryId}/problems/${problemId}/versions/${versionId}/revisions?${params.toString()}`;
    const response = await BackendClient.get<{ contents: ProblemVersionRevision[]; meta?: PaginationMeta }>(
      endpoint,
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const contents = response.data?.contents ?? [];
    const rawMeta = response.data?.meta;
    const meta = rawMeta
      ? {
        ...rawMeta,
        page: Math.min(rawMeta.page, Math.max(1, rawMeta.totalPages)),
      }
      : undefined;

    const userIds = Array.from(
      new Set(
        contents.map((v) => v.createdBy).filter((id): id is string => Boolean(id))
      )
    );

    let usersMap = new Map<string, InternalUser>();
    if (userIds.length > 0) {
      try {
        const userIdsParam = userIds.map((id) => encodeURIComponent(id)).join(",");
        const usersResponse = await InternalClient.get<InternalUser[]>(
          `/internal/users?userIds=${userIdsParam}`
        );
        const users = usersResponse.data ?? [];
        usersMap = new Map(users.map((u) => [u.id, u]));
      } catch (error) {
        console.error("Failed to fetch revision creators via InternalClient:", error);
      }
    }

    const withDisplay: ProblemVersionRevisionWithDisplay[] = contents.map((v) => {
      const user = usersMap.get(v.createdBy);
      let title = "";
      try {
        const parsed = JSON.parse(v.snapshot);
        title = parsed.title ?? "";
      } catch {
        // snapshot parsing failed, leave title empty
      }
      return {
        ...v,
        title,
        createdByDisplay: formatCreator(user, v.createdBy),
        createdByProfilePictureUrl: user?.profilePictureUrl ?? null,
      };
    });

    return { data: withDisplay, meta };
  } catch (error) {
    console.error(`Error fetching revisions for ${versionId}:`, error);
    return { data: null, error };
  }
}
