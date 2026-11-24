export type Role = "student" | "counselor" | "principal" | "admin";
export type Status = "pending_consent" | "active" | "rejected" | "deactivated";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  birth_date: string | null;
  class_level: number | null;
  class_name: string | null;
  school_id: string | null;
  status: Status;
  verified: boolean;
  parent_name: string | null;
  parent_contact: string | null;
  deletion_requested_at: string | null;
  created_at: string;
};

export type School = { id: string; name: string; city: string; type: string; invite_code: string };

export type CareerItem = {
  id: string;
  kind: "major" | "profession" | "scholarship";
  name: string;
  category: string;
  description: string;
  riasec: string;
  aptitudes: string[];
  work_values: string[];
  skills: string[];
  related: string[];
  source: string;
};

export type ResultRow = { id: string; assessment_key: string; scores: Record<string, number>; completed_at: string };

export type RoadmapRec = { name: string; match: number; reason: string; category: string };
export type RoadmapStep = { id: string; when: string; title: string; detail: string; done: boolean };
export type RoadmapData = {
  generated_at: string;
  basis: string[];
  profile_status: "sementara" | "lengkap";
  majors: RoadmapRec[];
  professions: RoadmapRec[];
  skills: string[];
  steps: RoadmapStep[];
  limitation?: string;
};
