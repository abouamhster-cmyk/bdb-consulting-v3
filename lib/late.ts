// lib/late.ts
interface LatePost {
  content: string;
  platforms: Array<{
    platform: 'linkedin' | 'instagram' | 'facebook' | 'twitter';
    accountId: string;
  }>;
  scheduledFor?: string;
  media?: string[];
}

export class LateClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.LATE_API_URL || 'https://api.getlate.dev';
    this.apiKey = process.env.LATE_API_KEY || '';
  }

  async createPost(post: LatePost) {
    const response = await fetch(`${this.apiUrl}/api/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        content: post.content,
        platforms: post.platforms,
        scheduledFor: post.scheduledFor,
        media: post.media
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Late API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }

  async getAccounts() {
    const response = await fetch(`${this.apiUrl}/api/v1/accounts`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }
}

export const late = new LateClient();