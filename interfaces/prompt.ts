type PromptType = {
  id: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  createdAtMs: number;
  hidden?: boolean;
};

export default PromptType;
