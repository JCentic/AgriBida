# AgriBida Prototype Data Model

All records use mock JavaScript data or browser storage. IDs may be simple strings such as `"user-001"`.

## 1. Users

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"user-001"` | Unique identifier for the sample user. |
| name | String | `"Maria Santos"` | Displays the user’s sample name in the interface. |
| email | String | `"maria.santos@agribida.test"` | Simulated sign-in identifier, used by the registration/login forms. Must be unique. |
| password | String | `"Farmer#2026"` | Simulated credential checked at sign-in. Plaintext, prototype-only — never do this in a real system; there is no hashing or real security here. |
| role | String | `"farmer"` | Identifies whether the user is a farmer, buyer, or administrator. |
| location | String | `"Nueva Ecija"` | Shows the user’s general location. |
| profileId | String | `"farmer-001"` | Links the user to a farmer or buyer profile when applicable. |

Note (added with `plans/08-auth-redesign-prompt.md`'s follow-up): registration is
self-service for the Farmer and Buyer roles only. Administrator accounts are seeded
sample data and are not created through the public registration form.

## 2. Farmer Profiles

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"farmer-001"` | Unique identifier for the farmer profile. |
| userId | String | `"user-001"` | Links the profile to its user account. |
| farmName | String | `"Santos Vegetable Farm"` | Displays a sample farm name. |
| produceTypes | Array of Strings | `["Tomato", "Eggplant"]` | Lists the produce types the farmer commonly posts. |

## 3. Buyer Profiles

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"buyer-001"` | Unique identifier for the buyer profile. |
| userId | String | `"user-002"` | Links the profile to its user account. |
| businessName | String | `"Metro Fresh Produce"` | Displays the buyer’s sample business name. |
| verificationStatus | String | `"Verified Buyer"` | Shows the sample verification label. |
| rating | Number | `4.6` | Displays the buyer’s sample reputation score. |
| reviewCount | Number | `12` | Shows how many sample reviews support the rating. |
| feedback | Array of Strings | `["Pays on time.", "Clear communication."]` | Displays short sample feedback for farmer assessment. |

## 4. Produce Listings

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"listing-001"` | Unique identifier for the listing. |
| farmerId | String | `"farmer-001"` | Identifies the farmer who owns the listing. |
| produceName | String | `"Tomato"` | Names the produce being offered. |
| quantity | Number | `150` | States how much produce is available. |
| unit | String | `"kg"` | Defines the quantity unit. |
| location | String | `"Nueva Ecija"` | Shows where the produce is available. |
| preferredPrice | Number | `35` | Shows the farmer’s preferred price per unit. |
| availabilityDate | String | `"2026-09-10"` | Indicates when the produce is available. |
| status | String | `"Open"` | Shows whether the listing is Open, Selected, or Closed. |
| selectedBidId | String or Null | `"bid-003"` | Stores the farmer’s selected bid, if one exists. |

## 5. Bids

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"bid-003"` | Unique identifier for the bid. |
| listingId | String | `"listing-001"` | Links the bid to a produce listing. |
| buyerId | String | `"buyer-001"` | Identifies the buyer who submitted the bid. |
| offeredPrice | Number | `38` | States the buyer’s offered price per unit. |
| requestedQuantity | Number | `100` | States the quantity the buyer wants to purchase. |
| message | String | `"Can collect on September 10."` | Provides an optional sample note from the buyer. |
| submittedAt | String | `"2026-08-31T10:30:00"` | Records when the bid was submitted or updated. |
| status | String | `"Pending"` | Shows whether the bid is Pending, Selected, or Not Selected. |

## 6. Reviews or Ratings

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"review-001"` | Unique identifier for the sample review. |
| buyerId | String | `"buyer-001"` | Identifies the buyer being reviewed. |
| rating | Number | `5` | Gives the buyer a sample rating from 1 to 5. |
| comment | String | `"Buyer communicated clearly and arrived as agreed."` | Displays brief sample feedback. |
| reviewerLabel | String | `"Sample Farmer Review"` | Makes clear that the review is prototype data. |

## 7. Market-Price Records

| Field Name | Data Type | Example Value | Purpose |
|---|---|---|---|
| id | String | `"price-001"` | Unique identifier for the price record. |
| produceName | String | `"Tomato"` | Identifies the produce covered by the record. |
| location | String | `"Nueva Ecija"` | Identifies the sample market area. |
| lowPrice | Number | `30` | Shows the sample lowest reference price per unit. |
| averagePrice | Number | `36` | Shows the sample average reference price per unit. |
| highPrice | Number | `42` | Shows the sample highest reference price per unit. |
| unit | String | `"kg"` | Defines the unit used by all price values. |
| updatedDate | String | `"2026-08-30"` | Shows when the sample record was last updated. |
