## 1. Functional Requirements

| ID | User Role | User Action | Required Input | System Processing | Expected Result |
|---|---|---|---|---|---|
| FR-01 | Farmer | Create a produce listing for bidding. | Produce name, quantity, unit, location, preferred price, and availability date. | Validates required fields and saves the listing as sample data with an “Open” status. | The produce listing becomes visible to buyers. |
| FR-02 | Farmer | View bids submitted for a produce listing. | Selected produce listing. | Retrieves and arranges related sample bids by offered price or submission time. | The farmer can compare buyer offers for the selected listing. |
| FR-03 | Farmer | Select a preferred buyer bid. | Selected bid and produce listing. | Updates the selected bid status and changes the listing status to “Selected” or “Closed.” | The chosen bid is marked as the farmer’s preferred offer. |
| FR-04 | Buyer | Browse available produce listings. | Optional search term, produce type, or location filter. | Filters sample listings according to the selected criteria. | The buyer sees matching open produce listings. |
| FR-05 | Buyer | Submit a bid for an available produce listing. | Selected listing, offered price, quantity requested, and optional message. | Validates bid details, records the sample bid, and links it to the buyer and listing. | The farmer can view the new bid in the listing’s bid comparison page. |
| FR-06 | Buyer | Update a previously submitted bid. | Existing bid and revised offered price or quantity. | Confirms that the bid belongs to the buyer and that the listing is still open before saving the revision. | The buyer’s revised sample bid is displayed to the farmer. |
| FR-07 | Farmer / Buyer | View a buyer profile. | Selected buyer profile. | Retrieves sample verification status, reputation rating, review count, and feedback records. | The user can assess the buyer’s displayed credibility information. |
| FR-08 | Administrator | Manage sample buyer verification and reputation records. | Buyer account, verification label, rating, review count, and sample feedback. | Validates administrator input and updates the selected buyer’s sample profile data. | Buyer credibility details are updated for display in the system. |
| FR-09 | Farmer / Buyer | View the price-transparency dashboard. | Produce type and optional location filter. | Retrieves matching sample market-price records and calculates or displays the price range. | The user sees sample low, average, and high price references. |
| FR-10 | Farmer | Compare a bid with price-reference information. | Selected produce listing and bid. | Displays the preferred price, buyer’s offered price, sample market-price range, buyer rating, and verification label in one view. | The farmer is supported in selecting a preferred bid using available sample information. |
| FR-11 | Farmer / Buyer / Administrator | Submit forms within the system. | Form fields for listings, bids, filters, or profile records. | Checks required fields, numeric values, acceptable price and quantity ranges, and valid text formats before processing. | Valid entries are saved or applied; invalid entries are not processed. |
| FR-12 | Farmer / Buyer / Administrator | Correct an invalid or incomplete entry. | Corrected form data. | Displays clear error messages beside invalid fields and retains valid previously entered information where possible. | The user can correct the error and submit the form again. |

## 2. Non-Functional Requirements and Validation Rules

| Category | Requirement / Validation Rule | Expected Standard |
|---|---|---|
| Usability | The interface shall use clear labels, readable text, and simple navigation appropriate for farmers, buyers, and administrators. | Users can access the three core features with minimal instructions. |
| Responsiveness | The prototype shall adapt its layout to desktop, tablet, and mobile screen sizes. | Main pages, forms, tables, and dashboard cards remain readable and usable on common screen widths. |
| Performance | The system shall load and filter sample data without noticeable delay. | Common actions, such as viewing listings, bids, profiles, and price records, respond within approximately 2 seconds under prototype conditions. |
| Reliability | The system shall preserve sample listings, bids, and profile changes during the active session or through browser local storage, if implemented. | Sample data remains available after normal page navigation or refresh, subject to the prototype’s storage design. |
| Data Scope | The prototype shall use predefined or locally stored sample data only. | No live market-price feeds, real transactions, payment processing, or third-party identity checks are required. |
| Security and Privacy | The prototype shall avoid collecting sensitive personal, financial, or government identification data. | Sample accounts and fictional profile details are used for demonstration purposes. |
| Maintainability | HTML, CSS, and JavaScript files shall be organized clearly, with reusable functions and understandable variable names. | Student developers can update sample data, form rules, and interface components efficiently. |
| Required Field Validation | Produce listing forms shall require produce name, quantity, unit, location, preferred price, and availability date. Bid forms shall require offered price and quantity. | The system prevents submission when required fields are empty. |
| Numeric Validation | Quantity and price inputs shall accept positive numeric values only. | Zero, negative values, letters, and invalid symbols are rejected with an error message. |
| Text Validation | Text inputs, such as produce name, location, and optional bid message, shall reject empty required entries and excessively long text. | The system displays a clear message indicating the required format or character limit. |
| Bid Status Validation | Buyers shall be allowed to submit or update bids only for listings with an “Open” status. | The system blocks bidding on selected or closed listings and informs the buyer. |
| Ownership Validation | A buyer shall be allowed to update only their own sample bid, and a farmer shall be allowed to manage only their own produce listing. | Unauthorized actions are blocked and an appropriate error message is shown. |
| Price Data Validation | Dashboard filters shall show a message when no matching sample price record exists. | The system does not display misleading price values; it informs the user that no sample data is available. |
| Error Handling | The system shall provide understandable error messages without deleting valid information already entered in the form. | Users can identify the incorrect field, correct it, and resubmit successfully. |
