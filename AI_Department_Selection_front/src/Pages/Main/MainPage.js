import React, { useState } from 'react';
import VoiceRecorder from '../../components/VoiceRecorder';
import TextSymptomInput from '../../components/TextSymptomInput';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

const MainPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeInput, setActiveInput] = useState(null); // null, 'voice', 'text'

  const navigate = useNavigate();

  const analyzeSymptom = async (symptomText) => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.post(`${API_BASE_URL}/analyze-symptom`, { symptom: symptomText });
      const { department, reason } = res.data;

      if (department === "Error") {
        alert("죄송합니다. 증상으로 인식할 수 없습니다. 다시 시도해주세요.");
        return;
      }

      // 병원 정보
      // 위치 권한 요청 
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // 위도 경도 위치 
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // 위도 경도 위치를 스프링에 전달
            const response = await axios.get(`${API_BASE_URL}/search-hospitals`, {
              params: { department, lat, lng }
            });

            navigate('/map', {
              state: {
                symptom: symptomText,
                department,
                reason,
                recommendedHospitals: response.data,
                userLocation: { lat, lng }
              }
            });
          },
          async () => {
            const response = await axios.get(`${API_BASE_URL}/search-hospitals`, {
              params: { department, lat: 37.5665, lng: 126.9780 }
            });
            navigate('/map', {
              state: {
                symptom: symptomText,
                department,
                reason,
                recommendedHospitals: response.data,
                userLocation: { lat: 37.5665, lng: 126.9780 }
              }
            });
          }
        );
      }
    } catch (e) {
      console.error(e);
      setError('증상 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setActiveInput(null); // 분석 끝나면 초기상태로 복귀
    }
  };

  return (
    <div className="main-container">
      <header className="header">
        <div className="logo-wrap">
          <img src="/images/logo.PNG" alt="logo" />
          <span className="logo-title">AI메디가이드</span>
        </div>
        <p className="subtitle">AI 기반 증상 분석 + 위치 기반 병원 추천</p>
        <div className="ad-banner">
          <img src="/images/test1.jpg" alt="프로젝트 광고" />
        </div>
      </header>

      <section className="green-border">
        <section className="guide">
          <p className="guide-title">🩺 증상을 말하거나 입력해주세요</p>
          <p className="guide-example">예: “머리가 아파요”, “열이 나고 기침이 있어요”</p>
        </section>

        <section className="button-group">
          { (activeInput === null || activeInput === "voice") && (
            <VoiceRecorder
              activeInput={activeInput}
              onActivate={(value) => setActiveInput(value ?? null)}
              onTranscript={analyzeSymptom}
            />
          )}
          { (activeInput === null || activeInput === "text") && (
            <TextSymptomInput
              activeInput={activeInput}
              onActivate={(value) => setActiveInput(value ?? null)}
              onSubmit={analyzeSymptom}
            />
          )}
        </section>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>AI가 증상을 분석 중입니다...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <section className="inner-border">
          <h3>💡 팁</h3>
          <ul>
            <li>조용한 환경에서 말해주세요</li>
            <li>명확하고 구체적으로 증상을 설명해주세요</li>
            <li>자세히 입력할수록 분석 정확도가 올라갑니다.</li>
          </ul>
        </section>
      </section>

      <footer className="footer">
        ⚠️ 본 서비스는 참고용이며, 의사 진료를 대체하지 않습니다.
      </footer>
    </div>
  );
};

export default MainPage;
