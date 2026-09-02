# AgriBida Project Plan

## 1. System Overview

AgriBida is a responsive web application prototype designed to help Filipino farmers present their produce to potential buyers through a simple bidding process. It also provides sample price information and buyer reputation details to support more informed selling decisions.

The system will be developed using HTML, CSS, and JavaScript. It will use sample data only and will not process real payments, access live government price data, or perform actual identity verification.

## 2. Problem Addressed

Many farmers may receive low farmgate prices because they have limited access to:

- Clear and updated price information.
- Multiple potential buyers.
- Reliable information about buyer credibility.
- A simple platform for comparing offers before selling produce.

AgriBida aims to demonstrate how a digital platform can improve price awareness and encourage more transparent buyer-farmer transactions.

## 3. Target Users

- Small-scale farmers in the Philippines who want to post available produce and compare buyer offers.
- Produce buyers who want to browse available agricultural products and submit bids.
- System administrators who manage sample buyer verification and platform content.

## 4. User Roles

### Farmer

- Create and manage produce listings.
- View bids submitted by buyers.
- Compare bid prices and buyer reputation ratings.
- Select a preferred buyer from the available bids.

### Buyer

- Browse listed produce.
- View sample market-price information.
- Submit or update a bid for a produce listing.
- View their displayed verification status and reputation rating.

### Administrator

- Manage sample buyer accounts and verification labels.
- Add or update sample price records.
- Monitor produce listings and bids.
- Remove inappropriate sample listings or bids.

## 5. Core Features

### A. Produce Bidding System

**Purpose:**  
Allows farmers to receive and compare offers from different buyers instead of relying on a single buyer.

**Main functions:**

- Farmers can create a produce listing with crop type, quantity, unit, location, and preferred price.
- Buyers can view available listings and submit a bid.
- Each bid displays the offered price, buyer name, buyer rating, and verification label.
- Farmers can view all bids for their listing and mark one as the selected bid.
- The system shows the listing status, such as Open, Selected, or Closed.

### B. Buyer Verification and Reputation

**Purpose:**  
Helps farmers assess whether a buyer appears trustworthy before selecting an offer.

**Main functions:**

- Buyer profiles display a sample verification label, such as “Verified Buyer” or “Pending Verification.”
- Buyer profiles include a sample reputation score and review count.
- Farmers can view short sample feedback from previous transactions.
- Administrators can assign or update sample verification labels and ratings.

**Prototype limitation:**  
Verification labels and reputation records are demonstration data only. The system will not conduct real identity checks or validate actual business documents.

### C. Price-Transparency Dashboard

**Purpose:**  
Provides farmers with reference prices so they can compare buyer bids with estimated market ranges.

**Main functions:**

- Displays sample price ranges for selected agricultural products.
- Allows users to filter prices by produce type and location.
- Shows a simple comparison between the farmer’s preferred price, current bids, and sample market range.
- Uses charts or summary cards to make price information easy to understand.

**Prototype limitation:**  
All price records are manually prepared sample data. The dashboard will not connect to live government, market, or commercial price sources.

## 6. Supporting Features

Only the following supporting features are needed to make the core functions usable:

- **User login simulation:** Allows users to enter the system as a farmer, buyer, or administrator using sample accounts.
- **User profile page:** Displays basic sample user information, buyer verification label, and reputation score.
- **Produce listing management:** Lets farmers add, edit, and remove their own sample listings.
- **Search and filters:** Helps buyers find listings by produce type, location, and availability.
- **Notifications panel:** Shows simple in-app alerts, such as a new bid received or a selected bid.
- **Data storage simulation:** Uses JavaScript objects, arrays, or browser local storage to preserve sample listings and bids during use.

## 7. Development Priorities

### Priority 1: Essential Prototype Functions

- Responsive page layout for desktop and mobile devices.
- Sample login or role-selection page.
- Farmer produce listing form.
- Buyer listing browser.
- Bid submission and bid comparison interface.
- Sample price-transparency dashboard.

### Priority 2: Trust and Decision Support

- Buyer profile page.
- Sample verification labels.
- Reputation ratings and sample reviews.
- Farmer interface for selecting a preferred bid.

### Priority 3: Usability Improvements

- Search and filter options.
- Listing status indicators.
- Basic notifications.
- Input validation for forms.
- Improved visual design and accessibility.

## 8. Proposed Technology Scope

- **HTML:** Page structure and forms.
- **CSS:** Responsive layout, visual design, and mobile compatibility.
- **JavaScript:** Sample data handling, filtering, bidding interactions, dashboard updates, and local storage.
- **Sample data:** Predefined users, produce listings, bids, ratings, verification statuses, and price records.

## 9. Expected Outcome

The AgriBida prototype will demonstrate a practical and student-achievable approach to improving farmgate price transparency. It will show how farmers can post produce, compare buyer bids, review buyer credibility indicators, and use reference price information when deciding whom to sell to.
