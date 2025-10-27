# 📌 프로젝트 환경 및 API 키 설정 가이드

#자연어 기반 증상 입력을 활용한 진료과 추천 시스템 -  AI 메디가이드 

## ⚙️ Version
- **Java**: 17  
- **Gradle**: v8.14.2  
- **Spring Boot**: v3.5.3  
- **Spring Dependency Management Plugin**: v1.1.7  
- **Node.js**: v22.14.0  

---

## 🖥 Backend
**파일 경로**: `application.properties`
- OpenAI API 키 삽입  
- Kakao API 키 (**REST API 키**) 삽입  
- Google API 키 삽입  

---

## 💻 Frontend
**파일 경로**: `.env`  
- Kakao API 키 (**REST API 키**) 삽입  
- Google API 키 삽입  

**파일 경로**: `public/index.html`  
- Kakao API 키 (**JavaScript 키**) 삽입  

---

## 🔑 API 키 발급 방법

### 1️⃣ 카카오 (Kakao Developers) API 키 발급
카카오맵, 로컬 검색, 로그인 등 **카카오 API** 사용 시 필요  

**발급 방법**
1. [카카오 개발자 사이트](https://developers.kakao.com) 접속  
   - 카카오 계정으로 로그인
2. **내 애플리케이션** → **애플리케이션 추가** 클릭  
   - 앱 이름, 회사명(임의) 입력 후 생성
3. 생성된 앱 접속 → **앱 키** 확인  
   - **JavaScript 키** → 브라우저에서 지도 띄울 때 사용  
   - **REST API 키** → 서버에서 API 호출 시 사용
4. (지도, 검색 API 사용 시) **플랫폼 등록**  
   - 앱 설정 → 플랫폼 → Web → 사이트 도메인 등록  
     예:  
     ```
     http://localhost:3000
     https://내도메인.com
     ```
5. 키 복사 후 코드에 적용

---

### 2️⃣ OpenAI API 키 발급
ChatGPT API, GPT 모델 호출 등 OpenAI 서비스 사용 시 필요  

**발급 방법**
1. [OpenAI 플랫폼](https://platform.openai.com) 접속 → 로그인 (또는 가입)
2. 상단 **Personal** → **View API keys** 클릭
3. **Create new secret key** 버튼 클릭 → 이름 설정 후 생성
4. 발급된 키 복사 (**sk-** 로 시작)  
   ⚠️ 발급 직후만 확인 가능하므로 안전한 곳에 저장 (`.env` 등)
5. 코드에 적용

---

### 3️⃣ Google Cloud Console API 키 발급
Google Places(영업시간), Directions(경로), Maps API 등 사용 시 필요  

**발급 방법**
1. [Google Cloud Console](https://console.cloud.google.com) 접속  
   - Google 계정 로그인
2. 상단 **프로젝트 선택** → **새 프로젝트 만들기**
3. 결제 계정 연결 (지도 API는 필수, 무료 크레딧 제공)
4. **API 사용 설정**  
   - 메뉴 → **API 및 서비스** → **라이브러리**  
   - 검색 후 **Places API**, **Directions API** 사용 설정
5. **API 키 생성**  
   - 메뉴 → **API 및 서비스** → **사용자 인증 정보**  
   - **사용자 인증 정보 만들기** → **API 키**  
   - 팝업으로 뜬 키 복사
