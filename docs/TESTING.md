# MYGROS INTERNATIONAL - Testing Checklist

## Public (Not Logged In)

### Navigation
- [ ] Visit homepage at `/`
- [ ] Browse public catalogue at `/catalogue`
- [ ] View "Qui sommes-nous" at `/about`
- [ ] Access contact form at `/contact`

### Auth
- [ ] Click "Connexion / Inscription" button in header
- [ ] Modal opens with two tabs
- [ ] Can switch between Login and Registration tabs
- [ ] Registration allows choosing "Client" or "Membre entreprise"
- [ ] If "Membre entreprise" selected, shows role dropdown (Driver/Admin) and reason field

### Contact Form
- [ ] Fill out contact form with name, email, phone, subject, message
- [ ] Submit successfully
- [ ] See success message
- [ ] Form clears after submission

## Client Role (buyer)

### Registration & Login
- [ ] Register as "Client" type
- [ ] Login with credentials
- [ ] See user name in header
- [ ] Logout button works

### Catalogue & Orders
- [ ] View catalogue at `/client/catalogue`
- [ ] Products display with images, prices, categories
- [ ] Search products by name or SKU
- [ ] Filter by category
- [ ] Sort by name or price
- [ ] Add products to cart
- [ ] Cart icon shows item count
- [ ] Open cart drawer
- [ ] Proceed to checkout
- [ ] Fill delivery address and GPS coordinates (format: lat, lng)
- [ ] Select delivery zone and time slot
- [ ] Choose payment method
- [ ] Complete order
- [ ] View orders at `/client/orders`
- [ ] Click order to see details at `/client/orders/:id`

### Promo System
- [ ] Visit `/client/promo`
- [ ] See total amount spent
- [ ] View current tier and benefits
- [ ] See progress to next tier
- [ ] View all available tiers

### Access Requests
- [ ] Visit `/client/access-requests`
- [ ] Create new access request (Driver or Admin)
- [ ] View pending/approved/rejected requests
- [ ] See request status updates

### Messages
- [ ] Access messages at `/client/messages`
- [ ] View conversations
- [ ] Send messages

## Driver Role

### Access Request
- [ ] Register as "Membre entreprise" and choose "Chauffeur"
- [ ] Admin approves request
- [ ] Role changes to "driver"
- [ ] Logout and login again to see new menu

### Deliveries
- [ ] View assigned deliveries at `/driver/deliveries`
- [ ] Click delivery to see details at `/driver/deliveries/:orderId`
- [ ] See client information (name, phone, address)
- [ ] View Google Maps with route from depot to client
- [ ] See distance and estimated duration
- [ ] Click "Ouvrir dans Google Maps" button
- [ ] Google Maps opens in new tab with navigation
- [ ] Update delivery status dropdown
- [ ] Status persists after page reload

### Visits
- [ ] Access `/visits`
- [ ] Record new client visit
- [ ] Enter client name, phone, coordinates, notes
- [ ] Submit visit
- [ ] View own visits in list

### Messages
- [ ] Access messages at `/driver/messages`
- [ ] View conversations with admin and assigned clients

## Admin/Commercial Role

### Access
- [ ] Admin approves own access request (first admin must be set in DB directly)
- [ ] Login with admin role
- [ ] See admin menu options

### Products Management
- [ ] Visit `/admin/products`
- [ ] View all products with edit/delete buttons
- [ ] Toggle product active/inactive
- [ ] Edit product details
- [ ] Delete product (with confirmation)
- [ ] Create new product
- [ ] Products sync to all catalogues (public, client, admin)

### Orders Management
- [ ] Visit `/admin/orders`
- [ ] View all orders from all clients
- [ ] Filter orders by status
- [ ] View order details
- [ ] Update order status
- [ ] Validate/reject orders

### Delivery Tracking
- [ ] Visit `/admin/tracking`
- [ ] View all orders with GPS coordinates
- [ ] Click order to see Google Maps
- [ ] Assign driver from dropdown
- [ ] Update delivery status
- [ ] See distance and duration calculated
- [ ] Map shows route from depot to client

### Access Requests
- [ ] Visit `/admin/access-requests`
- [ ] View all pending requests
- [ ] See user info and requested role
- [ ] Approve request → user role changes to requested role
- [ ] Reject request → status shows rejected
- [ ] Approved users can access their new role features

### Contact Inbox
- [ ] Visit `/admin/contact-inbox`
- [ ] View all contact form submissions
- [ ] See sender details (name, email, phone)
- [ ] Read messages
- [ ] Update status (New / In Progress / Closed)
- [ ] Status changes persist

### Visits
- [ ] View all visits from all staff
- [ ] See who created each visit
- [ ] View client details and location

### Messages
- [ ] Admin can view all conversations
- [ ] Admin can message any user

## Google Maps Integration

### Prerequisites
- [ ] `VITE_GOOGLE_MAPS_KEY` is set in `.env`
- [ ] Google Maps JavaScript API is enabled
- [ ] Billing is enabled on Google Cloud

### Testing
- [ ] Maps load without errors in admin tracking
- [ ] Maps load in driver delivery details
- [ ] Route displays from depot to client
- [ ] Distance and duration are calculated and displayed
- [ ] Markers show for depot (D) and client (C)
- [ ] "Ouvrir dans Google Maps" button works
- [ ] Opens navigation in Google Maps app/website

## Database & Security

### RLS Policies
- [ ] Clients can only see their own orders
- [ ] Drivers can only see assigned deliveries
- [ ] Admin can see all data
- [ ] Users can only see their own access requests
- [ ] Admin can see all access requests
- [ ] Contact messages can be created by anyone (anon)
- [ ] Only admin can read contact messages

### Access Control
- [ ] Cannot access admin routes without admin role
- [ ] Cannot access driver routes without driver role
- [ ] Protected routes redirect to home if not authenticated
- [ ] Role guards work correctly

## Edge Cases

- [ ] Login with invalid credentials shows error
- [ ] Registration with existing email shows error
- [ ] Empty cart cannot proceed to checkout
- [ ] Form validation works on all forms
- [ ] Loading states display during async operations
- [ ] Error messages are user-friendly
- [ ] Page refresh maintains authentication state
- [ ] GPS coordinates format validation (accepts "lat, lng")
- [ ] Orders without GPS coordinates don't break tracking page

## Performance

- [ ] Pages load quickly
- [ ] Images load properly
- [ ] No console errors in browser
- [ ] Build completes without errors: `npm run build`
- [ ] TypeScript check passes: `npm run typecheck`

## Final Verification

- [ ] Splash screen shows on first load
- [ ] Auth modal works from any page
- [ ] Navigation is consistent across roles
- [ ] All links work correctly
- [ ] Logout works and clears session
- [ ] Mobile responsive (test on phone or narrow browser)
