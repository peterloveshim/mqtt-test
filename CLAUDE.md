# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

MQTT 프로토콜 학습 및 연결 테스트용 프로젝트. Aedes(Node.js 임베디드 브로커) + MQTT.js 클라이언트로 구성되며, 추후 Next.js + Supabase 프로젝트가 Subscriber로 연결하여 MQTT 통신을 테스트하기 위한 환경을 제공한다.

## 기술 스택

- **Runtime**: Node.js (ES Modules)
- **Broker**: Aedes — Node.js 임베디드 MQTT 브로커
- **Client**: MQTT.js — Publisher/Subscriber 클라이언트
- **환경변수**: dotenv

## 명령어

```bash
npm run broker              # MQTT 브로커 시작 (포트 1883)
npm run pub                 # 퍼블리셔 시작 (기본 1분 간격)
npm run pub -- --interval 5 # 5분 간격으로 발행
npm run sub                 # 서브스크라이버 시작
npm run sub -- --topic sensor/# # 와일드카드 토픽 구독
```

실행 순서: **broker → sub → pub** (각각 별도 터미널)

## 아키텍처

```
[Publisher] --발행--> [Aedes Broker :1883] --전달--> [Subscriber]
   (src/publisher.js)     (src/broker.js)        (src/subscriber.js)
```

- **broker.js**: Aedes 인스턴스 + TCP 서버. 모든 연결/구독/발행 이벤트를 타임스탬프와 함께 로깅. `$SYS/` 시스템 토픽은 필터링.
- **publisher.js**: 센서 데이터(온도/습도)를 JSON으로 주기 발행. 인터벌은 CLI `--interval`(분) > 환경변수 `MQTT_PUBLISH_INTERVAL_MIN` > 기본 1분 순으로 결정.
- **subscriber.js**: 토픽을 구독하여 수신 메시지를 포맷팅 출력. `--topic` CLI 인자로 토픽 오버라이드 가능.

## 메시지 형식

토픽: `sensor/temperature` (환경변수로 변경 가능)

```json
{
  "sensorId": "sensor-001",
  "temperature": 23.5,
  "humidity": 45.2,
  "timestamp": "2026-03-26T12:00:00.000Z",
  "sequence": 1
}
```

## 환경변수 (.env)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MQTT_BROKER_PORT` | 1883 | 브로커 TCP 포트 |
| `MQTT_BROKER_URL` | mqtt://localhost:1883 | 클라이언트 연결 URL |
| `MQTT_TOPIC` | sensor/temperature | 발행/구독 토픽 |
| `MQTT_PUBLISH_INTERVAL_MIN` | 1 | 발행 주기 (분) |

## 향후 확장 (Next.js Subscriber 연동)

브라우저에서 MQTT 연결 시 WebSocket이 필요하므로 broker.js에 WS 서버 추가 필요 (`ws` 패키지 + `http.createServer`). 추천 아키텍처:

```
Publisher → Aedes Broker → Next.js API Route(Subscriber) → Supabase DB → Supabase Realtime → 브라우저
```
