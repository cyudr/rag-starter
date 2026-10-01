import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const PYTHON_PORT = 5001;

app.use(express.json());

// In-memory cache to prevent yfinance rate limits
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 15000; // 15 seconds

function getCached(key: string) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { timestamp: Date.now(), data });
}

// Spawn Python yfinance backend process
let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  const pythonScript = path.join(__dirname, 'python_service', 'app.py');
  console.log(`[Python] Starting yfinance service: python3 ${pythonScript}`);

  try {
    pythonProcess = spawn('python3', [pythonScript], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    pythonProcess.stdout?.on('data', (data) => {
      console.log(`[Python Backend]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      if (/Traceback|Error|Exception/i.test(msg) && !/warning/i.test(msg)) {
        console.warn(`[Python Backend Alert]: ${msg}`);
      } else {
        console.log(`[Python Backend]: ${msg}`);
      }
    });

    pythonProcess.on('exit', (code, signal) => {
      console.warn(`[Python Backend] exited with code ${code}, signal ${signal}. Restarting in 3s...`);
      setTimeout(startPythonBackend, 3000);
    });
  } catch (err) {
    console.error('[Python Backend] Failed to spawn python process:', err);
  }
}

// Start Python daemon
startPythonBackend();

// Helper to query python backend HTTP server
function queryPythonService(endpoint: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PYTHON_PORT,
      path: endpoint,
      method: 'GET',
      timeout: 8000,
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON from python backend: ${rawData}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Python backend query timed out'));
    });

    req.end();
  });
}

// Fallback to CLI execution if daemon is still starting up
function runPythonCli(action: string, param: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const cliScript = path.join(__dirname, 'python_service', 'fetch_cli.py');
    const child = spawn('python3', [cliScript, action, param]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`CLI error (code ${code}): ${stderr || stdout}`));
      }
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (err) {
        reject(new Error(`Failed to parse CLI output: ${stdout}`));
      }
    });
  });
}

// API Routes
app.get('/api/yfinance/status', async (_req: Request, res: Response) => {
  try {
    const health = await queryPythonService('/health');
    res.json({ success: true, pythonService: health, cachedEntries: cache.size });
  } catch (err: any) {
    res.json({ success: false, pythonService: 'initializing', error: err.message });
  }
});

app.get('/api/yfinance/quote', async (req: Request, res: Response) => {
  const ticker = String(req.query.ticker || 'NVDA').toUpperCase();
  const cacheKey = `quote_${ticker}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return res.json({ success: true, source: 'cache', data: cached });
  }

  try {
    const result = await queryPythonService(`/quote?ticker=${encodeURIComponent(ticker)}`);
    if (result && result.success) {
      setCached(cacheKey, result.data);
      return res.json({ success: true, source: 'python_yfinance', data: result.data });
    }
    throw new Error(result?.error || 'Quote retrieval failed');
  } catch (err) {
    // Attempt CLI fallback
    try {
      const cliResult = await runPythonCli('quote', ticker);
      if (cliResult && cliResult.success) {
        setCached(cacheKey, cliResult.data);
        return res.json({ success: true, source: 'python_cli', data: cliResult.data });
      }
    } catch (cliErr: any) {
      console.warn(`[yfinance fallback failed for ${ticker}]:`, cliErr.message);
    }

    res.status(502).json({
      success: false,
      error: `Could not retrieve quote for ${ticker} from yfinance backend`,
    });
  }
});

app.get('/api/yfinance/batch', async (req: Request, res: Response) => {
  const tickersStr = String(req.query.tickers || 'NVDA,AAPL,TSLA');
  const cacheKey = `batch_${tickersStr}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return res.json({ success: true, source: 'cache', data: cached });
  }

  try {
    const result = await queryPythonService(`/batch?tickers=${encodeURIComponent(tickersStr)}`);
    if (result && result.success) {
      setCached(cacheKey, result.data);
      return res.json({ success: true, source: 'python_yfinance', data: result.data });
    }
    throw new Error(result?.error || 'Batch retrieval failed');
  } catch (err) {
    // Attempt CLI fallback
    try {
      const cliResult = await runPythonCli('batch', tickersStr);
      if (cliResult && cliResult.success) {
        setCached(cacheKey, cliResult.data);
        return res.json({ success: true, source: 'python_cli', data: cliResult.data });
      }
    } catch (cliErr: any) {
      console.warn(`[yfinance batch fallback failed]:`, cliErr.message);
    }

    res.status(502).json({
      success: false,
      error: 'Could not retrieve batch quotes from yfinance backend',
    });
  }
});

app.get('/api/yfinance/history', async (req: Request, res: Response) => {
  const ticker = String(req.query.ticker || 'NVDA');
  const period = String(req.query.period || '1mo');
  const interval = String(req.query.interval || '1d');
  const cacheKey = `hist_${ticker}_${period}_${interval}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ success: true, source: 'cache', history: cached });
  }

  try {
    const result = await queryPythonService(
      `/history?ticker=${encodeURIComponent(ticker)}&period=${period}&interval=${interval}`
    );
    if (result && result.success) {
      setCached(cacheKey, result.history);
      return res.json({ success: true, source: 'python_yfinance', history: result.history });
    }
    throw new Error(result?.error || 'History retrieval failed');
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// Vite middleware or static serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
