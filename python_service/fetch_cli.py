"""
Command Line Interface for YFinance price retrieval.
Called by Express server if needed:
python3 python_service/fetch_cli.py quote <ticker>
python3 python_service/fetch_cli.py batch <ticker1,ticker2,...>
"""

import sys
import json
from app import get_quote_data, resolve_symbol
import yfinance as yf

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Missing arguments. Usage: fetch_cli.py <quote|batch|history> <param>'}))
        sys.exit(1)

    action = sys.argv[1]
    param = sys.argv[2]

    try:
        if action == 'quote':
            data = get_quote_data(param)
            print(json.dumps({'success': True, 'data': data}))
        elif action == 'batch':
            tickers = [t.strip() for t in param.split(',') if t.strip()]
            results = []
            for t in tickers:
                try:
                    results.append(get_quote_data(t))
                except Exception as e:
                    results.append({'ticker': t, 'error': str(e)})
            print(json.dumps({'success': True, 'data': results}))
        elif action == 'history':
            symbol = resolve_symbol(param)
            period = sys.argv[3] if len(sys.argv) > 3 else '1mo'
            interval = sys.argv[4] if len(sys.argv) > 4 else '1d'
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
            print(json.dumps({'success': True, 'ticker': param, 'history': records}))
        else:
            print(json.dumps({'error': f'Unknown action: {action}'}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
