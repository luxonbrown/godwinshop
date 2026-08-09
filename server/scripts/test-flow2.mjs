const base = 'https://godwinshop-api.onrender.com';

async function main() {
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://godwinshop-client.onrender.com' },
    body: JSON.stringify({ email: 'admingodwin@gmail.com', password: 'Godwin123' }),
  });
  const setCookie = login.headers.get('set-cookie') || '';
  const sid = setCookie.split(';')[0];
  console.log('1. LOGIN status:', login.status, '| Set-Cookie:', setCookie);

  const sess = await fetch(base + '/api/auth/session', {
    headers: { Origin: 'https://godwinshop-client.onrender.com', Cookie: sid || '' },
  });
  console.log('2. SESSION status:', sess.status, '| body:', (await sess.text()).slice(0, 200));

  const admin = await fetch(base + '/api/admin/stats', {
    headers: { Origin: 'https://godwinshop-client.onrender.com', Cookie: sid || '' },
  });
  console.log('3. ADMIN /api/admin/stats status:', admin.status, '| body:', (await admin.text()).slice(0, 200));
}
main().catch(console.error);