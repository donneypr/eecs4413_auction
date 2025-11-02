# for UC4: Auction Ended Application

I created some new fields in the auctionitems model and added logic in the auctions app for when the auction ends and who the winner will be etc.
Then I created a new app called payments to handle the payment process.

What I have for payments so far:
- After a user bids on an item and the auction ends and they are the winner:
    - to get the details of the payment: GET http:localhost:8000/payments/<itemid>/details/
    - this will show the winning bid and 2 shipping options (standard and expedited) and the total costs
- to pay for the item, ONLY the winner can access it by: (only after the auction has ended)
    - POST http:localhost:8000/payments/<itemid>/pay/
    {
        "expedited_shipping": "<true_or_false>"
        "payment_method": "Credit Card"
    }

- this will print the total paid amount, the confirmation number and the date/time it was paid at.
- so far, there is no actual payment implemented. That is for future use case 5 to implement.

- As an additional feature, if user GET http:localhost:8000/payments/my-won-items/
    - They will see 2 array lists, one for unpaid_items[] and one for paid_items[] with their payment information