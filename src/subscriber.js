import 'dotenv/config';
import mqtt from 'mqtt';

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

// CLI 인자로 토픽 오버라이드 가능: node src/subscriber.js --topic sensor/#
const args = process.argv.slice(2);
const topicArgIdx = args.indexOf('--topic');
const topic = topicArgIdx !== -1 ? args[topicArgIdx + 1] : (process.env.MQTT_TOPIC || 'sensor/temperature');

const clientId = `mqtt-test-sub-${Math.random().toString(36).slice(2, 6)}`;

// 타임스탬프 포맷 헬퍼
function timestamp() {
  return new Date().toLocaleString('ko-KR', { hour12: false });
}

console.log(`[${timestamp()}] 서브스크라이버 시작`);
console.log(`  브로커: ${brokerUrl}`);
console.log(`  토픽: ${topic}`);
console.log(`  클라이언트 ID: ${clientId}`);
console.log('');

const client = mqtt.connect(brokerUrl, { clientId });

client.on('connect', () => {
  console.log(`[${timestamp()}] 브로커 연결 성공`);
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[${timestamp()}] 구독 실패:`, err.message);
    } else {
      console.log(`[${timestamp()}] 토픽 구독 완료: ${topic}`);
      console.log(`[${timestamp()}] 메시지 대기 중...\n`);
    }
  });
});

client.on('message', (receivedTopic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    console.log(`[${timestamp()}] 수신 ← ${receivedTopic}`);
    console.log(`  센서ID: ${data.sensorId}`);
    console.log(`  온도: ${data.temperature}°C | 습도: ${data.humidity}%`);
    console.log(`  시퀀스: #${data.sequence}`);
    console.log('');
  } catch {
    // JSON이 아닌 메시지도 출력
    console.log(`[${timestamp()}] 수신 ← ${receivedTopic}: ${payload.toString()}\n`);
  }
});

client.on('reconnect', () => {
  console.log(`[${timestamp()}] 브로커 재연결 시도...`);
});

client.on('offline', () => {
  console.log(`[${timestamp()}] 오프라인 상태`);
});

client.on('error', (err) => {
  console.error(`[${timestamp()}] 에러:`, err.message);
});

// Graceful Shutdown
function shutdown() {
  console.log(`\n[${timestamp()}] 서브스크라이버 종료 중...`);
  client.unsubscribe(topic, () => {
    client.end(false, () => {
      console.log(`[${timestamp()}] 서브스크라이버 종료 완료`);
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
