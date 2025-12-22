// Define the shape of the window object
declare global {
  interface Window {
    Kakao: any;
  }
}

export const initKakao = () => {
  if (typeof window !== "undefined" && window.Kakao) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID);
    }
  }
};
