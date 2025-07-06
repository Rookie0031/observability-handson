require('./tracing');
const express = require('express');
const axios = require('axios');
const { trace, context } = require('@opentelemetry/api');

const app = express();
const port = 3000;

// 사용자 정보 엔드포인트 (복잡한 span 구조)
app.get('/user/:id', async (req, res) => {
  const tracer = trace.getTracer('otlp-app');
  const parentSpan = tracer.startSpan('GET /user/:id');
  await context.with(trace.setSpan(context.active(), parentSpan), async () => {
    const userId = req.params.id;
    parentSpan.setAttribute('user.id', userId);
    parentSpan.addEvent('fetching_user', { userId });

    // 1. DB 조회 span
    const dbSpan = tracer.startSpan('database_query', { parent: parentSpan });
    dbSpan.setAttribute('db.operation', 'SELECT');
    dbSpan.setAttribute('db.table', 'users');
    await new Promise(resolve => setTimeout(resolve, 100));
    dbSpan.addEvent('query_executed', { query: `SELECT * FROM users WHERE id = ${userId}` });
    dbSpan.end();

    // 2. 외부 API 호출 span (실제 호출)
    const apiSpan = tracer.startSpan('external_api_call', { parent: parentSpan });
    apiSpan.setAttribute('http.url', 'https://jsonplaceholder.typicode.com/todos/1');
    apiSpan.setAttribute('http.method', 'GET');
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
      apiSpan.addEvent('api_response', { status: response.status });
      apiSpan.setAttribute('api.status', response.status);
      apiSpan.setAttribute('api.title', response.data.title);
    } catch (err) {
      apiSpan.addEvent('api_error', { error: err.message });
      apiSpan.setAttribute('error', true);
    }
    apiSpan.end();

    // 3. 데이터 가공 span
    const processSpan = tracer.startSpan('process_user_data', { parent: parentSpan });
    await new Promise(resolve => setTimeout(resolve, 80));
    processSpan.addEvent('processing_complete');
    processSpan.end();

    parentSpan.setAttribute('http.status_code', 200);
    parentSpan.end();
    res.json({
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      traceId: parentSpan.spanContext().traceId
    });
  });
});

// 주문 정보 엔드포인트 (더 복잡한 트레이스)
app.get('/order/:id', async (req, res) => {
  const tracer = trace.getTracer('otlp-app');
  const parentSpan = tracer.startSpan('GET /order/:id');
  await context.with(trace.setSpan(context.active(), parentSpan), async () => {
    const orderId = req.params.id;
    parentSpan.setAttribute('order.id', orderId);
    parentSpan.addEvent('fetching_order', { orderId });

    // 1. 주문 DB 조회
    const dbSpan = tracer.startSpan('order_db_query', { parent: parentSpan });
    dbSpan.setAttribute('db.operation', 'SELECT');
    dbSpan.setAttribute('db.table', 'orders');
    await new Promise(resolve => setTimeout(resolve, 80));
    dbSpan.end();

    // 2. 결제 처리
    const paymentSpan = tracer.startSpan('payment_processing', { parent: parentSpan });
    await new Promise(resolve => setTimeout(resolve, 100));
    paymentSpan.addEvent('payment_success');
    paymentSpan.end();

    // 3. 알림 전송
    const notifySpan = tracer.startSpan('send_notification', { parent: parentSpan });
    await new Promise(resolve => setTimeout(resolve, 60));
    notifySpan.addEvent('notification_sent');
    notifySpan.end();

    parentSpan.setAttribute('http.status_code', 200);
    parentSpan.end();
    res.json({
      orderId,
      status: 'completed',
      traceId: parentSpan.spanContext().traceId
    });
  });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({ message: 'Hello from OTLP App!' });
});

// 에러 엔드포인트 (에러 시뮬레이션)
app.get('/error', (req, res) => {
  const tracer = trace.getTracer('otlp-app');
  const span = tracer.startSpan('GET /error');
  span.addEvent('error_occurred', { error: 'Simulated error' });
  span.setAttribute('error', true);
  span.setAttribute('http.status_code', 500);
  span.end();
  res.status(500).json({ error: 'Simulated error occurred', traceId: span.spanContext().traceId });
});

// 자동 계측만 사용하는 엔드포인트 (여러 외부 API 호출)
app.get('/auto-instrument', async (req, res) => {
  // 수동 span 생성 없이 axios로 여러 외부 API 호출
  try {
    const todo = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
    const user = await axios.get('https://jsonplaceholder.typicode.com/users/1');
    const post = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
    res.json({
      todo: todo.data,
      user: user.data,
      post: post.data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`OTLP App listening at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET / - Root endpoint');
  console.log('  GET /user/:id - User info endpoint');
  console.log('  GET /order/:id - Order info endpoint');
  console.log('  GET /error - Error simulation endpoint');
}); 