export interface Judge {
  id: number;
  name: string;
  systemPrompt: string;
  model: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateJudgeInput {
  name: string;
  systemPrompt: string;
  model: string;
  active?: boolean;
}

export interface UpdateJudgeInput {
  name?: string;
  systemPrompt?: string;
  model?: string;
  active?: boolean;
}

export interface JudgeRow {
  id: number;
  name: string;
  system_prompt: string;
  model: string;
  active: number;
  created_at: number;
  updated_at: number;
}
