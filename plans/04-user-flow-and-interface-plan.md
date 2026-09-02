## 1. User Flows

### Farmer User Flow

1. The farmer opens AgriBida and selects the Farmer role.
2. The farmer views the farmer dashboard, including active listings, recent bids, and sample price summaries.
3. The farmer creates a produce listing by entering the produce name, quantity, unit, location, preferred price, and availability date.
4. The system validates the entered information and publishes the listing with an “Open” status.
5. The farmer opens a listing to view submitted buyer bids.
6. The farmer compares offered prices with the sample market-price range, buyer verification label, reputation rating, and feedback.
7. The farmer selects a preferred buyer bid.
8. The system updates the listing status to “Selected” or “Closed” and displays a confirmation message.

### Buyer User Flow

1. The buyer opens AgriBida and selects the Buyer role.
2. The buyer views the buyer dashboard, which shows available produce listings and their own profile summary.
3. The buyer searches or filters listings by produce type or location.
4. The buyer opens a produce listing to review its quantity, location, preferred price, availability date, and sample market-price reference.
5. The buyer enters an offered price, requested quantity, and optional message.
6. The system validates the bid details and saves the bid for the selected open listing.
7. The buyer views or updates their submitted bids while the related listings remain open.
8. The buyer opens their profile to view their displayed verification status, reputation rating, and sample feedback.

### Administrator User Flow

1. The administrator opens AgriBida and selects the Administrator role.
2. The administrator views the administrator dashboard, which summarizes sample buyers, listings, and price records.
3. The administrator opens the buyer management section.
4. The administrator selects a buyer and updates the sample verification label, reputation rating, review count, or feedback.
5. The system validates the updated buyer information and saves the sample record.
6. The administrator opens the price management section.
7. The administrator adds, edits, or removes sample market-price records for a produce type and location.
8. The system validates the record and updates the price-transparency dashboard.

## 2. Interface Page Plan

| Page | Purpose | Key Interface Components | Allowed User Roles |
|---|---|---|---|
| Role Selection / Sample Login | Allows a user to enter the prototype using a sample account or selected role. | Role cards or dropdown, sample account selector, Enter System button, brief prototype notice. | Farmer, Buyer, Administrator |
| Farmer Dashboard | Gives farmers a summary of their listings, bids, and available price information. | Active listing cards, recent-bid summary, Create Listing button, sample price summary, navigation menu. | Farmer |
| Create or Edit Produce Listing | Allows farmers to create and manage produce listings for bidding. | Produce name field, quantity field, unit selector, location field, preferred-price field, availability-date field, Save button, validation messages. | Farmer |
| Produce Listings Page | Displays open produce listings that buyers can search and farmers can access. | Listing cards or table, search bar, produce-type filter, location filter, listing status label, View Details button. | Farmer, Buyer |
| Produce Listing Details and Bid Comparison | Shows complete listing details and related bids for farmer decision-making. | Produce details, preferred price, sample market-price range, buyer-bid cards, offered prices, buyer rating, verification label, Select Bid button. | Farmer; Buyer may view listing details without the bid comparison controls. |
| Submit or Update Bid | Allows buyers to send or revise a bid for an open produce listing. | Offered-price field, requested-quantity field, optional message field, Submit or Update button, validation and error messages. | Buyer |
| My Bids | Allows buyers to track and update bids they have submitted. | Bid list, listing name, offered price, bid status, Update Bid button, link to listing details. | Buyer |
| Buyer Profile | Displays sample buyer trust information for evaluation by farmers and buyers. | Buyer name, verification label, reputation rating, review count, sample feedback list. | Farmer, Buyer, Administrator |
| Price-Transparency Dashboard | Provides sample market-price records for comparison with produce listings and bids. | Produce filter, location filter, low-average-high price cards or chart, no-data message, sample-data notice. | Farmer, Buyer, Administrator |
| Administrator Dashboard | Provides administrators with access to buyer verification and sample price management. | Summary cards, Manage Buyers button, Manage Price Records button, navigation menu. | Administrator |
| Buyer Verification and Reputation Management | Allows administrators to maintain sample buyer trust records. | Buyer list, verification-status selector, rating field, review-count field, feedback field, Save button, validation messages. | Administrator |
| Sample Market-Price Management | Allows administrators to add, edit, or remove sample market-price records. | Produce name field, location field, low/average/high price fields, record table, Add/Edit/Delete controls, validation messages. | Administrator |
