export interface CretivraModel {
  id: string;
  display_name: string;
  description: string;
  provider: string;
  underlying_model: string;
  capabilities: string[];
  context_length: number;
  enabled: boolean;
  version: string;
  icon?: string;
  category: string;
  is_available: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  path: string;
  size: number;
  extracted_text?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_status?: string | null;
  created_at?: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  model_id: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  messages?: Message[];
}

export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previous_7_days: Conversation[];
  older: Conversation[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  backend: {
    status: string;
    name: string;
    version: string;
  };
  ollama: {
    status: string;
    url: string;
    installed_models_count: number;
    mock_mode: boolean;
  };
  database: {
    status: string;
  };
  models: {
    total_registered: number;
    available_count: number;
  };
}

export interface SystemSettings {
  ollama_base_url: string;
  default_model: string;
  temperature: number;
  max_context_messages: number;
  max_output_tokens: number;
  system_prompt: string;
  theme: 'dark' | 'light' | 'system';
  max_upload_size_mb: number;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';

export interface ImageGenerationRequest {
  prompt: string;
  aspect_ratio?: AspectRatio;
  width?: number;
  height?: number;
  model?: string;
  style?: string;
  enhance?: boolean;
  seed?: number;
  negative_prompt?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  prompt: string;
  enhanced_prompt: string;
  image_url: string;
  model: string;
  model_id: string;
  aspect_ratio: string;
  width: number;
  height: number;
  seed: number;
  style?: string;
}

export interface ImageModelCatalogItem {
  id: string;
  engine: string;
  name: string;
  description: string;
  badge: string;
  is_default: boolean;
}

export interface ImageModelCatalog {
  models: ImageModelCatalogItem[];
  aspect_ratios: string[];
  styles: string[];
}


