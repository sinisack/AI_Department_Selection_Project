// src/components/TransitRoute.js
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

const TransitRoute = forwardRef((props, ref) => {
  const transitPolylinesRef = useRef([]);
  const transitMarkersRef = useRef([]);

  // 두 지점 간의 거리를 계산하는 함수 (하버사인 공식)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // km
  };

  // Google Polyline 디코딩 함수
  const decodePolyline = (encoded) => {
    const coordinates = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return coordinates;
  };

  // 도보 시간을 초에서 분으로 변환하는 함수
  const parseWalkingDuration = (duration) => {
    if (!duration) return 0;

    // duration이 객체인 경우 (예: {seconds: 300})
    if (typeof duration === 'object') {
      if (duration.seconds) {
        return Math.ceil(duration.seconds / 60);
      }
      if (duration.value) {
        return Math.ceil(duration.value / 60);
      }
    }

    // duration이 문자열인 경우 (예: "300s", "5 mins", "5분")
    if (typeof duration === 'string') {
      // "300s" 형태
      if (duration.endsWith('s')) {
        const seconds = parseInt(duration.replace('s', ''));
        return Math.ceil(seconds / 60);
      }
      // "5 mins" 형태
      if (duration.includes('min')) {
        const mins = parseInt(duration.match(/\d+/)?.[0] || '0');
        return mins;
      }
      // "5분" 형태
      if (duration.includes('분')) {
        const mins = parseInt(duration.match(/\d+/)?.[0] || '0');
        return mins;
      }
      // 숫자만 있는 경우 (초 단위로 가정)
      const numericValue = parseInt(duration);
      if (!isNaN(numericValue)) {
        return Math.ceil(numericValue / 60);
      }
    }

    // duration이 숫자인 경우 (초 단위로 가정)
    if (typeof duration === 'number') {
      return Math.ceil(duration / 60);
    }

    return 0;
  };

  // 정류소 마커 생성 함수
  const createTransitMarker = (map, location, stopName, type, step, stepIndex) => {
    const kakao = window.kakao;
    
    const iconSrc = type === 'departure' ? 
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="#4CAF50" stroke="white" stroke-width="3"/>
          <text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">승차</text>
        </svg>
      `) :
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="#f44336" stroke="white" stroke-width="3"/>
          <text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">하차</text>
        </svg>
      `);

    const imageSize = new kakao.maps.Size(28, 28);
    const imageOption = { offset: new kakao.maps.Point(14, 14) };
    const markerImage = new kakao.maps.MarkerImage(iconSrc, imageSize, imageOption);

    const marker = new kakao.maps.Marker({
      map: null, // 처음엔 숨김
      position: new kakao.maps.LatLng(location.lat, location.lng),
      image: markerImage,
      title: stopName
    });

    const modeIcon = step.mode === 'SUBWAY' ? '🚇' : 
                     step.mode === 'BUS' ? '🚌' : 
                     step.mode === 'TRAIN' ? '🚂' : '🚊';

    const infoContent = `
      <div style="padding: 12px; min-width: 220px; font-size: 13px; font-family: 'Malgun Gothic', sans-serif;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #333; display: flex; align-items: center;">
          ${modeIcon} 
          <span style="margin-left: 6px; color: ${step.lineColor};">${step.lineName || step.lineShort}</span>
        </div>
        <div style="margin-bottom: 6px; padding: 4px 8px; background-color: ${type === 'departure' ? '#e8f5e8' : '#ffebee'}; border-radius: 4px;">
          <strong>${type === 'departure' ? '🟢 승차 지점' : '🔴 하차 지점'}:</strong> ${stopName}
        </div>
        ${step.departureTime && type === 'departure' ? 
          `<div style="color: #666; margin-bottom: 4px;">⏰ 출발: ${step.departureTime}</div>` : ''}
        ${step.arrivalTime && type === 'arrival' ? 
          `<div style="color: #666; margin-bottom: 4px;">⏰ 도착: ${step.arrivalTime}</div>` : ''}
        ${step.stopCount ? 
          `<div style="color: #666; font-size: 12px;">🚏 총 ${step.stopCount}개 정거장 이동</div>` : ''}
        ${type === 'departure' ? 
          `<div style="color: #4CAF50; font-size: 12px; margin-top: 4px;">💡 여기서 탑승하세요!</div>` : 
          `<div style="color: #f44336; font-size: 12px; margin-top: 4px;">💡 여기서 하차하세요!</div>`}
      </div>
    `;

    const infoWindow = new kakao.maps.InfoWindow({
      content: infoContent,
      removable: true
    });

    kakao.maps.event.addListener(marker, 'click', () => {
      // 다른 정보창 닫기
      transitMarkersRef.current.forEach(m => {
        if (m.infoWindow && m !== marker) m.infoWindow.close();
      });
      // 현재 정보창 열기
      infoWindow.open(marker.getMap() || map, marker);
    });

    marker.infoWindow = infoWindow;
    return marker;
  };

  // 모든 대중교통 경로 지우기
  const clearAllTransitRoutes = () => {
    // 기존 정류소 마커들 제거
    transitMarkersRef.current.forEach(marker => {
      if (marker.infoWindow) marker.infoWindow.close();
      marker.setMap(null);
    });
    transitMarkersRef.current = [];

    // 기존 대중교통 경로들 제거
    transitPolylinesRef.current.forEach(polyline => {
      polyline.setMap(null);
    });
    transitPolylinesRef.current = [];
  };

  // 단계별 경로 그리기 함수
  const drawDetailedTransitRoute = (map, transitSteps, allSteps) => {
    if (!map || !window.kakao) return;

    clearAllTransitRoutes(); // 기존 경로 제거

    const kakao = window.kakao;
    const newPolylines = [];
    const newMarkers = [];

    allSteps.forEach((step, stepIndex) => {
      if (!step.polyline || !step.polyline.encodedPolyline) return;

      // 각 단계의 좌표 디코딩
      const decoded = decodePolyline(step.polyline.encodedPolyline);
      const kakaoPath = decoded.map(coord => 
        new kakao.maps.LatLng(coord.lat, coord.lng)
      );

      let strokeColor, strokeStyle, strokeWeight;

      // 단계별 경로 스타일 설정
      if (step.travelMode === 'WALK') {
        // 도보 구간 - 점선, 주황색
        strokeColor = '#FF6B35';
        strokeStyle = 'shortdot';
        strokeWeight = 4;
      } else if (step.transitDetails) {
        // 대중교통 구간 - 실선, 노선 색상
        strokeColor = step.transitDetails.transitLine?.color || '#4CAF50';
        strokeStyle = 'solid';
        strokeWeight = 5;
      } else {
        // 기타 구간 - 기본 스타일
        strokeColor = '#00C851';
        strokeStyle = 'solid';
        strokeWeight = 4;
      }

      // 경로 그리기
      const polyline = new kakao.maps.Polyline({
        map: map,
        path: kakaoPath,
        strokeWeight: strokeWeight,
        strokeColor: strokeColor,
        strokeOpacity: 0.8,
        strokeStyle: strokeStyle,
      });

      newPolylines.push(polyline);

      // 대중교통 구간의 정류소 마커 추가
      if (step.transitDetails) {
        const transit = step.transitDetails;
        
        // 출발 정류소 마커
        if (transit.stopDetails?.departureStop?.location?.latLng) {
          const departureMarker = createTransitMarker(
            map,
            {
              lat: transit.stopDetails.departureStop.location.latLng.latitude,
              lng: transit.stopDetails.departureStop.location.latLng.longitude
            },
            transit.stopDetails.departureStop.name,
            'departure',
            {
              mode: transit.transitLine?.vehicle?.type || 'TRANSIT',
              lineName: transit.transitLine?.name || '',
              lineShort: transit.transitLine?.nameShort || '',
              lineColor: transit.transitLine?.color || '#4CAF50',
              departureTime: transit.localizedValues?.departureTime?.time?.text || '',
              stopCount: transit.stopCount || 0
            },
            stepIndex
          );
          newMarkers.push(departureMarker);
        }

        // 도착 정류소 마커
        if (transit.stopDetails?.arrivalStop?.location?.latLng) {
          const arrivalMarker = createTransitMarker(
            map,
            {
              lat: transit.stopDetails.arrivalStop.location.latLng.latitude,
              lng: transit.stopDetails.arrivalStop.location.latLng.longitude
            },
            transit.stopDetails.arrivalStop.name,
            'arrival',
            {
              mode: transit.transitLine?.vehicle?.type || 'TRANSIT',
              lineName: transit.transitLine?.name || '',
              lineShort: transit.transitLine?.nameShort || '',
              lineColor: transit.transitLine?.color || '#4CAF50',
              arrivalTime: transit.localizedValues?.arrivalTime?.time?.text || '',
              stopCount: transit.stopCount || 0
            },
            stepIndex
          );
          newMarkers.push(arrivalMarker);
        }
      }
    });

    transitPolylinesRef.current = newPolylines;
    transitMarkersRef.current = newMarkers;
  };

  // 대중교통 
  useImperativeHandle(ref, () => ({
    searchAndDrawRoute: async (map, userLocation, hospital) => {
      if (!process.env.REACT_APP_GOOGLE_ROUTES_API_KEY) {
        console.log('Google Routes API 키가 설정되지 않았습니다.');
        return { success: false, error: 'API 키 없음' };
      }

      console.log('🚌 대중교통 경로 검색 시작:', { userLocation, hospital });
      console.log('🔑 API 키 존재:', !!process.env.REACT_APP_GOOGLE_ROUTES_API_KEY);

      try {
        const requestBody = {
          origin: {
            location: {
              latLng: {
                latitude: parseFloat(userLocation.lat),
                longitude: parseFloat(userLocation.lng)
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: parseFloat(hospital.lat),
                longitude: parseFloat(hospital.lng)
              }
            }
          },
          travelMode: "TRANSIT",
          transitPreferences: {
            routingPreference: "LESS_WALKING",
            allowedTravelModes: ["BUS", "SUBWAY", "TRAIN", "LIGHT_RAIL"]
          },
          departureTime: new Date().toISOString(),
          languageCode: "ko",
          units: "METRIC"
        };

        console.log('🚌 요청 데이터:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.REACT_APP_GOOGLE_ROUTES_API_KEY,
            'X-Goog-FieldMask': 'routes.legs.steps.transitDetails,routes.legs.steps.polyline,routes.legs.steps.startLocation,routes.legs.steps.endLocation,routes.legs.steps.travelMode,routes.legs.duration,routes.legs.distanceMeters'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('🚌 API 응답 상태:', response.status);
        console.log('🚌 API 응답 헤더:', response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🚌 API 오류 응답:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}\n응답: ${errorText}`);
        }

        const data = await response.json();
        console.log('🚌 API 응답 데이터:', data);

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const leg = route.legs[0];

          // 모든 단계 정보 수집 (도보 + 대중교통)
          const allSteps = leg.steps || [];
          const transitSteps = [];

          console.log('🚌 전체 단계 정보:', allSteps);

          allSteps.forEach(step => {
            if (step.transitDetails) {
              const transit = step.transitDetails;
              const stepData = {
                mode: transit.transitLine?.vehicle?.type || 'TRANSIT',
                lineName: transit.transitLine?.name || '',
                lineShort: transit.transitLine?.nameShort || '',
                lineColor: transit.transitLine?.color || '#4CAF50',
                departureStop: transit.stopDetails?.departureStop?.name || '',
                arrivalStop: transit.stopDetails?.arrivalStop?.name || '',
                departureTime: transit.localizedValues?.departureTime?.time?.text || '',
                arrivalTime: transit.localizedValues?.arrivalTime?.time?.text || '',
                stopCount: transit.stopCount || 0
              };
              transitSteps.push(stepData);
            }
          });

          const summary = transitSteps.map(step => {
            const mode = step.mode === 'SUBWAY' ? '지하철' : 
                         step.mode === 'BUS' ? '버스' : 
                         step.mode === 'TRAIN' ? '기차' : '대중교통';
            return `${mode} ${step.lineShort || step.lineName}`;
          }).join(' → ');

          // 도보 시간 계산 (거리 기반 추정)
          const walkingSteps = allSteps.filter(step => step.travelMode === 'WALK');
          console.log('🚶‍♂️ 도보 단계들:', walkingSteps);
          
          let totalWalkingMinutes = 0;
          
          // 각 도보 구간의 거리를 기반으로 시간 추정 (평균 보행 속도: 4km/h)
          walkingSteps.forEach((step, index) => {
            if (step.startLocation && step.endLocation) {
              const startLat = step.startLocation.latLng.latitude;
              const startLng = step.startLocation.latLng.longitude;
              const endLat = step.endLocation.latLng.latitude;
              const endLng = step.endLocation.latLng.longitude;
              
              // 하버사인 공식으로 거리 계산 (km)
              const distance = calculateDistance(startLat, startLng, endLat, endLng);
              // 보행 속도 4km/h로 시간 계산 (분)
              const walkingTime = Math.ceil((distance / 4) * 60);
              
              console.log(`🚶‍♂️ 도보 단계 ${index + 1}:`, {
                거리: `${distance.toFixed(2)}km`,
                추정시간: `${walkingTime}분`
              });
              
              totalWalkingMinutes += walkingTime;
            }
          });

          // 최소 1분은 보장 (도보 구간이 있다면)
          if (walkingSteps.length > 0 && totalWalkingMinutes === 0) {
            totalWalkingMinutes = Math.max(2, walkingSteps.length * 2); // 구간당 최소 2분
            console.log('🚶‍♂️ 도보 시간이 0분이어서 최소값으로 조정:', totalWalkingMinutes, '분');
          }

          console.log('🚶‍♂️ 총 도보 시간:', totalWalkingMinutes, '분');
          console.log('🚶‍♂️ 도보 구간 수:', walkingSteps.length);

          // 경로 그리기
          drawDetailedTransitRoute(map, transitSteps, allSteps);

          // 전체 경로 시간 파싱
          const totalDuration = parseWalkingDuration(leg.duration) || 0;

          return {
            success: true,
            allSteps: allSteps,
            distance: (leg.distanceMeters / 1000).toFixed(1),
            duration: totalDuration,
            transferCount: Math.max(0, transitSteps.length - 1),
            walkingTime: totalWalkingMinutes,
            summary: summary || '대중교통',
            steps: transitSteps,
            walkingSteps: walkingSteps.length
          };
        }

        return { success: false, error: '경로를 찾을 수 없습니다.' };
      } catch (error) {
        console.error('🚌 대중교통 경로 검색 실패:', error);
        
        // API 키 문제인지 확인
        if (error.message.includes('400')) {
          console.error('🚌 가능한 원인:');
          console.error('1. API 키가 잘못되었거나 비활성화됨');
          console.error('2. Routes API가 활성화되지 않음');
          console.error('3. 결제 정보가 설정되지 않음');
          console.error('4. API 사용량 한도 초과');
          
          return { 
            success: false, 
            error: 'Google Routes API 오류: API 키 또는 설정을 확인해주세요'
          };
        }
        
        return { 
          success: false, 
          error: error.message || '네트워크 오류'
        };
      }
    },

    showRoute: (map) => {
      transitPolylinesRef.current.forEach(polyline => {
        polyline.setMap(map);
      });
      transitMarkersRef.current.forEach(marker => {
        marker.setMap(map);
      });
    },

    hideRoute: () => {
      transitPolylinesRef.current.forEach(polyline => {
        polyline.setMap(null);
      });
      transitMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
    },

    clearRoute: () => {
      clearAllTransitRoutes();
    }
  }));

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
});

TransitRoute.displayName = 'TransitRoute';

export default TransitRoute;