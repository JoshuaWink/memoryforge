#!/usr/bin/env python3
"""Bible proxy server — fetches Bible.com pages and extracts verse data as JSON.

Zero external dependencies. Deploy to OCI or any server.
Run:  python3 bible-proxy.py --port 8787
Test: curl http://localhost:8787/api/bible/116/ROM.1
"""

import http.server
import json
import re
import threading
import time
import urllib.request
import html
import urllib.error

PORT = 8787
MAX_CACHE = 256
CACHE_TTL = 86400  # 24 hours

cache = {}
cache_lock = threading.Lock()
fetch_semaphore = threading.Semaphore(2)


def extract_verses(page_html, book_code, chapter):
    """Extract verses from Bible.com HTML via __NEXT_DATA__ JSON."""
    m = re.search(r'__NEXT_DATA__"[^>]*>(.*?)</script>', page_html, re.DOTALL)
    if not m:
        return None

    data = json.loads(m.group(1))
    pp = data.get("props", {}).get("pageProps", {})
    ci = pp.get("chapterInfo")
    if not ci:
        return None

    content = ci.get("content", "")
    reference = ci.get("reference", {})
    next_ref = ci.get("next")
    prev_ref = ci.get("previous")

    # Extract verses — each has data-usfm="BOOK.CH.V" and content spans
    bc = re.escape(book_code)
    ch = re.escape(str(chapter))
    pattern = re.compile(
        rf'data-usfm="{bc}\.{ch}\.(\d+)"[^>]*>'
        rf'(.*?)(?=data-usfm="{bc}\.{ch}\.\d+"|<div\s+class="chapter|$)',
        re.DOTALL
    )

    verses = {}
    for vm in pattern.finditer(content):
        vnum = int(vm.group(1))
        inner = vm.group(2)
        contents = re.findall(r'class="[^"]*content[^"]*"[^>]*>([^<]*)', inner)
        text = " ".join(c.strip() for c in contents if c.strip())
        text = html.unescape(re.sub(r"\s+", " ", text).strip())
        if vnum in verses:
            verses[vnum] += " " + text
        else:
            verses[vnum] = text

    return {
        "reference": reference.get("human", ""),
        "usfm": reference.get("usfm", [""])[0],
        "verses": [{"verse": v, "text": verses[v]} for v in sorted(verses.keys())],
        "next": next_ref.get("usfm", [None])[0] if next_ref else None,
        "nextHuman": next_ref.get("human") if next_ref else None,
        "previous": prev_ref.get("usfm", [None])[0] if prev_ref else None,
        "previousHuman": prev_ref.get("human") if prev_ref else None,
    }


def fetch_and_parse(version_id, usfm):
    """Fetch Bible.com page and extract verses. Cached + rate-limited."""
    cache_key = f"{version_id}/{usfm}"

    with cache_lock:
        if cache_key in cache:
            entry = cache[cache_key]
            if time.time() - entry["time"] < CACHE_TTL:
                return entry["data"]
            del cache[cache_key]

    parts = usfm.split(".")
    book_code = parts[0].upper()
    chapter = parts[1] if len(parts) > 1 else "1"

    url = f"https://www.bible.com/bible/{version_id}/{usfm}"

    with fetch_semaphore:
        req = urllib.request.Request(url, headers={
            "User-Agent": "MemoryForge/1.0 (personal scripture study tool)",
            "Accept": "text/html",
        })
        resp = urllib.request.urlopen(req, timeout=15)
        page_html = resp.read().decode("utf-8")

    result = extract_verses(page_html, book_code, chapter)

    if result:
        with cache_lock:
            if len(cache) >= MAX_CACHE:
                oldest = min(cache, key=lambda k: cache[k]["time"])
                del cache[oldest]
            cache[cache_key] = {"data": result, "time": time.time()}

    return result


class BibleProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._json_response(200, {"status": "ok", "cached": len(cache)})
            return

        # /api/bible/{versionId}/{BOOK.CHAPTER}
        m = re.match(r"^/api/bible/(\d+)/([A-Za-z0-9]+\.\d+)$", self.path)
        if not m:
            self._json_error(
                400,
                "Use /api/bible/{versionId}/{BOOK.CHAPTER} "
                "e.g. /api/bible/116/ROM.1",
            )
            return

        version_id = m.group(1)
        usfm = m.group(2).upper()

        try:
            result = fetch_and_parse(version_id, usfm)
            if result is None:
                self._json_error(404, "Could not extract verses")
                return
            self._json_response(200, result)
        except urllib.error.HTTPError as e:
            self._json_error(e.code, f"Bible.com returned {e.code}")
        except Exception as e:
            self._json_error(500, str(e))

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_response(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, code, message):
        self._json_response(code, {"error": message})

    def log_message(self, fmt, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {fmt % args}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Bible proxy for MemoryForge")
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()

    server = http.server.ThreadingHTTPServer(
        (args.host, args.port), BibleProxyHandler
    )
    print(f"Bible proxy listening on {args.host}:{args.port}")
    print(f"Example: http://localhost:{args.port}/api/bible/116/ROM.1")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down")
        server.shutdown()


if __name__ == "__main__":
    main()
