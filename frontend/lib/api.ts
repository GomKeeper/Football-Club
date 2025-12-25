// Define the shape of the Member we expect from backend
export interface Member {
    id: number;
    kakao_id: string;
    name: string;
    avatar_url?: string;
    roles: string[];
    status: 'PENDING' | 'ACTIVE' | 'REJECTED'; // Changed to Uppercase to match backend
}

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  export async function syncUserWithBackend(supabaseUser: any) {
    if (!supabaseUser) return null;
  
    // 1. Extract useful info from Supabase (Kakao) data
    const { user_metadata, identities } = supabaseUser;
    
    // Depending on provider, the ID might be in different places. 
    // For Kakao via Supabase, identities[0].id is usually the safe bet for the unique Provider ID.
    const kakaoId = identities?.[0]?.id || supabaseUser.id; 
  
    const payload = {
        kakao_id: String(kakaoId),
        name: user_metadata.full_name || user_metadata.name || "Unknown Player", // Kakao sometimes puts name in different fields
        avatar_url: user_metadata.avatar_url || "",
        // 👇 Update this line to handle missing emails gracefully
        email: user_metadata.email || `no-email-${kakaoId}@placeholder.com`, 
        roles: ["VIEWER"],
        status: 'PENDING'
      };
  
    try {
      // 2. POST to your Railway Backend
      const response = await fetch(`${API_URL}/members/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        // If error is "400: Member already exists", that's actually GOOD. 
        // It means they are logging in again. We should just fetch them.
        const errorData = await response.json();
        if (response.status === 400 && errorData.detail?.includes("exists")) {
          console.log("User already exists in backend. Fetching details...");
          // Use the new endpoint we made earlier to fetch by Kakao ID? 
          // Or strictly strictly speaking, we can just return the payload for now.
          // Ideally: You would implement GET /members?kakao_id=... but for now let's just proceed.
          return payload; 
        }
        throw new Error("Failed to sync user to backend");
      }
  
      const newMember = await response.json();
      console.log("✅ Sync Success: Member created in Railway DB", newMember);
      return newMember;
    } catch (error) {
      console.error("❌ Sync Error:", error);
      return null;
    }
  }

  export interface MatchTemplate {
    id: number;
    club_id: number;
    name: string;
    description?: string;
    day_of_week: number; // 0=Mon, 6=Sun
    start_time: string;  // "11:00:00" (UTC)
    duration_minutes: number;
    location: string;
    polling_start_hours_before: number;
    soft_deadline_hours_before: number;
    hard_deadline_hours_before: number;
    min_participants: number;
    max_participants: number;
  }

  export async function getMatchTemplates(clubId: number) {
    const response = await fetch(`${API_URL}/match-templates/club/${clubId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch templates");
    }
  
    return response.json() as Promise<MatchTemplate[]>;
  }

  export interface Match {
    id: number;
    name: string;
    start_time: string; // ISO String (UTC)
    duration_minutes: number;
    status: 'RECRUITING' | 'CLOSED' | 'CANCELLED' | 'FINISHED';
    description?: string;
    location: string;
    min_participants: number;
    max_participants: number;
    polling_start_at: string; // ISO String (UTC)
    soft_deadline_at: string; // ISO String (UTC)
    hard_deadline_at: string; // ISO String (UTC)
    club_id: number;
  }

  export async function generateMatch(templateId: number, matchDate: string) {
    // matchDate format should be "YYYY-MM-DD"
    const response = await fetch(`${API_URL}/matches/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId,
        match_date: matchDate,
      }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to generate the match");
    }
  
    return response.json() as Promise<Match>;
  }

  export async function getUpcomingMatches(clubId: number) {
    const response = await fetch(`${API_URL}/matches/club/${clubId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }
  
    return response.json() as Promise<Match[]>;
  }

  export interface ManualMatchPayload {
    club_id: number;
    name: string;
    start_time: string; // ISO String (UTC)
    location: string;
    description?: string;
    duration_minutes: number;
    polling_start_at?: string; // ISO String (UTC)
    soft_deadline_at?: string; // ISO String (UTC)
    hard_deadline_at?: string; // ISO String (UTC)
    min_participants: number;
    max_participants: number;
  }
  
  export async function createManualMatch(payload: ManualMatchPayload) {
    const response = await fetch(`${API_URL}/matches/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      throw new Error("Failed to create manual match");
    }
  
    return response.json() as Promise<Match>;
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
  
  export async function updateMatch(matchId: number, payload: MatchUpdatePayload) {
    const response = await fetch(`${API_URL}/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update match");
    return response.json();
  }

  export async function deleteMatch(matchId: number) {
    const response = await fetch(`${API_URL}/matches/${matchId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete match");
    return true;
  }