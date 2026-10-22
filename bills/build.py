import json
h=open('bills/bills.html',encoding='utf8').read()
open('bills/page.js','w',encoding='utf8').write('// Generated from bills/bills.html (python3 bills/build.py). The page is served at hania360.com/bills.\nexport default '+json.dumps(h,ensure_ascii=False)+';\n')
