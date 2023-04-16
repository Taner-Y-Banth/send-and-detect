const apiKey = process.env.NSTRUMENTA_API_KEY;
const wsUrl = process.env.NSTRUMENTA_WS_URL;

describe('Page with browser client', () => {
  beforeAll(async () => {
    await page.goto(`http://localhost:3000?wsUrl=${wsUrl}&apiKey=${apiKey}`);
  });

  it('loads', async () => {
    expect.assertions(1);
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('publish');
  });

  it('connects and gets peerId', async () => {
    await page.waitForTimeout(1000);
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('p_');
  });

  it('publishes a canvas and makes a recording', async () => {    
    await page.evaluate(async () => {
      document.querySelectorAll('button').forEach((entry) => {
        if (entry.innerText.includes('TEST')) {
          entry.click();
        }
      });
    });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach((entry) => {
        if (entry.innerText.includes('START NSTRUMENTA')) {
          entry.click();
        }
      });
    });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach((entry) => {
        if (entry.innerText.includes('STOP NSTRUMENTA')) {
          entry.click();
        }
      });
    });
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('publisherId')
  });
});
