import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list`;
  
  return NextResponse.json({ authUrl });
}