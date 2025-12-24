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