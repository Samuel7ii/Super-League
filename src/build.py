import json, pathlib
d = pathlib.Path(__file__).parent
raw = (d/'data_players.txt').read_text()
html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Super League: Fantasy Draft Manager</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow+Semi+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{(d/'style.css').read_text()}</style></head>
<body><div id="app"></div><div id="modal"></div><div id="toasts"></div>
<script>
const RAW_PLAYERS = {json.dumps(raw, ensure_ascii=False)};
{(d/'trolls.js').read_text()}
{(d/'engine.js').read_text()}
{(d/'ui.js').read_text()}
</script></body></html>"""
(d.parent/'index.html').write_text(html)
print(len(html))
