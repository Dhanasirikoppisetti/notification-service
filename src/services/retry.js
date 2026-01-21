export async function retry(fn, retries, delay) {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    console.log(`Retrying... attempts left ${retries}`);
    await new Promise(res => setTimeout(res, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}
