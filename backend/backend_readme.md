#sign up and sign in  
bring up compose: docker compose up -d --build  
apply migrations locally: docker compose run --rm backend python manage.py migrate  
health check: curl -i http://localhost:8000/health/  
  
if you want to test:  
- signup  
curl -i -X POST http://localhost:8000/auth/signup/ \  
  -H "Content-Type: application/json" \  
  -H "X-CSRFToken: <csrftoken>" \  
  --cookie "csrftoken=<csrftoken>" \  
  -d '{"username":"alice","password":"pass12345","first_name":"Alice","last_name":"L",  "street_name":"Main","street_number":"12","city":"Toronto","country":"CA",  "postal_code":"M1M1M1"}'  
  
- login  
  curl -i -X POST http://localhost:8000/auth/login/ \  
  -H "Content-Type: application/json" \  
  -H "X-CSRFToken: <csrftoken>" \  
  --cookie "csrftoken=<csrftoken>" \  
  -d '{"username":"alice","password":"pass12345"}'  
  
  - Copy the sessionid from Set-Cookie from above output and check who am i.  
  curl -i http://localhost:8000/auth/me/ --cookie "sessionid=<sessionid>"  
  
  - log out  
  curl -i -X POST http://localhost:8000/auth/logout/ \  
  -H "X-CSRFToken: <csrftoken>" \  
  --cookie "csrftoken=<csrftoken>; sessionid=<sessionid>"  