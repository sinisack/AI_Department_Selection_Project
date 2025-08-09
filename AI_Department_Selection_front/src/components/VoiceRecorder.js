import React, { useState, useEffect, useRef } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onTranscript, onActivate, activeInput }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; // 한국어 설정
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript; // 인식된 텍스트를 GPT로 전송
      onTranscript(result);
      setIsRecording(false);
      if (onActivate) onActivate(null);
    };

    recognition.onerror = (e) => {
      console.error("음성인식 오류:", e);
      alert("음성 인식 오류가 발생했습니다.");
      setIsRecording(false);
      if (onActivate) onActivate(null);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [onTranscript, onActivate]);

  useEffect(() => {
    if (activeInput === "voice" && recognitionRef.current && !isRecording) {
      recognitionRef.current.start();
    }
  }, [activeInput, isRecording]);

  const handleClick = () => {
    if (!isSupported) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      recognitionRef.current?.stop();
      if (onActivate) onActivate(null);
    } else {
      if (onActivate) onActivate("voice");
    }
  };

  return (
    <div
      className={
        `voice-recorder-container ${!isRecording ? "voice-margin-right" : ""}`
      }
    >
      <button
        onClick={handleClick}
        className="image-record-button"
        aria-label="증상 말하기"
      >
        <img src="/images/Voice.PNG" alt="증상 말하기" className="voice-image" />
      </button>
      {isRecording && (
        <div className="recording-status">
          🎙️ 음성을 듣는 중입니다...
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
