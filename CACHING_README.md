# Business Data Caching System

## Overview
This document describes the new caching system implemented for the businesses API to reduce the number of API calls and improve performance.

## Changes Made

### 1. API Endpoint Change
- **Old**: `/business` - Fetched all businesses every time
- **New**: `/business/modified-after` - Fetches only businesses modified after a specific timestamp

### 2. Business Model Updates
- **Added**: `createdAt` field (ISO8601 timestamp) for business creation date
- **Added**: `updatedAt` field (ISO8601 timestamp) for business modification date
- **Used for**: Tracking when businesses were last modified for caching purposes

### 3. Caching Strategy
The new system implements a timestamp-based caching strategy:

1. **First Time**: 
   - Hits `/business/modified-after` with the oldest possible timestamp (`1970-01-01T00:00:00.000Z`)
   - Stores encrypted business data locally
   - Extracts the maximum `updatedAt` date from businesses and stores that timestamp locally

2. **Subsequent Calls**:
   - Uses the locally stored timestamp to fetch only new/modified businesses from `/business/modified-after`
   - Merges new data with cached data
   - Updates the timestamp to the latest `updatedAt` date from new businesses
   - Filters out deleted businesses (`isDeleted: true`)

### 4. Local Storage Keys
- `cached_businesses`: Encrypted business data
- `last_modified_timestamp_new`: ISO8601 timestamp of last modification

### 5. Data Safety
- Business data is stored encrypted in localStorage using the same encryption key
- Only timestamps are stored in plain text (safe for localStorage)
- Raw encrypted data from API is stored without decryption

## New Functions

### `fetchBusinessesApi()`
- Main function that implements the caching logic
- Automatically handles cache management
- Returns cached data if no new businesses exist

### `clearBusinessesCache()`
- Clears all cached business data
- Resets timestamp to oldest possible date
- Useful for testing or complete reset

## UI Updates

### Refresh Button
- Added to BusinessList component (both desktop and mobile)
- Shows loading state with spinning animation
- Disabled during API calls

### Context Updates
- `BusinessesContext` now includes `forceRefreshBusinesses` function
- Maintains backward compatibility with existing components

## Benefits

1. **Reduced API Calls**: Only fetches new/modified data
2. **Better Performance**: Faster loading for returning users
3. **Offline Support**: Works with cached data when API is unavailable
4. **Data Consistency**: Automatically handles updates and deletions
5. **User Control**: Manual refresh option available

## Usage

### Automatic Caching
```typescript
// This automatically uses caching
const { businesses } = useBusinesses();
```

### Manual Refresh
```typescript
import { clearBusinessesCache } from '../services/BusinessApi';

// Force refresh when needed
clearBusinessesCache();
```

## Error Handling

- If API fails, returns cached data if available
- Graceful fallback to cached data
- Console logging for debugging
- User-friendly error states maintained

## Security Considerations

- All business data remains encrypted in localStorage
- Only timestamps are stored in plain text
- Uses existing encryption keys and methods
- No sensitive data exposure

## Testing

The caching system can be tested by:
1. Loading the page (first API call)
2. Refreshing the page (should use cache)
3. Using the refresh button (force refresh)
4. Checking localStorage for cached data
5. Monitoring network requests in DevTools

## Future Enhancements

- Cache expiration based on time
- Background sync for updates
- Cache size management
- Offline-first capabilities

## Refresh Strategies

### Automatic Caching (Default)
- **Use Case**: Normal application usage
- **Behavior**: Only fetches businesses modified since last known timestamp
- **Efficiency**: Minimal API calls, fastest loading

### Manual Refresh (Refresh Button)
- **Use Case**: User wants to check for new data
- **Behavior**: Uses existing timestamp to fetch only new/modified businesses
- **Efficiency**: Minimal API calls, ensures data is up-to-date
- **Starting Point**: Current cached timestamp (most efficient)

### Cache Clear (Reset)
- **Use Case**: Testing, complete reset, or troubleshooting
- **Behavior**: Clears all cache and resets to 1970 (oldest possible)
- **Efficiency**: Maximum API calls, complete data refresh
- **Starting Point**: 1970-01-01T00:00:00.000Z (earliest possible date)
