"""
TradingView / YFinance Python Backend Service
Provides real-time quotes, batch tickers, sparklines, and detailed financial statistics
using yfinance for Python.
"""

import sys
import json
import urllib.parse
import warnings
from http.server import HTTPServer, BaseHTTPRequestHandler
import yfinance as yf

# Suppress standard library and third-party warnings from appearing in stderr
warnings.filterwarnings('ignore')

PORT = 5001

# Mapping common UI tickers to Yahoo Finance symbols
SYMBOL_MAP = {
    'S&P 500': '^GSPC',
    'Nasdaq 100': '^NDX',
    'Dow 30': '^DJI',
    'BTC/USD': 'BTC-USD',
    'ETH/USD': 'ETH-USD',
    'SOL/USD': 'SOL-USD',
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

def get_quote_data(raw_ticker: str):
    symbol = resolve_symbol(raw_ticker)
    t = yf.Ticker(symbol)
    info = {}
    try:
        info = t.info or {}
    except Exception as e:
        info = {}

    # Fast info fallback
    fast_info = getattr(t, 'fast_info', {})

    current_price = (
        info.get('regularMarketPrice') or
        info.get('currentPrice') or
        getattr(fast_info, 'last_price', None) or
        info.get('previousClose') or
        0.0
    )

    prev_close = (
        info.get('regularMarketPreviousClose') or
        getattr(fast_info, 'previous_close', None) or
        info.get('previousClose') or
        current_price
    )

    change_amount = current_price - prev_close if (current_price and prev_close) else 0.0
    change_pct = (change_amount / prev_close * 100) if prev_close else 0.0

    # Fetch 1-day or 5-day history for sparkline
    sparkline = []
    try:
        hist = t.history(period="5d", interval="15m")
        if not hist.empty and 'Close' in hist:
            closes = hist['Close'].dropna().tolist()
            if len(closes) > 0:
                # Subsample to 8-12 points
                step = max(1, len(closes) // 10)
                subsampled = [closes[i] for i in range(0, len(closes), step)]
                # Normalize between 4 and 32 for SVG sparkline
                c_min = min(subsampled)
                c_max = max(subsampled)
                c_range = c_max - c_min or 1.0
                sparkline = [round(32 - ((c - c_min) / c_range) * 28, 1) for c in subsampled]
    except Exception:
        sparkline = []

    return {
        'ticker': raw_ticker,
        'symbol': symbol,
        'name': info.get('shortName') or info.get('longName') or raw_ticker,
        'price': round(current_price, 4 if current_price < 5 else 2),
        'currency': info.get('currency', 'USD'),
        'changePercent': round(change_pct, 2),
        'changeAmount': round(change_amount, 4 if abs(change_amount) < 1 else 2),
        'volume': format_volume(info.get('regularMarketVolume') or getattr(fast_info, 'last_volume', None)),
        'marketCap': format_market_cap(info.get('marketCap') or getattr(fast_info, 'market_cap', None)),
        'dayLow': format_number(info.get('dayLow') or getattr(fast_info, 'day_low', None)),
        'dayHigh': format_number(info.get('dayHigh') or getattr(fast_info, 'day_high', None)),
        'yearLow': format_number(info.get('fiftyTwoWeekLow') or getattr(fast_info, 'year_low', None)),
        'yearHigh': format_number(info.get('fiftyTwoWeekHigh') or getattr(fast_info, 'year_high', None)),
        'peRatio': format_number(info.get('trailingPE')),
        'divYield': f"{info.get('dividendYield', 0)*100:.2f}%" if info.get('dividendYield') else None,
        'beta': format_number(info.get('beta')),
        'description': info.get('longBusinessSummary') or '',
        'sparkline': sparkline if sparkline else [20, 18, 22, 14, 16, 10, 6]
    }

class YFinanceHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Override BaseHTTPRequestHandler.log_message so normal access logs don't write to stderr
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
                data = get_quote_data(ticker)
                self._send_json(200, {'success': True, 'data': data})
            except Exception as e:
                self._send_json(500, {'success': False, 'error': str(e)})
            return

        if parsed.path == '/batch':
            tickers_param = params.get('tickers', ['NVDA,AAPL,TSLA'])[0]
            tickers = [t.strip() for t in tickers_param.split(',') if t.strip()]
            results = []
            for t in tickers:
                try:
                    data = get_quote_data(t)
                    results.append(data)
                except Exception as e:
                    results.append({'ticker': t, 'error': str(e)})
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
