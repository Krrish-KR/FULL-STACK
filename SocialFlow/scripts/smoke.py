"""Exercise the real Docker stack. Run after docker compose up --build -d --wait."""
import json
import os
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

BASE = os.environ.get('SOCIALFLOW_URL', 'http://localhost:3000')
token = ''
def call(path, method='GET', body=None):
    req = Request(BASE + '/api' + path, method=method,
                  data=json.dumps(body).encode() if body is not None else None,
                  headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer '+token} if token else {})})
    with urlopen(req, timeout=15) as response:
        payload = response.read()
        return json.loads(payload) if payload else None

with urlopen(BASE, timeout=15) as response:
    assert response.status == 200
assert call('/health')['status'] == 'UP'
token = call('/auth/login', 'POST', {'email':'admin@socialflow.local', 'password':os.environ.get('DEMO_PASSWORD','SocialFlow123!')})['token']
assert call('/me')['role'] == 'ADMIN'
post_id = call('/posts', 'POST', {'title':'Docker smoke test','body':'Scheduler and Kafka integration check', 'channel':'LinkedIn','status':'SCHEDULED','scheduledAt':(datetime.now(timezone.utc)+timedelta(seconds=3)).isoformat()})['id']
try:
    call('/posts/'+post_id+'/comments', 'POST', {'body':'End-to-end comment'})
    assert len(call('/posts/'+post_id+'/comments')) == 1
    deadline = time.monotonic()+90
    while time.monotonic()<deadline:
        post = next(p for p in call('/posts') if p['id']==post_id)
        if post['status']=='PUBLISHED':
            break
        time.sleep(3)
    else:
        raise AssertionError('Post did not publish within 90 seconds; inspect Kafka/backend logs')
    assert post['published_at'] is not None
    assert 'summary' in call('/analytics?days=30')
    assert call('/notifications')
    call('/notifications/read','POST')
    print('PASS: frontend, JWT, database, comments, scheduler, Kafka publishing, analytics and notifications')
finally:
    post = next((p for p in call('/posts') if p['id']==post_id),None)
    if post and post['status'] != 'QUEUED':
        call('/posts/'+post_id, 'DELETE')
