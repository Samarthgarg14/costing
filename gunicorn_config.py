import os

# Server socket
bind = '0.0.0.0:' + os.environ.get('PORT', '10000')

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', '2'))
threads = int(os.environ.get('GUNICORN_THREADS', '4'))
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '120'))

# Logging
forwarded_allow_ips = '*'
secure_scheme_headers = { 'X-Forwarded-Proto': 'https' }

# Application
wsgi_app = 'app:app'
