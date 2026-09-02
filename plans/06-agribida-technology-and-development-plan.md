# AgriBida Technology and Development Plan

## 1. Technology Plan

| Technology | Purpose |
|---|---|
| HTML | Creates the structure of each page, including navigation, forms, listing cards, tables, buttons, and dashboard sections. |
| CSS | Styles the interface and makes it responsive for desktop, tablet, and mobile screens. It will provide readable text, clear status labels, simple layouts, and accessible form messages. |
| JavaScript | Handles page interactions, role selection, sample login, produce listings, bid submission and updates, filtering, bid comparison, buyer profiles, price-dashboard displays, and form validation. |
| Browser Storage / Mock JavaScript Data | Stores the sample users, profiles, listings, bids, reviews, and market-price records. Browser local storage can preserve sample changes after a page refresh; mock JavaScript arrays can provide the initial data. |

## 2. Development Sequence

1. Create the project folder and basic files: `index.html`, `style.css`, and `script.js`.

2. Build the shared page layout using HTML: header, navigation area, main content section, buttons, forms, and notification area.

3. Create the responsive CSS design for desktop and mobile views, using clear labels, readable text, and simple cards or tables.

4. Add the agreed sample data structures in JavaScript for users, farmer profiles, buyer profiles, produce listings, bids, reviews, and market-price records.

5. Set up browser storage so sample data loads when the prototype opens and saves after listings, bids, buyer records, or price records are changed.

6. Create the role-selection or sample-login page for Farmer, Buyer, and Administrator users.

7. Develop the farmer features: dashboard, create/edit produce listing form, listing status display, and view of bids received.

8. Develop the buyer features: searchable produce listings page, listing details page, submit-bid form, and My Bids page for updating bids while listings remain open.

9. Develop the bid-comparison interface for farmers. Show the preferred price, offered price, buyer verification status, buyer rating, sample feedback, and sample market-price range together.

10. Develop the buyer profile page to display the agreed sample verification label, reputation rating, review count, and feedback.

11. Develop the price-transparency dashboard with produce and location filters plus low, average, and high sample price records.

12. Develop the administrator pages for managing sample buyer verification and reputation information, and adding, editing, or removing sample market-price records.

13. Add required-field, numeric, text-length, ownership, and bid-status validation to listings, bids, and administrator forms.

14. Add clear success, error, no-data, and notification messages without removing valid information the user already entered.

15. Test each role flow on desktop and mobile screen sizes: create listings, search listings, submit/update bids, select a bid, view profiles, filter prices, and update administrator records.

16. Reset browser storage when needed and prepare a small set of consistent sample data for the localhost class presentation.
