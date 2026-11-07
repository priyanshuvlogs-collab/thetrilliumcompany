# Merge overrides.json entries (brand/accent/domain) into each site's config.json
import json,sys,os
sw=sys.argv[1]; o=json.load(open(f'{sw}/overrides.json'))
for slug,v in o.items():
    p=f'{sw}/sites/{slug}/config.json'
    if os.path.exists(p): c=json.load(open(p)); c.update(v); json.dump(c,open(p,'w'),indent=1)
