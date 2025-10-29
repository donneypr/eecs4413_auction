# sign up and sign in Testing
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


# to test out UC2, item searching, item details and creating items

- To create an item into the database: (permissions set to AllowAny so no need for auth signup/login)
curl -X POST "http://localhost:8000/items/create/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<item-name>",
    "description": "<item-description>",
    "starting_price": "1500.00",
    "current_price": "1500.00",
    "auction_type": "<FORWARD-or-DUTCH>",
    "end_time": "2025-11-15T18:00:00Z"
  }'

- To search an item using keyword: (need to be logged into an auth account)
get CSRF Token: curl -X GET "http://localhost:8000/auth/csrf/" -c cookies.txt

- login to test account for testing: 
curl -X POST "http://localhost:8000/auth/login/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $(grep csrftoken cookies.txt | awk '{print $7}')" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'

- search for item using keyword: (example with keyword laptop, laptop item already in database)
curl -X GET "http://localhost:8000/items/search/?keyword=laptop" -b cookies.txt

- get item details for item id: (item id set to 1 in this example that gives the laptop item details)
curl -X GET "http://localhost:8000/items/1/" -b cookies.txt

- log out after done testing:
curl -X POST "http://localhost:8000/auth/logout/" \
  -H "X-CSRFToken: $(grep csrftoken cookies.txt | awk '{print $7}')" \
  -b cookies.txt

- to confirm you are logged out:
curl -X GET "http://localhost:8000/auth/me/" -b cookies.txt
(should return authenticated:false)