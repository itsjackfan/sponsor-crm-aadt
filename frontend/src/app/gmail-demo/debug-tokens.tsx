// Temporary component to display OAuth tokens
// Add this to your Gmail demo page temporarily to extract tokens

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function DebugTokens() {
  const [tokens, setTokens] = useState<any>(null)
  
  const getTokens = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    const tokenData = {
      access_token: session?.provider_token,
      refresh_token: session?.provider_refresh_token,
      expires_at: session?.expires_at,
      user_email: session?.user?.email
    }
    
    setTokens(tokenData)
    console.log('OAuth Tokens:', tokenData)
  }
  
  return (
    <div className="glass-card p-6 mb-8 border border-yellow-500">
      <h3 className="text-lg font-semibold mb-4 text-yellow-600">
        🔧 Debug: OAuth Tokens (Remove after getting tokens)
      </h3>
      
      <button 
        onClick={getTokens}
        className="bg-yellow-500 text-white px-4 py-2 rounded mb-4"
      >
        Extract OAuth Tokens
      </button>
      
      {tokens && (
        <div className="bg-gray-100 p-4 rounded text-sm font-mono">
          <p><strong>Access Token:</strong> {tokens.access_token?.substring(0, 50)}...</p>
          <p><strong>Refresh Token:</strong> {tokens.refresh_token}</p>
          <p><strong>User Email:</strong> {tokens.user_email}</p>
          <p><strong>Expires At:</strong> {tokens.expires_at}</p>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="font-semibold text-blue-800">Copy to .env file:</p>
            <pre className="text-xs mt-2">
{`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}