import httpx
from fastapi import HTTPException

class KakaoService:
    BASE_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send"

    async def send_text_to_me(self, access_token: str, message: str):
        """
        Sends a simple text message to the owner of the access_token (The Announcer).
        Uses the 'Text' template of KakaoTalk.
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        # Kakao 'Text' Template JSON
        # We wrap the message in a JSON object string as required by the 'template_object' param
        import json
        template_object = json.dumps({
            "object_type": "text",
            "text": message,
            "link": {
                "web_url": "https://football-club-beta.vercel.app/dashboard",
                "mobile_web_url": "https://football-club-beta.vercel.app/dashboard"
            },
            "button_title": "관리자 페이지 이동"
        })

        data = {"template_object": template_object}        

        async with httpx.AsyncClient() as client:
            response = await client.post(self.BASE_URL, headers=headers, data=data)
            
            # 👇 ADD THIS DEBUG PRINT
            if response.status_code != 200:
                print(f"🔥 KAKAO ERROR: {response.status_code}")
                print(f"🔥 BODY: {response.text}")  # This is the smoking gun!
                
                # Let's pass the real error back to the API response so you see it in Swagger
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Kakao Error: {response.text}"
                )
            
            return response.json()