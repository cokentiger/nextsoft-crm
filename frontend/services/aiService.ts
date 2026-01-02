// frontend/services/aiService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"; // URL Backend Python

export interface AIContext {
  customer_name: string;
  deal_title: string;
  [key: string]: any; 
}

export interface AIResponse {
  success?: boolean;
  content?: string;
  error?: string;
}

export const aiService = {
  async generateContent(templateCode: string, context: AIContext): Promise<AIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_code: templateCode,
          data_context: context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Lỗi kết nối Server AI");
      }

      return data; 
    } catch (error: any) {
      console.error("AI Service Error:", error);
      return { 
        success: false, 
        error: error.message || "Không thể kết nối tới AI Backend." 
      };
    }
  },
};