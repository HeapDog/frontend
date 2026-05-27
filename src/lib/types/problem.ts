export interface Tag {
  id: string
  name: string
  description: string
}

export interface Language {
  id: string
  name: string
  version: string
}

export interface ProblemLibrary {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type ProblemStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED"

export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD"

export interface ProblemEntity {
  id: string
  slug: string
  libraryId: string
  publishedVersionId: string | null
  createdAt: string
  createdBy: string
}

export interface ProblemVersion {
  id: string
  title: string
  statement: string | null
  difficulty?: ProblemDifficulty
  tags: Tag[]
  languages: Language[]
  status: ProblemStatus
  number: number
  createdAt?: string
  createdBy?: string
  lastUpdatedAt?: string
  lastUpdatedBy?: string
}

/**
 * Shape returned by the Spring endpoint
 * GET /organizations/{slug}/problem-libraries/{libraryId}/problems
 */
export interface ProblemWithLatestVersion {
  problem: ProblemEntity
  version: ProblemVersion
}

export type RevisionType = "INSERT" | "UPDATE" | "DELETE"

export interface ProblemVersionRevision {
  id: string
  rev: number
  snapshot: string
  comment: string | null
  createdAt: string
  createdBy: string
}
