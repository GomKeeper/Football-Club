// =============================================================================
// 1. CONFIGURATION & HELPERS
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// =============================================================================
// 2. TYPE DEFINITIONS (INTERFACES)
// =============================================================================

// --- Auth & Member Types ---
export interface BackendTokenResponse {
  access_token: string;
  token_type: string;
}

export interface KakaoLoginPayload {
  kakao_id: string;
  name: string;
  email: string;
}

export interface Member {
  id: number;
  kakao_id: string;
  name: string;
  picture_url?: string;
  phone?: string;
  birth_year?: number;
  back_number?: number;
  positions?: string[];
  roles: string[];
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

// --- Match Types ---
export interface MatchTemplate {
  id: number;
  club_id: number;
  name: string;
  description?: string;
  day_of_week: number; // 0=Mon, 6=Sun
  start_time: string; // "11:00:00"
  duration_minutes: number;
  location: string;
  polling_start_hours_before: number;
  soft_deadline_hours_before: number;
  hard_deadline_hours_before: number;
  min_participants: number;
  max_participants: number;
}

export interface Participation {
  id: number;
  match_id: number;
  member_id: number;
  status: 'ATTENDING' | 'ABSENT' | 'PENDING';
  comment?: string;
  // Optional: If you need member details in the roster view
  member?: {
    id: number;
    name: string;
    picture_url?: string;
  };
}

export interface Match {
  id: number;
  club_id: number;
  name: string;
  location: string;
  description?: string;
  status: 'RECRUITING' | 'CLOSED' | 'CANCELLED' | 'FINISHED';
  
  // Times (ISO Strings)
  start_time: string; 
  end_time?: string;
  polling_start_at: string;
  soft_deadline_at: string;
  hard_deadline_at: string;
  duration_minutes: number;
  
  min_participants: number;
  max_participants: number;

  // Relationships
  participations?: Participation[];
}

// --- Payloads (Inputs) ---
export interface ManualMatchPayload {
  club_id: number;
  name: string;
  start_time: string; // ISO String
  location: string;
  description?: string;
  duration_minutes: number;
  polling_start_at?: string;
  soft_deadline_at?: string;
  hard_deadline_at?: string;
  min_participants: number;
  max_participants: number;
}

export interface MatchUpdatePayload {
  name?: string;
  location?: string;
  start_time?: string;
  status?: string;
  description?: string;
  polling_start_at?: string;
  soft_deadline_at?: string | null;
  hard_deadline_at?: string;
  min_participants?: number;
  max_participants?: number;
}

export interface AdminVoteUpdate {
  match_id: number;
  member_id: number;
  status: 'ATTENDING' | 'ABSENT' | 'PENDING';
  comment?: string;
}

export interface MemberProfileUpdatePayload {
  phone?: string;
  birth_year?: number;
  back_number?: number;
  positions?: string[]; // e.g. ["ST", "CDM"]
  picture_url?: string;  
}

// =============================================================================
// 3. API FUNCTIONS
// =============================================================================

// -----------------------------------------------------------------------------
// 🔐 AUTH & MEMBER
// -----------------------------------------------------------------------------

export async function loginWithBackend(payload: KakaoLoginPayload) {
  const response = await fetch(`${API_URL}/auth/login/kakao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Backend login failed');

  const data: BackendTokenResponse = await response.json();
  localStorage.setItem('token', data.access_token);
  return data.access_token;
}

export async function getMe() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const response = await fetch(`${API_URL}/members/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    localStorage.removeItem('token');
    return null;
  }

  return response.json() as Promise<Member>;
}

export async function syncUserWithBackend(supabaseUser: any) {
  if (!supabaseUser) return null;

  const { user_metadata, identities } = supabaseUser;
  const kakaoId = identities?.[0]?.id || supabaseUser.id;

  const payload = {
    kakao_id: String(kakaoId),
    name: user_metadata.full_name || user_metadata.name || 'Unknown Player',
    picture_url: user_metadata.picture_url || '',
    email: user_metadata.email || `no-email-${kakaoId}@placeholder.com`,
    roles: ['VIEWER'],
    status: 'PENDING',
  };

  try {
    const response = await fetch(`${API_URL}/members/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 400 && errorData.detail?.includes('exists')) {
        console.log('User already exists. Returning payload.');
        return payload;
      }
      throw new Error('Failed to sync user');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Sync Error:', error);
    return null;
  }
}

export async function updateMyProfile(data: MemberProfileUpdatePayload) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/members/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update member profile');
  }
  return response.json();
}

// -----------------------------------------------------------------------------
// 📋 MATCH TEMPLATES
// -----------------------------------------------------------------------------

export async function getMatchTemplates(clubId: number) {
  const response = await fetch(`${API_URL}/match-templates/club/${clubId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json() as Promise<MatchTemplate[]>;
}

// -----------------------------------------------------------------------------
// ⚽ MATCH MANAGEMENT
// -----------------------------------------------------------------------------

export async function getUpcomingMatches(clubId: number) {
  const response = await fetch(`${API_URL}/matches/club/${clubId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch matches');
  return response.json() as Promise<Match[]>;
}

export async function generateMatch(templateId: number, matchDate: string) {
  const response = await fetch(`${API_URL}/matches/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader() 
    },
    body: JSON.stringify({ template_id: templateId, match_date: matchDate }),
  });
  if (!response.ok) throw new Error('Failed to generate match');
  return response.json() as Promise<Match>;
}

export async function createManualMatch(payload: ManualMatchPayload) {
  const response = await fetch(`${API_URL}/matches/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create manual match');
  return response.json() as Promise<Match>;
}

export async function createMatch(payload: ManualMatchPayload) {
  // Alias for createManualMatch to keep naming consistent if used elsewhere
  return createManualMatch(payload);
}

export async function updateMatch(matchId: number, payload: MatchUpdatePayload) {
  const response = await fetch(`${API_URL}/matches/${matchId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update match');
  return response.json();
}

export async function deleteMatch(matchId: number) {
  const response = await fetch(`${API_URL}/matches/${matchId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to delete match');
  return true;
}

// -----------------------------------------------------------------------------
// 🗳️ PARTICIPATION & VOTING
// -----------------------------------------------------------------------------

export async function getMyParticipations() {
  const response = await fetch(`${API_URL}/participations/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch participations');
  return response.json() as Promise<Participation[]>;
}

export async function voteMatch(
  matchId: number,
  status: 'ATTENDING' | 'ABSENT' | 'PENDING',
  comment?: string,
) {
  const response = await fetch(`${API_URL}/participations/matches/${matchId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status, comment }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '투표 실패');
  }
  return response.json() as Promise<Participation>;
}

// 👇 NEW: Admin Override
export async function adminOverrideVote(data: AdminVoteUpdate) {
  const response = await fetch(`${API_URL}/participations/admin/override`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to override vote');
  return response.json();
}