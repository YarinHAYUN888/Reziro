# GEST'S Financial CRM - Architecture Documentation

## Project Overview
A premium financial CRM/dashboard for managing rooms, bookings, and financial forecasts. Built with React + TypeScript + Vite, featuring LocalStorage persistence (V1) with architecture ready for Supabase migration (V2).

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: react-router-dom
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix)
- **Icons**: lucide-react
- **Date Handling**: date-fns
- **Charts**: recharts
- **Validation**: zod (ready for future use)

## Design System
- **Theme**: Dark Premium with Neon Green accent (#7CFF3A)
- **Components**: Glass cards with subtle borders and neon glow effects
- **Transitions**: Smooth 200ms animations
- **Typography**: Clean, crisp with proper hierarchy

## Project Structure

```
/src
├── app/
│   ├── App.tsx                    # Main app with routing & hydration
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main layout wrapper
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   └── PageHeader.tsx     # Reusable page header
│   │   ├── shared/
│   │   │   ├── StatCard.tsx       # KPI display card
│   │   │   ├── GlassCard.tsx      # Premium glass effect card
│   │   │   ├── GlowButton.tsx     # Neon green CTA button
│   │   │   ├── EmptyState.tsx     # Empty state component
│   │   │   └── MonthSelector.tsx  # Month navigation control
│   │   ├── rooms/
│   │   │   └── RoomCard.tsx       # Room display card
│   │   └── bookings/
│   │       └── BookingDialog.tsx  # Booking create/edit modal
│   └── pages/
│       ├── Dashboard.tsx          # Main dashboard with charts
│       ├── Rooms.tsx              # Room management & bookings
│       ├── QuickAdd.tsx           # Quick create forms
│       ├── Forecasts.tsx          # Financial forecasts
│       └── Admin.tsx              # Month locks & cost catalog
├── store/
│   └── useAppStore.ts             # Zustand global state
├── storage/
│   ├── LocalStorageAdapter.ts    # V1: LocalStorage persistence
│   └── SupabaseAdapter.ts        # V2: Placeholder for Supabase
├── utils/
│   ├── calcEngine.ts             # Calculation engine (Excel source of truth)
│   └── demoData.ts               # Demo data seeder
└── types/
    └── models.ts                 # TypeScript data models
```

## Data Models

### Room
- id, name, number (optional), createdAt

### Booking (Core entity)
- id, roomId, startDate, endDate
- Derived: monthKey, weekOfMonth, nightsCount, income
- Costs: selectedRoomCosts[], selectedHotelCosts[], extraExpenses
- Totals: totalRoomCosts, totalHotelCosts, totalOrderExpenses
- Metrics: potentialProfit, grossProfit, netProfit
- Customer: optional customer info
- Timestamps: createdAt, updatedAt

### CostCatalogItem
- id, type (room/hotel), label, unitCost, defaultQty, isActive

### MonthLock
- monthKey, isLocked, lockedAt (optional)

### Forecast
- id, monthKey, category, expectedAmount, confidence, createdAt

## Calculation Engine
All calculations in `/src/utils/calcEngine.ts`:

- **toMonthKey**: Date → YYYY-MM format
- **getWeekOfMonth4**: Simple 4-week model (days 1-7, 8-14, 15-21, 22+)
- **calcNightsCount**: Hotel checkout style (end - start)
- **calcIncome**: nights × pricePerNight
- **calcPotentialProfit**: income - (roomCosts + hotelCosts)
- **calcGrossProfit**: income - roomCosts
- **calcNetProfit**: grossProfit - (hotelCosts + extraExpenses)
- **normalizeAndComputeBooking**: Main function to derive all computed fields

**IMPORTANT**: Excel is the source of truth. Only adjust formulas when Excel changes.

## State Management (Zustand)

### State
- rooms[], bookings[], costCatalog[], monthLocks{}, forecasts[]
- UI state: selectedMonthKey, selectedRoomId, isHydrated

### Actions
**Rooms**: addRoom, updateRoom, deleteRoom
**Bookings**: createBooking, updateBooking, deleteBooking
**Costs**: toggleCostActive, updateCost, addCost
**Month Locks**: lockMonth, unlockMonth, isMonthLocked
**Forecasts**: addForecast, deleteForecast

### Persistence
- Auto-saves to LocalStorage with 300ms debounce
- Hydrates on app load
- Seeds demo data on first run

## Storage Architecture

### V1: LocalStorage (Current)
- Single key: `gests_v1_state`
- Stores entire AppState as JSON
- Debounced saves (300ms)

### V2: Supabase (Future)
- Interface already defined in `SupabaseAdapter.ts`
- Each model maps to a Supabase table
- Add workspaceId/userId for multi-tenant
- Swap adapter in useAppStore with minimal changes

## Routes
- `/dashboard` - KPIs, charts, top rooms
- `/rooms` - Room cards, bookings by month/week
- `/quick-add` - Fast create forms (rooms, bookings, forecasts)
- `/forecasts` - View/manage forecasts by month
- `/admin` - Month locks, cost catalog management

## Key Features

### Month Locking
- Lock past months to prevent accidental edits
- Store actions guard against locked month operations
- UI disables inputs for locked months

### Cost Catalog
- Reusable cost items (room/hotel types)
- Each booking snapshots cost values
- Active/inactive toggle
- Inline editing in Admin

### Live Calculations
- All booking metrics update in real-time
- BookingDialog shows live summary
- Dashboard aggregates instantly

### Booking Dialog
- Two columns: details (left), costs & summary (right)
- Date pickers for start/end dates
- Checkbox cost selection with qty adjustment
- Customer info (optional)
- Live profit calculations
- Validates month lock status

## Demo Data
On first load, seeds:
- 2 rooms (Ocean View Suite, Mountain Lodge)
- 6 cost items (3 room, 3 hotel)
- 2 bookings in current month
- 1 forecast

## Migration Strategy to Supabase

1. Create Supabase tables matching models
2. Implement SupabaseAdapter methods
3. Update useAppStore to use SupabaseAdapter
4. Add loading states for async operations
5. Implement real-time subscriptions
6. Add row-level security (RLS)
7. Minimal changes to UI components

## Quality Checklist
✅ App boots without errors
✅ Rooms can be created instantly
✅ Clicking room opens BookingDialog
✅ Bookings persist after refresh
✅ Costs update totals live
✅ Dashboard reflects changes instantly
✅ Month lock prevents edits
✅ Clean, typed, separated code

## Development Notes
- All monetary values use standard number type (not cents)
- Dates stored as ISO strings (YYYY-MM-DD)
- Week model: 4 weeks per month (simple)
- Night calculation: checkout style (end - start)
- All state changes trigger auto-save

---

**Version**: 1.0
**Mode**: LocalStorage (V1)
**Next**: Supabase migration (V2)
