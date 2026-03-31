import 'dotenv/config';
import mqtt from 'mqtt';

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const topic = process.env.MQTT_TOPIC || 'sensor/temperature';

// 30~120초 사이 랜덤 딜레이(ms) 생성
function randomIntervalMs() {
  return (Math.floor(Math.random() * 91) + 30) * 1000;
}

const clientId = `mqtt-test-pub-${Math.random().toString(36).slice(2, 6)}`;

// 타임스탬프 포맷 헬퍼
function timestamp() {
  return new Date().toLocaleString('ko-KR', { hour12: false });
}

// 센서 데이터 생성
let sequence = 0;
function generateSensorData() {
  sequence++;
  return {
    sensorId: 'sensor-001',
    temperature: +(Math.random() * 15 + 20).toFixed(1),
    humidity: +(Math.random() * 40 + 30).toFixed(1),
    timestamp: new Date().toISOString(),
    sequence,
  };
}

console.log(`[${timestamp()}] 퍼블리셔 시작`);
console.log(`  브로커: ${brokerUrl}`);
console.log(`  토픽: ${topic}`);
console.log(`  발행 주기: 30~120초 랜덤`);
console.log(`  클라이언트 ID: ${clientId}`);
console.log('');

const client = mqtt.connect(brokerUrl, {
  clientId,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

let timer;

client.on('connect', () => {
  console.log(`[${timestamp()}] 브로커 연결 성공`);

  // 연결 즉시 첫 메시지 발행 후 랜덤 주기로 반복
  publish();
});

function publish() {
  const data = generateSensorData();
  const payload = JSON.stringify(data);
  const nextMs = randomIntervalMs();

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[${timestamp()}] 발행 실패:`, err.message);
    } else {
      console.log(`[${timestamp()}] 발행 → ${topic}`);
      console.log(`  온도: ${data.temperature}°C | 습도: ${data.humidity}% | 시퀀스: #${data.sequence}`);
      console.log(`  다음 발행까지: ${nextMs / 1000}초`);
      console.log('');
    }
  });

  timer = setTimeout(publish, nextMs);
}

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
  console.log(`\n[${timestamp()}] 퍼블리셔 종료 중...`);
  clearTimeout(timer);
  client.end(false, () => {
    console.log(`[${timestamp()}] 퍼블리셔 종료 완료`);
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
