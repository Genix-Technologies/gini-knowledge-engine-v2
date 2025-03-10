export interface IThirdOAIModel {
  available: boolean;
  create_date: string;
  create_time: number;
  fid: string;
  id: number;
  llm_name: string;
  max_tokens: number;
  model_type: string;
  status: string;
  tags: string;
  update_date: string;
  update_time: number;
}

export type IThirdOAIModelCollection = Record<string, IThirdOAIModel[]>;

export interface IFactory {
  create_date: string;
  create_time: number;
  logo: string;
  name: string;
  status: string;
  tags: string;
  update_date: string;
  update_time: number;
}

export interface IMyLlmValue {
  llm: Llm[];
  tags: string;
  api_key:string;
  api_base:string;
}

export interface IConfiguredLlmValue {
  llm: ConfLLM[];
  tags: string;
}
export interface ConfLLM {
  name: string;
  type: string;
  used_token: number;
}

export interface Llm {
  name: string;
  type: string;
  used_token: number;
}
