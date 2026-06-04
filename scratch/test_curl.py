import urllib.request
import json

base_url = "http://localhost:8002/api/rankings/global"

def get_rankings(period=None, region=None, basis=None, category=None):
    params = []
    if period: params.append(f"period={period}")
    if region: params.append(f"region={region}")
    if basis: params.append(f"rank_basis={basis}")
    if category: params.append(f"category={category}")
    
    url = base_url
    if params:
        url += "?" + "&".join(params)
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

def print_titles(title, data):
    print(f"\n=== {title} (Count: {len(data)}) ===")
    for item in data[:5]:
        print(f"{item.get('position') or '-'}. {item.get('title')} (Views: {item.get('view_count') or 0}, Prev: {item.get('prev_position') or 'NEW'}, Score: {item.get('score')})")

print_titles("Today (GLOBAL, algo)", get_rankings("today", None, "algo"))
print_titles("Weekly (GLOBAL, algo)", get_rankings("weekly", None, "algo"))
print_titles("Monthly (GLOBAL, algo)", get_rankings("monthly", None, "algo"))
print_titles("Yearly (GLOBAL, algo)", get_rankings("yearly", None, "algo"))
