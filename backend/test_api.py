import urllib.request, json

# Test 1: NSQ batch
data = json.dumps({'batch_no': 'CIP2024001', 'drug_name': 'Paracetamol'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/search/', data=data, headers={'Content-Type': 'application/json'}, method='POST')
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
print('TEST 1 - NSQ Search:')
print('  Status:', result['status'])
print('  Label:', result['result']['result_label'])
print('  Drug:', result['result']['brand_name'])
print('  Batch:', result['result']['batch_no'])
print('  Action:', result['result']['action_taken'])
print()

# Test 2: No adverse report
data2 = json.dumps({'batch_no': 'UNKNOWN999', 'drug_name': 'Paracetamol'}).encode()
req2 = urllib.request.Request('http://127.0.0.1:8000/api/v1/search/', data=data2, headers={'Content-Type': 'application/json'}, method='POST')
resp2 = urllib.request.urlopen(req2)
result2 = json.loads(resp2.read())
print('TEST 2 - No Adverse Report:')
print('  Status:', result2['status'])
print('  Message:', result2['message'][:80])

# Test 3: Spurious drug
data3 = json.dumps({'batch_no': 'AZT2024099', 'drug_name': 'Azithromycin'}).encode()
req3 = urllib.request.Request('http://127.0.0.1:8000/api/v1/search/', data=data3, headers={'Content-Type': 'application/json'}, method='POST')
resp3 = urllib.request.urlopen(req3)
result3 = json.loads(resp3.read())
print()
print('TEST 3 - Spurious Drug:')
print('  Status:', result3['status'])
print('  Label:', result3['result']['result_label'])
print('  Action:', result3['result']['action_taken'])
