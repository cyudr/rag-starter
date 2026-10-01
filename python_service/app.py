"""
TradingView / YFinance Python Backend Service
Provides ultra-fast real-time quotes, parallel batch fetching, sparklines,
and historical candles using yfinance for Python.
"""

import sys
import json
import urllib.parse
import warnings
from http.server import HTTPServer, BaseHTTPRequestHandler
from concurrent.futures import ThreadPoolExecutor
import yfinance as yf

warnings.filterwarnings('ignore')

PORT = 5001

SYMBOL_MAP = {
    'S&P 500': '^GSPC',
    'Nasdaq 100': '^NDX',
    'Dow 30': '^DJI',
    'BTC': 'BTC-USD',
    'BTC/USD': 'BTC-USD',
    'ETH': 'ETH-USD',
    'ETH/USD': 'ETH-USD',
    'SOL': 'SOL-USD',
    'SOL/USD': 'SOL-USD',
    'BNB': 'BNB-USD',
    'XRP': 'XRP-USD',
    'CL1!': 'CL=F',
    'GC1!': 'GC=F',
    'NG1!': 'NG=F',
    'SI1!': 'SI=F',
    'EUR/USD': 'EURUSD=X',
    'GBP/USD': 'GBPUSD=X',
    'USD/JPY': 'JPY=X',
    'AUD/USD': 'AUDUSD=X',
    'US10Y': '^TNX',
    'US02Y': '^IRX',
    'US30Y': '^TYX',
    'FTSE 100': '^FTSE',
    'DAX 40': '^GDAXI',
    'Nikkei 225': '^N225',
    'CAC 40': '^FCHI',
    'HSI': '^HSI'
}

def resolve_symbol(ticker: str) -> str:
    return SYMBOL_MAP.get(ticker, ticker)

def format_number(val):
    if val is None or val == 'N/A':
        return None
    try:
        return float(val)
    except:
        return None

def format_volume(vol):
    if not vol:
        return '—'
    try:
        num = float(vol)
        if num >= 1e12:
            return f"{num/1e12:.2f}T"
        if num >= 1e9:
            return f"{num/1e9:.2f}B"
        if num >= 1e6:
            return f"{num/1e6:.1f}M"
        if num >= 1e3:
            return f"{num/1e3:.0f}K"
        return str(int(num))
    except:
        return str(vol)

def format_market_cap(cap):
    if not cap:
        return '—'
    try:
        num = float(cap)
        if num >= 1e12:
            return f"{num/1e12:.2f}T"
        if num >= 1e9:
            return f"{num/1e9:.1f}B"
        if num >= 1e6:
            return f"{num/1e6:.1f}M"
        return str(int(num))
    except:
        return str(cap)

# In-memory metadata cache for slow fields (description, PE, etc.)
METADATA_CACHE = {}

def get_quote_data(raw_ticker: str, include_slow_info: bool = False):
    symbol = resolve_symbol(raw_ticker)
    t = yf.Ticker(symbol)
    
    fast_info = getattr(t, 'fast_info', None)
    
    current_price = 0.0
    prev_close = 0.0
    day_low = None
    day_high = None
    year_low = None
    year_high = None
    last_volume = None
    market_cap = None
    currency = 'USD'
    
    if fast_info:
        try:
            current_price = getattr(fast_info, 'last_price', None) or 0.0
            prev_close = getattr(fast_info, 'previous_close', None) or current_price
            day_low = getattr(fast_info, 'day_low', None)
            day_high = getattr(fast_info, 'day_high', None)
            year_low = getattr(fast_info, 'year_low', None)
            year_high = getattr(fast_info, 'year_high', None)
            last_volume = getattr(fast_info, 'last_volume', None)
            market_cap = getattr(fast_info, 'market_cap', None)
            currency = getattr(fast_info, 'currency', 'USD') or 'USD'
        except Exception:
            pass

    info = {}
    if include_slow_info or current_price == 0.0:
        if symbol in METADATA_CACHE and not current_price == 0.0:
            info = METADATA_CACHE[symbol]
        else:
            try:
                info = t.info or {}
                if info:
                    METADATA_CACHE[symbol] = info
            except Exception:
                info = {}

    if current_price == 0.0:
        current_price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose') or 0.0
        prev_close = info.get('regularMarketPreviousClose') or current_price

    change_amount = current_price - prev_close if (current_price and prev_close) else 0.0
    change_pct = (change_amount / prev_close * 100) if prev_close else 0.0

    return {
        'ticker': raw_ticker,
        'symbol': symbol,
        'name': info.get('shortName') or info.get('longName') or raw_ticker,
        'price': round(float(current_price), 4 if current_price < 5 else 2),
        'currency': currency,
        'changePercent': round(float(change_pct), 2),
        'changeAmount': round(float(change_amount), 4 if abs(change_amount) < 1 else 2),
        'volume': format_volume(last_volume or info.get('regularMarketVolume')),
        'marketCap': format_market_cap(market_cap or info.get('marketCap')),
        'dayLow': format_number(day_low or info.get('dayLow')),
        'dayHigh': format_number(day_high or info.get('dayHigh')),
        'yearLow': format_number(year_low or info.get('fiftyTwoWeekLow')),
        'yearHigh': format_number(year_high or info.get('fiftyTwoWeekHigh')),
        'peRatio': format_number(info.get('trailingPE')),
        'divYield': f"{info.get('dividendYield', 0)*100:.2f}%" if info.get('dividendYield') else None,
        'beta': format_number(info.get('beta')),
        'description': info.get('longBusinessSummary') or '',
        'timestamp': int(sys.version_info[0]) # indicator of live fetch
    }

class YFinanceHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Write normal HTTP access logs to stdout to avoid false stderr error alerts
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))
        sys.stdout.flush()

    def _send_json(self, status: int, data: dict):
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/health':
            self._send_json(200, {'status': 'healthy', 'service': 'yfinance-backend'})
            return

        if parsed.path == '/quote':
            ticker = params.get('ticker', ['NVDA'])[0]
            try:
                data = get_quote_data(ticker, include_slow_info=True)
                self._send_json(200, {'success': True, 'data': data})
            except Exception as e:
                self._send_json(500, {'success': False, 'error': str(e)})
            return

        if parsed.path == '/batch':
            tickers_param = params.get('tickers', ['NVDA,AAPL,TSLA'])[0]
            tickers = [t.strip() for t in tickers_param.split(',') if t.strip()]
            
            # Fetch all requested tickers in parallel for ultra-fast <1s response time
            with ThreadPoolExecutor(max_workers=min(12, max(len(tickers), 1))) as executor:
                futures = {executor.submit(get_quote_data, t, False): t for t in tickers}
                results = []
                for f in futures:
                    try:
                        results.append(f.result())
                    except Exception as e:
                        raw_t = futures[f]
                        results.append({'ticker': raw_t, 'error': str(e)})
            
            self._send_json(200, {'success': True, 'data': results})
            return

        if parsed.path == '/history':
            ticker = params.get('ticker', ['NVDA'])[0]
            period = params.get('period', ['1mo'])[0]
            interval = params.get('interval', ['1d'])[0]
            symbol = resolve_symbol(ticker)
            try:
                t = yf.Ticker(symbol)
                hist = t.history(period=period, interval=interval)
                records = []
                for index, row in hist.iterrows():
                    time_str = index.strftime('%Y-%m-%d %H:%M') if hasattr(index, 'strftime') else str(index)
                    records.append({
                        'time': time_str,
                        'price': round(float(row['Close']), 2),
                        'open': round(float(row.get('Open', row['Close'])), 2),
                        'high': round(float(row.get('High', row['Close'])), 2),
                        'low': round(float(row.get('Low', row['Close'])), 2),
                        'close': round(float(row['Close']), 2),
                        'volume': int(row.get('Volume', 0))
                    })
                self._send_json(200, {'success': True, 'ticker': ticker, 'history': records})
            except Exception as e:
                self._send_json(500, {'success': False, 'error': str(e)})
            return

        self._send_json(404, {'error': 'Endpoint not found'})

def run_server():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, YFinanceHandler)
    print(f"yfinance Python backend running on http://127.0.0.1:{PORT}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()
