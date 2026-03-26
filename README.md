# mqtt-test

MQTT 프로토콜 학습 및 연결 테스트를 위한 프로젝트입니다.

## 구성

| 프로그램 | 파일 | 설명 |
|----------|------|------|
| Broker | `src/broker.js` | Aedes 기반 MQTT 브로커 (포트 1883) |
| Publisher | `src/publisher.js` | 센서 데이터를 주기적으로 발행 |
| Subscriber | `src/subscriber.js` | 토픽을 구독하여 메시지 수신 |

## 설치

```bash
npm install
```

## 실행

3개의 터미널에서 순서대로 실행합니다.

```bash
# 터미널 1 - 브로커
npm run broker

# 터미널 2 - 서브스크라이버
npm run sub

# 터미널 3 - 퍼블리셔 (기본 1분 간격)
npm run pub
```

### 옵션

```bash
# 발행 주기 변경 (분 단위)
npm run pub -- --interval 5     # 5분 간격
npm run pub -- --interval 0.1   # 6초 간격 (테스트용)

# 구독 토픽 변경
npm run sub -- --topic sensor/#        # 와일드카드 구독
npm run sub -- --topic sensor/+        # 단일 레벨 와일드카드
```

## 환경변수

`.env.example`을 `.env`로 복사하여 설정을 변경할 수 있습니다.

```bash
cp .env.example .env
```

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MQTT_BROKER_PORT` | 1883 | 브로커 포트 |
| `MQTT_BROKER_URL` | mqtt://localhost:1883 | 클라이언트 연결 URL |
| `MQTT_TOPIC` | sensor/temperature | 발행/구독 토픽 |
| `MQTT_PUBLISH_INTERVAL_MIN` | 1 | 발행 주기 (분) |

## 메시지 형식

```json
{
  "sensorId": "sensor-001",
  "temperature": 23.5,
  "humidity": 45.2,
  "timestamp": "2026-03-26T12:00:00.000Z",
  "sequence": 1
}
```
