# MYGROS INTERNATIONAL - Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn
- Supabase account (already configured)
- Google Maps API Key

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env` file and add your Google Maps API key:
```
VITE_GOOGLE_MAPS_KEY=your_actual_google_maps_api_key_here
```

The following variables are already configured:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_DEPOT_LAT` - Depot latitude (Corbas)
- `VITE_DEPOT_LNG` - Depot longitude (Corbas)

### 3. Database Setup
All database migrations are already applied in Supabase. The system includes:
- User profiles with roles (buyer, driver, admin, commercial)
- Products and categories
- Orders and order items
- Delivery tracking with GPS
- Access requests system
- Contact messages
- Conversations and messages
- Visits tracking
- Promo rules

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

## Default User Roles

### Buyer (Client)
- Default role for new registrations
- Can browse catalogue, place orders, track deliveries
- Access to promo system based on spending

### Driver
- Requires admin approval via access request
- Can view assigned deliveries
- Update delivery status
- Record client visits
- Access Google Maps integration

### Admin/Commercial
- Requires admin approval via access request
- Full access to all features
- Manage products, orders, deliveries
- Assign drivers to deliveries
- Approve access requests
- View contact messages and visits

## Important Notes

1. **Security**: Never commit API keys or secrets to git
2. **Google Maps**: Required for delivery tracking and navigation features
3. **Access Requests**: Users requesting driver/admin roles must be approved by an existing admin
4. **GPS Coordinates**: Clients enter coordinates manually during checkout (format: latitude, longitude)
5. **Promo System**: Automatically calculates based on total spending across confirmed/delivered orders

## Troubleshooting

### Google Maps not loading
- Verify `VITE_GOOGLE_MAPS_KEY` is set correctly
- Check that the API key has Maps JavaScript API enabled
- Ensure billing is enabled on your Google Cloud account

### Database errors
- Check Supabase dashboard for connection status
- Verify migrations are applied
- Check RLS policies are enabled

### Build errors
- Run `npm run typecheck` to find TypeScript issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that all required environment variables are set

## Support
For issues or questions, contact the development team.
