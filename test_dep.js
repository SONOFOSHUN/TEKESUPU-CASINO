const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Take screenshot of login page
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('Login page URL:', page.url());
  
  // Get input fields
  const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, placeholder: e.placeholder })));
  console.log('Input fields:', JSON.stringify(inputs));
  
  await page.screenshot({ path: 'C:\\Users\\BICHOTEKP9X19\\AppData\\Local\\Temp\\dep_login.png', fullPage: true });
  
  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
